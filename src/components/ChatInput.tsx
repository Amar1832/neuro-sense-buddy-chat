
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, MicOff, Send, Camera, CameraOff } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isListening: boolean;
  toggleListening: () => void;
  isCameraActive: boolean;
  toggleCamera: () => void;
  isProcessing: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isListening,
  toggleListening,
  isCameraActive,
  toggleCamera,
  isProcessing
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (message.trim() && !isProcessing) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [message]);

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex items-end bg-muted/20 rounded-2xl border p-2">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? "Listening..." : "Type a message..."}
          className="min-h-10 border-0 bg-transparent focus-visible:ring-0 resize-none p-3 rounded-xl"
          disabled={isListening || isProcessing}
        />
        
        <div className="flex items-center gap-2 pl-2">
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            onClick={toggleCamera}
            className={`${isCameraActive ? 'text-primary' : 'text-muted-foreground'}`}
            disabled={isProcessing}
          >
            {isCameraActive ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
            <span className="sr-only">{isCameraActive ? 'Disable camera' : 'Enable camera'}</span>
          </Button>
          
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            onClick={toggleListening}
            className={`${isListening ? 'text-primary animate-pulse' : 'text-muted-foreground'}`}
            disabled={isProcessing}
          >
            {isListening ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            <span className="sr-only">{isListening ? 'Stop listening' : 'Start listening'}</span>
          </Button>
          
          <Button 
            type="submit" 
            variant="default" 
            size="icon" 
            disabled={!message.trim() || isProcessing}
          >
            <Send className="h-5 w-5" />
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </div>

      {isProcessing && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-2xl">
          <div className="flex items-center gap-2">
            <div className="animate-pulse">⋯</div>
            <span className="text-sm text-muted-foreground">Processing...</span>
          </div>
        </div>
      )}
    </form>
  );
};

export default ChatInput;
