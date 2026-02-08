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

// Define the tool for slideshow
const generateSlideshowTool: FunctionDeclaration = {
  name: 'generate_slideshow',
  description: 'Triggers a slideshow playback of the previously generated outfits.',
  parameters: {
    type: Type.OBJECT,
    properties: {}, // No arguments needed
  },
};

// Define the tool for downloading images
const downloadAllImagesTool: FunctionDeclaration = {
  name: 'download_all_images',
  description: 'Downloads all the outfit images generated during the session to the user\'s device.',
  parameters: {
    type: Type.OBJECT,
    properties: {}, // No arguments needed
  },
};

interface LiveServiceCallbacks {
  onConnect: () => void;
  onDisconnect: () => void;
  onError: (error: Error) => void;
  onAudioData: (buffer: AudioBuffer) => void;
  onToolCall: (name: string, args: Record<string, any>) => Promise<any>;
  onInterrupted: () => void;
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
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }, // Using 'Kore' for a smooth, pleasant voice
          },
          tools: [{ functionDeclarations: [generateOutfitTool, generateSlideshowTool, downloadAllImagesTool] }],
        },
        callbacks: {
          onopen: this.handleOpen.bind(this, stream),
          onmessage: this.handleMessage.bind(this),
          onclose: this.handleClose.bind(this),
          onerror: (e) => this.callbacks.onError(new Error('Live API Error: ' + e.message)),
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
    // 2048 buffer size = ~128ms latency at 16kHz, which is a good balance for VAD and stability.
    // Too small (1024) can cause glitches on some devices; too large (4096) delays VAD.
    this.scriptProcessor = this.inputAudioContext.createScriptProcessor(2048, 1, 1);

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
    try {
        // Handle Interruption
        if (message.serverContent?.interrupted) {
          this.callbacks.onInterrupted();
          return;
        }
    
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
             console.log(`Executing tool: ${call.name}`);
             const result = await this.callbacks.onToolCall(call.name, call.args);
             
             this.sessionPromise?.then((session) => {
               session.sendToolResponse({
                 functionResponses: {
                   id: call.id,
                   name: call.name,
                   response: { result: result || 'OK' },
                 },
               });
             });
          }
        }
    } catch (e) {
        console.error("Error handling message:", e);
    }
  }

  private handleClose() {
    this.callbacks.onDisconnect();
    this.cleanup();
  }

  async disconnect() {
    this.isConnected = false;
    // Effectively stop sending data
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