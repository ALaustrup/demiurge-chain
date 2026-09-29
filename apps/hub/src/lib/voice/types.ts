/**
 * Voice API Types for Grok Voice Agent and WebRTC
 * 
 * Supports:
 * - Grok Voice Agent API (wss://api.x.ai/v1/realtime)
 * - WebRTC peer-to-peer voice chat
 */

// ============ Voice Selection ============

export type GrokVoice = 'Ara' | 'Rex' | 'Sal' | 'Eve' | 'Leo';

export const VOICE_DESCRIPTIONS: Record<GrokVoice, { type: string; tone: string; description: string }> = {
  Ara: { type: 'Female', tone: 'Warm, friendly', description: 'Default voice, balanced and conversational' },
  Rex: { type: 'Male', tone: 'Confident, clear', description: 'Professional and articulate' },
  Sal: { type: 'Neutral', tone: 'Smooth, balanced', description: 'Versatile voice suitable for various contexts' },
  Eve: { type: 'Female', tone: 'Energetic, upbeat', description: 'Engaging and enthusiastic' },
  Leo: { type: 'Male', tone: 'Authoritative, strong', description: 'Decisive and commanding' },
};

// ============ Audio Format ============

export type AudioFormatType = 'audio/pcm' | 'audio/pcmu' | 'audio/pcma';

export type SampleRate = 8000 | 16000 | 21050 | 24000 | 32000 | 44100 | 48000;

export interface AudioFormat {
  type: AudioFormatType;
  rate?: SampleRate; // Only applicable for audio/pcm
}

export interface AudioConfig {
  input: { format: AudioFormat };
  output: { format: AudioFormat };
}

// Default audio configuration (24kHz PCM - recommended)
export const DEFAULT_AUDIO_CONFIG: AudioConfig = {
  input: { format: { type: 'audio/pcm', rate: 24000 } },
  output: { format: { type: 'audio/pcm', rate: 24000 } },
};

// ============ Connection State ============

export type VoiceConnectionState = 
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

// ============ Session Configuration ============

export interface TurnDetection {
  type: 'server_vad' | null; // server_vad for automatic, null for manual
}

export interface SessionConfig {
  voice?: GrokVoice;
  instructions?: string;
  turn_detection?: TurnDetection;
  audio?: AudioConfig;
  tools?: SessionTool[];
}

export interface SessionTool {
  type: 'file_search' | 'web_search' | 'x_search' | 'function';
  // For file_search
  vector_store_ids?: string[];
  max_num_results?: number;
  // For x_search
  allowed_x_handles?: string[];
  // For function
  name?: string;
  description?: string;
  parameters?: Record<string, any>;
}

// ============ Client Events (sent to server) ============

export interface SessionUpdateEvent {
  type: 'session.update';
  session: SessionConfig;
}

export interface InputAudioBufferAppendEvent {
  type: 'input_audio_buffer.append';
  audio: string; // Base64 encoded audio
}

export interface InputAudioBufferClearEvent {
  type: 'input_audio_buffer.clear';
}

export interface InputAudioBufferCommitEvent {
  type: 'input_audio_buffer.commit';
}

export interface ConversationItemCreateEvent {
  type: 'conversation.item.create';
  previous_item_id?: string;
  item: {
    type: 'message' | 'function_call_output';
    role?: 'user' | 'assistant';
    content?: Array<{
      type: 'input_text' | 'input_audio';
      text?: string;
    }>;
    call_id?: string;
    output?: string;
  };
}

export interface ResponseCreateEvent {
  type: 'response.create';
  response?: {
    modalities?: Array<'text' | 'audio'>;
  };
}

export type ClientEvent =
  | SessionUpdateEvent
  | InputAudioBufferAppendEvent
  | InputAudioBufferClearEvent
  | InputAudioBufferCommitEvent
  | ConversationItemCreateEvent
  | ResponseCreateEvent;

// ============ Server Events (received from server) ============

export interface SessionUpdatedEvent {
  event_id: string;
  type: 'session.updated';
  session: SessionConfig;
}

export interface ConversationCreatedEvent {
  event_id: string;
  type: 'conversation.created';
  conversation: {
    id: string;
    object: 'realtime.conversation';
  };
}

export interface InputAudioBufferSpeechStartedEvent {
  event_id: string;
  type: 'input_audio_buffer.speech_started';
  item_id: string;
}

