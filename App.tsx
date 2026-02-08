import React, { useEffect, useRef, useState, useCallback } from 'react';
import { LiveService } from './services/liveService';
import { generateOutfitChange } from './services/imageGenService';
import { captureFrameAsBase64 } from './utils/imageUtils';
import GeneratedImageModal from './components/GeneratedImageModal';
import SlideshowModal from './components/SlideshowModal';
import IntroModal from './components/IntroModal';
import Visualizer from './components/Visualizer';
import { ConnectionState, GeneratedImage } from './types';
import { VIDEO_FRAME_RATE_MS } from './constants';

const App: React.FC = () => {
  // UI State
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
  const [imageHistory, setImageHistory] = useState<GeneratedImage[]>([]);
  const [isSlideshowOpen, setIsSlideshowOpen] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const liveServiceRef = useRef<LiveService | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextAudioStartTimeRef = useRef<number>(0);
  const videoIntervalRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const imageHistoryRef = useRef<GeneratedImage[]>([]);
  const activeAudioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Sync state to ref for access in callbacks
  useEffect(() => {
    imageHistoryRef.current = imageHistory;
  }, [imageHistory]);

  // Initialize Audio Context for playback
  useEffect(() => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  // Handle Interruption: Stop all playing audio
  const handleInterruption = useCallback(() => {
     // Stop all currently playing sources
     activeAudioSourcesRef.current.forEach(source => {
        try {
            source.stop();
        } catch (e) {
            // Ignore errors if source already stopped
        }
     });
     activeAudioSourcesRef.current.clear();
     
     // Reset timing cursor
     nextAudioStartTimeRef.current = 0;
     setIsAiSpeaking(false);
  }, []);

  // Handler for incoming audio from AI
  const handleAudioData = useCallback((audioBuffer: AudioBuffer) => {
    if (!audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    // Schedule playback
    const currentTime = ctx.currentTime;
    // If next start time is behind current time (due to delay or interruption reset), snap to now
    if (nextAudioStartTimeRef.current < currentTime) {
        nextAudioStartTimeRef.current = currentTime;
    }
    
    const startTime = nextAudioStartTimeRef.current;
    source.start(startTime);
    nextAudioStartTimeRef.current = startTime + audioBuffer.duration;

    // Track active source
    activeAudioSourcesRef.current.add(source);

    // Simple speaking indicator logic
    setIsAiSpeaking(true);
    source.onended = () => {
        activeAudioSourcesRef.current.delete(source);
        // If current time is close to next start time, we might still be speaking
        // This is a rough approximation for UI
        if (activeAudioSourcesRef.current.size === 0 && ctx.currentTime >= nextAudioStartTimeRef.current - 0.1) {
            setIsAiSpeaking(false);
        }
    };
  }, []);

  // Handler for tool calls
  const handleToolCall = useCallback(async (name: string, args: any) => {
    if (name === 'generate_outfit' && videoRef.current) {
      try {
        setIsProcessingImage(true);
        const description = args.description;
        
        // 1. Capture high-quality frame
        const currentFrameBase64 = await captureFrameAsBase64(videoRef.current, 0.9);
        
        // 2. Call Nano Banana
        const newImageBase64 = await generateOutfitChange(currentFrameBase64, description);
        
        const newImageObj: GeneratedImage = {
            imageUrl: newImageBase64,
            prompt: description,
        };

        // 3. Update State & History
        setGeneratedImage(newImageObj);
        setImageHistory(prev => [...prev, newImageObj]);
        
        return { success: true };
      } catch (err) {
        console.error('Tool execution failed', err);
        return { success: false, error: 'Failed to generate image' };
      } finally {
        setIsProcessingImage(false);
      }
    } else if (name === 'generate_slideshow') {
        setIsSlideshowOpen(true);
        return { success: true, message: 'Slideshow started' };
    } else if (name === 'download_all_images') {
        const images = imageHistoryRef.current;
        if (images.length === 0) {
            return { success: false, message: 'No images to download.' };
        }

        let count = 0;
        images.forEach((img, idx) => {
            // Stagger downloads to prevent browser blocking
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = img.imageUrl;
                link.download = `stylevision-outfit-${idx + 1}-${Date.now()}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }, idx * 400);
            count++;
        });
        
        return { success: true, message: `Started download for ${count} images.` };
    }
    return { success: false, error: 'Unknown tool' };
  }, []);

  // Cleanup function
  const stopSession = useCallback(() => {
    if (videoIntervalRef.current) {
      clearInterval(videoIntervalRef.current);
      videoIntervalRef.current = null;
    }
    
    if (liveServiceRef.current) {
      liveServiceRef.current.disconnect();
      liveServiceRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    // Stop any playing audio
    activeAudioSourcesRef.current.forEach(source => {
        try { source.stop(); } catch(e) {}
    });
    activeAudioSourcesRef.current.clear();

    setConnectionState(ConnectionState.DISCONNECTED);
    setIsAiSpeaking(false);
    nextAudioStartTimeRef.current = 0;
    setImageHistory([]); // Optional: Clear history on session end? Or keep it? Keeping it cleared for new session.
    setIsSlideshowOpen(false);
  }, []);

  // Start Session
  const startSession = async () => {
    try {
      setConnectionState(ConnectionState.CONNECTING);
      setError(null);
      setImageHistory([]); // Clear previous session history

      // 1. Get User Media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
        },
        video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
        },
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true; // Local playback muted to avoid echo
        await videoRef.current.play();
      }

      // 2. Initialize Live Service
      const liveService = new LiveService({
        onConnect: () => setConnectionState(ConnectionState.CONNECTED),
        onDisconnect: () => stopSession(),
        onError: (err) => {
          setError(err.message);
          stopSession();
        },
        onAudioData: handleAudioData,
        onToolCall: handleToolCall,
        onInterrupted: handleInterruption,
      });

      liveServiceRef.current = liveService;
      await liveService.connect(stream);

      // 3. Start Video Frame Loop (Low FPS for context)
      videoIntervalRef.current = window.setInterval(async () => {
         if (videoRef.current && liveServiceRef.current) {
            try {
                // Send a lower quality frame for streaming context to save bandwidth/latency
                const base64 = await captureFrameAsBase64(videoRef.current, 0.5);
                liveServiceRef.current.sendVideoFrame(base64);
            } catch (e) {
                console.error("Frame capture error", e);
            }
         }
      }, VIDEO_FRAME_RATE_MS);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to access camera/microphone');
      setConnectionState(ConnectionState.ERROR);
    }
  };

  const toggleConnection = () => {
    if (connectionState === ConnectionState.CONNECTED || connectionState === ConnectionState.CONNECTING) {
      stopSession();
    } else {
      startSession();
    }
  };

  return (
    <div className="relative h-screen w-screen bg-black overflow-hidden font-sans text-white">
      {/* Background Video Feed */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]" 
        playsInline
      />
      
      {/* Overlay: Gradient for text readability */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/60 via-transparent to-black/60" />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start pointer-events-none z-10">
        <div>
           <h1 className="text-2xl font-bold tracking-tight">StyleVision</h1>
           <p className="text-sm text-neutral-400">AI Fashion Advisor</p>
        </div>
        
        {/* Connection Status Indicator */}
        <div className="flex items-center gap-2">
            {isProcessingImage && (
                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-purple-500/30">
                     <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                     <span className="text-xs font-medium text-purple-200">Generating Look...</span>
                </div>
            )}
            
            <div className={`px-3 py-1 rounded-full backdrop-blur-md text-xs font-medium border ${
                connectionState === ConnectionState.CONNECTED 
                ? 'bg-green-500/20 border-green-500/50 text-green-200' 
                : connectionState === ConnectionState.ERROR
                ? 'bg-red-500/20 border-red-500/50 text-red-200'
                : 'bg-white/10 border-white/20 text-neutral-300'
            }`}>
                {connectionState}
            </div>
        </div>
      </div>

      {/* Center Action Area (Bottom) */}
      <div className="absolute bottom-8 inset-x-0 flex flex-col items-center justify-center gap-6 pointer-events-auto z-10">
         
         {error && (
             <div className="bg-red-500/80 backdrop-blur text-white px-4 py-2 rounded-lg text-sm max-w-xs text-center mb-4">
                 {error}
             </div>
         )}

         {/* Audio Visualizer (only when connected and AI speaking) */}
         <div className={`transition-opacity duration-300 ${isAiSpeaking ? 'opacity-100' : 'opacity-0'}`}>
            <Visualizer isActive={isAiSpeaking} />
         </div>

         {/* Main Control Button */}
         <button
            onClick={toggleConnection}
            disabled={connectionState === ConnectionState.CONNECTING}
            className={`
                group relative flex items-center justify-center w-20 h-20 rounded-full border-2 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-white/20
                ${connectionState === ConnectionState.CONNECTED 
                   ? 'bg-red-500/20 border-red-500 hover:bg-red-500/40' 
                   : 'bg-white/10 border-white/50 hover:bg-white/20 hover:scale-105'}
            `}
         >
            {connectionState === ConnectionState.CONNECTING ? (
                 <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
            ) : connectionState === ConnectionState.CONNECTED ? (
                <div className="w-8 h-8 bg-red-500 rounded-sm shadow-[0_0_15px_rgba(239,68,68,0.6)]" />
            ) : (
                <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-white border-b-[10px] border-b-transparent ml-1 drop-shadow-lg" />
            )}
            
            {/* Pulsing ring when connected */}
            {connectionState === ConnectionState.CONNECTED && (
                <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-20 animate-ping"></span>
            )}
         </button>
         
         <div className="flex flex-col items-center gap-1">
             <p className="text-xs text-neutral-400 font-medium tracking-wide">
                 {connectionState === ConnectionState.CONNECTED ? 'Tap to Stop' : 'Tap to Start Advisor'}
             </p>
             <p className="text-[10px] text-white/30 font-light mt-1">
                Created with 💖 by <a href="https://akshatbindal.cc.cc" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors underline decoration-white/20">Akshat Bindal</a>
             </p>
         </div>
      </div>

      {/* Generated Image Modal (Single View) */}
      <GeneratedImageModal 
        image={generatedImage} 
        onClose={() => setGeneratedImage(null)} 
      />

      {/* Slideshow Modal (Multi View) */}
      {isSlideshowOpen && (
          <SlideshowModal 
            images={imageHistory}
            onClose={() => setIsSlideshowOpen(false)}
          />
      )}

      {/* Intro Feature Modal */}
      {showIntro && (
          <IntroModal onClose={() => setShowIntro(false)} />
      )}
    </div>
  );
};

export default App;