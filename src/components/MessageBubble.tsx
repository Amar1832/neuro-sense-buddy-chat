
import React from 'react';
import { cn } from '@/lib/utils';
import { Emotion } from './EmotionDetector';

interface MessageBubbleProps {
  message: string;
  isUser: boolean;
  emotion?: Emotion;
  timestamp: Date;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isUser, emotion, timestamp }) => {
  const getEmotionColor = () => {
    if (!emotion) return 'bg-neutral';
    
    switch (emotion) {
      case 'happy':
        return 'bg-happy';
      case 'sad':
        return 'bg-sad';
      case 'angry':
        return 'bg-angry';
      case 'fearful':
        return 'bg-fearful';
      case 'disgusted':
        return 'bg-disgusted';
      case 'surprised':
        return 'bg-surprised';
      default:
        return 'bg-neutral';
    }
  };

  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp);

  return (
    <div className={cn(
      "flex mb-4",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-xs md:max-w-md lg:max-w-lg rounded-2xl px-4 py-3 shadow-md",
        isUser 
          ? "bg-primary text-primary-foreground rounded-tr-none" 
          : cn("rounded-tl-none", getEmotionColor())
      )}>
        <p className="text-sm md:text-base">{message}</p>
        <div className={cn(
          "text-xs mt-1",
          isUser ? "text-primary-foreground/70" : "text-foreground/70"
        )}>
          {formattedTime}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