export interface InputAudioBufferSpeechStoppedEvent {
  event_id: string;
  type: 'input_audio_buffer.speech_stopped';
  item_id: string;
}

export interface InputAudioBufferClearedEvent {
  event_id: string;
  type: 'input_audio_buffer.cleared';
}

export interface InputAudioBufferCommittedEvent {
  event_id: string;
  type: 'input_audio_buffer.committed';
  previous_item_id: string;
  item_id: string;
}

export interface ConversationItemAddedEvent {
  event_id: string;
  type: 'conversation.item.added';
  previous_item_id: string;
  item: {
    id: string;
    object: 'realtime.item';
    type: 'message';
    status: 'completed' | 'in_progress';
    role: 'user' | 'assistant';
    content: Array<{
      type: 'input_audio' | 'input_text' | 'audio' | 'text';
      transcript?: string;
      text?: string;
    }>;
  };
}

export interface ConversationItemTranscriptionCompletedEvent {
  event_id: string;
  type: 'conversation.item.input_audio_transcription.completed';
  item_id: string;
  transcript: string;
}

export interface ResponseCreatedEvent {
  event_id: string;
  type: 'response.created';
  response: {
    id: string;
    object: 'realtime.response';
    status: 'in_progress' | 'completed';
    output: any[];
  };
}

export interface ResponseOutputItemAddedEvent {
  event_id: string;
  type: 'response.output_item.added';
  response_id: string;
  output_index: number;
  item: {
    id: string;
    object: 'realtime.item';
    type: 'message';
    status: 'in_progress' | 'completed';
    role: 'assistant';
    content: any[];
  };
}

export interface ResponseDoneEvent {
  event_id: string;
  type: 'response.done';
  response: {
    id: string;
    object: 'realtime.response';
    status: 'completed';
  };
}

export interface ResponseOutputAudioTranscriptDeltaEvent {
  event_id: string;
  type: 'response.output_audio_transcript.delta';
  response_id: string;
  item_id: string;
  delta: string;
}

export interface ResponseOutputAudioTranscriptDoneEvent {
  event_id: string;
  type: 'response.output_audio_transcript.done';
  response_id: string;
  item_id: string;
}

export interface ResponseOutputAudioDeltaEvent {
  event_id: string;
  type: 'response.output_audio.delta';
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  delta: string; // Base64 encoded audio
}

export interface ResponseOutputAudioDoneEvent {
  event_id: string;
  type: 'response.output_audio.done';
  response_id: string;
  item_id: string;
}

export interface ResponseFunctionCallArgumentsDoneEvent {
  event_id: string;
  type: 'response.function_call_arguments.done';
  name: string;
  call_id: string;
  arguments: string;
}

export interface ErrorEvent {
  event_id: string;
  type: 'error';
  error: {
    type: string;
    code: string;
    message: string;
    param?: string;
  };
}

export type ServerEvent =
  | SessionUpdatedEvent
  | ConversationCreatedEvent
  | InputAudioBufferSpeechStartedEvent
  | InputAudioBufferSpeechStoppedEvent
  | InputAudioBufferClearedEvent
  | InputAudioBufferCommittedEvent
  | ConversationItemAddedEvent
  | ConversationItemTranscriptionCompletedEvent
  | ResponseCreatedEvent
  | ResponseOutputItemAddedEvent
  | ResponseDoneEvent
  | ResponseOutputAudioTranscriptDeltaEvent
  | ResponseOutputAudioTranscriptDoneEvent
  | ResponseOutputAudioDeltaEvent
  | ResponseOutputAudioDoneEvent
  | ResponseFunctionCallArgumentsDoneEvent
  | ErrorEvent;

// ============ WebRTC Types ============

export type WebRTCConnectionState = 
  | 'new'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'failed'
  | 'closed';

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'join' | 'leave' | 'user-joined' | 'user-left';
  roomId: string;
  userId: string;
  payload?: RTCSessionDescriptionInit | RTCIceCandidateInit | null;
}

export interface VoiceParticipant {
  qorId: string;
  isMuted: boolean;
  isSpeaking: boolean;
  audioLevel: number;
}

// ============ Ephemeral Token ============

export interface EphemeralTokenResponse {
  client_secret: {
    value: string;
    expires_at: number;
  };
}
