
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EmotionDetector, { Emotion } from '@/components/EmotionDetector';
import MessageBubble from '@/components/MessageBubble';
import ChatInput from '@/components/ChatInput';
import { getAIResponse, startSpeechRecognition, speakText, getAvailableVoiceOptions, VoiceGender } from '@/services/aiService';
import { Brain, Settings, Volume2, VolumeX } from 'lucide-react';
import { ensureModelsLoaded } from '@/services/modelService';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  emotion?: Emotion;
}

const Index: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentEmotion, setCurrentEmotion] = useState<Emotion>('neutral');
  const [userName, setUserName] = useState('Friend');
  const [voiceGender, setVoiceGender] = useState<VoiceGender>('female');
  const [isListening, setIsListening] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const voiceOptions = getAvailableVoiceOptions();

  // Initialize with welcome message
  useEffect(() => {
    if (isFirstLoad) {
      // Add an initial welcome message
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        text: `Hi there! I'm NeuroSense, your emotion-aware AI buddy. I can sense how you're feeling and respond accordingly. Try enabling your camera and microphone to get the full experience!`,
        isUser: false,
        timestamp: new Date(),
        emotion: 'happy'
      };
      
      setMessages([welcomeMessage]);
      setIsFirstLoad(false);
      
      // Pre-load models
      ensureModelsLoaded().catch(error => {
        console.error('Failed to ensure models are loaded:', error);
      });
    }
  }, [isFirstLoad]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle emotion updates
  const handleEmotionDetected = (emotion: Emotion, confidence: number) => {
    // Only update if confidence is high enough and emotion has changed
    if (confidence > 0.5 && emotion !== currentEmotion) {
      setCurrentEmotion(emotion);
      console.log(`Emotion detected: ${emotion} (confidence: ${confidence.toFixed(2)})`);
    }
  };

  // Toggle microphone listening
  const toggleListening = async () => {
    if (isListening) {
      // Stop listening
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setIsListening(false);
    } else {
      // Start listening
      try {
        const recognition = await startSpeechRecognition();
        
        if (!recognition) {
          toast({
            title: "Speech Recognition Not Available",
            description: "Your browser doesn't support speech recognition. Try using Chrome.",
            variant: "destructive"
          });
          return;
        }
        
        recognitionRef.current = recognition;
        
        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          if (transcript.trim()) {
            handleSendMessage(transcript);
          }
          setIsListening(false);
        };
        
        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
          toast({
            title: "Speech Recognition Error",
            description: `Error: ${event.error}. Please try again.`,
            variant: "destructive"
          });
        };
        
        recognition.onend = () => {
          setIsListening(false);
        };
        
        setIsListening(true);
        
      } catch (error) {
        console.error('Error initializing speech recognition:', error);
        toast({
          title: "Speech Recognition Error",
          description: "Failed to initialize speech recognition. Please check your browser permissions.",
          variant: "destructive"
        });
      }
    }
  };

  // Toggle camera
  const toggleCamera = () => {
    setIsCameraActive(!isCameraActive);
  };

  // Toggle text-to-speech
  const toggleTts = () => {
    setIsTtsEnabled(!isTtsEnabled);
    
    if (isTtsEnabled) {
      // Stop any current speech when turning off TTS
      window.speechSynthesis?.cancel();
    }
  };

  // Send message
  const handleSendMessage = async (text: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);
    
    try {
      // Get AI response based on current emotion
      const response = await getAIResponse(
        text, 
        currentEmotion, 
        messages.map(m => ({
          isUser: m.isUser,
          text: m.text,
          timestamp: m.timestamp,
          emotion: m.emotion
        })),
        userName
      );
      
      // Add AI response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
        emotion: currentEmotion
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Read response aloud if TTS is enabled
      if (isTtsEnabled) {
        speakText(response, voiceGender);
      }
      
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast({
        title: "Response Error",
        description: "Failed to generate a response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Update user name and settings
  const handleSettingsSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSettingsOpen(false);
    
    toast({
      title: "Settings Saved",
      description: `Your preferences have been updated.`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col">
      <header className="container py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-7 h-7 text-primary" />
            <h1 className="text-2xl font-bold">NeuroSense Buddy</h1>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          >
            <Settings className="w-5 h-5" />
            <span className="sr-only">Settings</span>
          </Button>
        </div>
      </header>
      
      <main className="container flex-1 py-4 grid gap-6 grid-cols-1 md:grid-cols-3">
        <div className="md:col-span-3 lg:col-span-1 space-y-4">
          {isSettingsOpen ? (
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSettingsSave} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Your Name</Label>
                    <Input 
                      id="name" 
                      value={userName} 
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Enter your name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="voice">Voice Gender</Label>
                    <Select
                      value={voiceGender}
                      onValueChange={(value: VoiceGender) => setVoiceGender(value)}
                    >
                      <SelectTrigger id="voice">
                        <SelectValue placeholder="Select voice gender" />
                      </SelectTrigger>
                      <SelectContent>
                        {voiceOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="tts">Text-to-Speech</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={toggleTts}
                    >
                      {isTtsEnabled ? (
                        <Volume2 className="w-4 h-4" />
                      ) : (
                        <VolumeX className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  
                  <Button type="submit" className="w-full">Save Settings</Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Emotion Detection</CardTitle>
              </CardHeader>
              <CardContent>
                <EmotionDetector 
                  onEmotionDetected={handleEmotionDetected}
                  isActive={isCameraActive}
                />
                
                <div className="mt-4 p-3 bg-muted rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">Current Emotion:</span>
                    <span className="ml-2 capitalize">{currentEmotion}</span>
                  </div>
                  
                  <div className={`w-3 h-3 rounded-full ${
                    currentEmotion === 'happy' ? 'bg-happy animate-pulse' : 
                    currentEmotion === 'sad' ? 'bg-sad animate-pulse' : 
                    currentEmotion === 'angry' ? 'bg-angry animate-pulse' : 
                    currentEmotion === 'fearful' ? 'bg-fearful animate-pulse' : 
                    currentEmotion === 'disgusted' ? 'bg-disgusted animate-pulse' : 
                    currentEmotion === 'surprised' ? 'bg-surprised animate-pulse' : 
                    'bg-neutral animate-pulse'
                  }`}></div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        <div className="md:col-span-3 lg:col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle>Chat with NeuroSense</CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-hidden">
              <ScrollArea className="h-[50vh] md:h-[60vh] pr-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message.text}
                      isUser={message.isUser}
                      emotion={message.emotion}
                      timestamp={message.timestamp}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>
            
            <CardFooter>
              <ChatInput
                onSendMessage={handleSendMessage}
                isListening={isListening}
                toggleListening={toggleListening}
                isCameraActive={isCameraActive}
                toggleCamera={toggleCamera}
                isProcessing={isProcessing}
              />
            </CardFooter>
          </Card>
        </div>
      </main>
      
      <footer className="py-4 text-center text-sm text-muted-foreground">
        <p>NeuroSense Buddy - Your emotion-aware AI companion</p>
      </footer>
    </div>
  );
};

export default Index;
