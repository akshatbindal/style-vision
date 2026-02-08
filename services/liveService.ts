import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from '@google/genai';
import { LIVE_API_MODEL, SYSTEM_INSTRUCTION, AUDIO_INPUT_SAMPLE_RATE, AUDIO_OUTPUT_SAMPLE_RATE } from '../constants';
import { createPcmBlob, decode, pcmToAudioBuffer } from '../utils/audioUtils';

// Define the tool for image generation
const generateOutfitTool: FunctionDeclaration = {
  name: 'generate_outfit',
  description: 'Generates a new image of the user wearing a specific outfit based on the description.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      description: {
        type: Type.STRING,
        description: 'A detailed visual description of the clothing/outfit to generate.',
      },
    },
    required: ['description'],
  },
};

interface LiveServiceCallbacks {
  onConnect: () => void;
  onDisconnect: () => void;
  onError: (error: Error) => void;
  onAudioData: (buffer: AudioBuffer) => void;
  onToolCall: (name: string, args: Record<string, any>) => Promise<any>;
}

export class LiveService {
  private ai: GoogleGenAI;
  private sessionPromise: Promise<any> | null = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null;
  private isConnected = false;

  constructor(private callbacks: LiveServiceCallbacks) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error('API_KEY is missing');
    this.ai = new GoogleGenAI({ apiKey });
  }

  async connect(stream: MediaStream) {
    try {
      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: AUDIO_INPUT_SAMPLE_RATE,
      });
      this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: AUDIO_OUTPUT_SAMPLE_RATE,
      });

      this.sessionPromise = this.ai.live.connect({
        model: LIVE_API_MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ functionDeclarations: [generateOutfitTool] }],
        },
        callbacks: {
          onopen: this.handleOpen.bind(this, stream),
          onmessage: this.handleMessage.bind(this),
          onclose: this.handleClose.bind(this),
          onerror: (e) => this.callbacks.onError(new Error('Live API Error')),
        },
      });
      
      this.isConnected = true;

    } catch (error) {
      this.callbacks.onError(error as Error);
    }
  }

  private handleOpen(stream: MediaStream) {
    this.callbacks.onConnect();
    this.setupAudioInput(stream);
  }

  private setupAudioInput(stream: MediaStream) {
    if (!this.inputAudioContext) return;

    this.mediaStreamSource = this.inputAudioContext.createMediaStreamSource(stream);
    this.scriptProcessor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

    this.scriptProcessor.onaudioprocess = (e) => {
      if (!this.isConnected || !this.sessionPromise) return;

      const inputData = e.inputBuffer.getChannelData(0);
      const pcmBlob = createPcmBlob(inputData);

      this.sessionPromise.then((session) => {
        session.sendRealtimeInput({ media: pcmBlob });
      });
    };

    this.mediaStreamSource.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.inputAudioContext.destination);
  }

  async sendVideoFrame(base64Image: string) {
    if (!this.isConnected || !this.sessionPromise) return;

    this.sessionPromise.then((session) => {
      session.sendRealtimeInput({
        media: {
          mimeType: 'image/jpeg',
          data: base64Image,
        },
      });
    });
  }

  private async handleMessage(message: LiveServerMessage) {
    // Handle Audio
    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (base64Audio && this.outputAudioContext) {
      const pcmData = decode(base64Audio);
      const audioBuffer = pcmToAudioBuffer(pcmData, this.outputAudioContext, AUDIO_OUTPUT_SAMPLE_RATE);
      this.callbacks.onAudioData(audioBuffer);
    }

    // Handle Tool Calls
    if (message.toolCall) {
      for (const call of message.toolCall.functionCalls) {
        if (call.name === 'generate_outfit') {
          // Execute the client-side logic for the tool
          const result = await this.callbacks.onToolCall(call.name, call.args);
          
          // Send response back to model
          this.sessionPromise?.then((session) => {
            session.sendToolResponse({
              functionResponses: {
                id: call.id,
                name: call.name,
                response: { result: 'Image generated successfully' },
              },
            });
          });
        }
      }
    }
  }

  private handleClose() {
    this.callbacks.onDisconnect();
    this.cleanup();
  }

  async disconnect() {
    this.isConnected = false;
    // Note: The SDK doesn't expose a direct close method on the session object easily
    // We rely on breaking the input stream and letting the server timeout or
    // explicitly closing audio contexts.
    // Ideally, we would call session.close() if available in the promise result.
    if(this.sessionPromise) {
        // Just stop sending data.
    }
    this.cleanup();
  }

  private cleanup() {
    this.scriptProcessor?.disconnect();
    this.mediaStreamSource?.disconnect();
    this.inputAudioContext?.close();
    this.outputAudioContext?.close();
    this.scriptProcessor = null;
    this.mediaStreamSource = null;
    this.inputAudioContext = null;
    this.outputAudioContext = null;
  }
}
