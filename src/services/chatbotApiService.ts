
import { ChatMessage } from './types';
import { Emotion } from '@/components/EmotionDetector';
import { toast } from '@/hooks/use-toast';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = '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';

const API_CONFIG = {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${GROQ_API_KEY}`
  },
  timeoutMs: 10000,
};

export const getChatbotResponse = async (
  message: string,
  emotion: Emotion,
  chatHistory: ChatMessage[],
  userName: string = "Amar"
): Promise<string> => {
  try {
    console.log('Sending request to Groq API with emotion:', emotion);
    
    // Simple, focused system prompt
    const systemPrompt = `You are a helpful AI assistant. Be concise and direct in your responses. Consider that the user is feeling ${emotion}.`;
    
    const recentMessages = chatHistory.slice(-5).map(msg => ({
      role: msg.isUser ? 'user' : 'assistant',
      content: msg.text
    }));

    const payload = {
      model: "llama3-8b-8192",
      messages: [
        { role: "system", content: systemPrompt },
        ...recentMessages,
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 150,
      top_p: 0.95
    };

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: API_CONFIG.headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();

  } catch (error) {
    console.error('Error in chatbot service:', error);
    toast({
      title: "API Error",
      description: "Could not connect to AI service. Using fallback response.",
      variant: "destructive",
    });
    return getFallbackResponse(message, emotion);
  }
};

const getFallbackResponse = (message: string, emotion: string): string => {
  return `I understand you're feeling ${emotion}. I'm having trouble connecting right now, but I'll do my best to help with your question: ${message}`;
};

