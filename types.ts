export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}

export interface GeneratedImage {
  imageUrl: string;
  prompt: string;
}

export interface AudioStreamConfig {
  sampleRate: number;
}

// Helper types for the Gemini API responses not fully exported or for internal use
export interface ToolCallArgs {
  description: string;
}
