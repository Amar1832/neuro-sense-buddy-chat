
import { Emotion } from '@/components/EmotionDetector';

export interface ChatMessage {
  isUser: boolean;
  text: string;
  timestamp: Date;
  emotion?: Emotion;
}

// Voice settings
export type VoiceGender = 'female' | 'male';
export type VoiceAccent = 'standard' | 'british' | 'australian' | 'indian';

export interface VoiceOption {
  id: string;
  name: string; 
  gender: VoiceGender;
  accent?: VoiceAccent;
}
