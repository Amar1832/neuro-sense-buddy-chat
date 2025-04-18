
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
    
    // Determine if this is a greeting
    const isGreeting = /^(hi|hello|hey|good morning|good evening|good afternoon|sup|what's up)/i.test(message.trim());
    
    // Adjust system prompt based on whether it's a greeting or regular question
    const systemPrompt = isGreeting
      ? `You are a friendly AI chatbot. The user ${userName} is feeling ${emotion}. Respond to their greeting warmly and naturally, acknowledging their emotional state if relevant. Keep it brief and casual.`
      : `You are a helpful AI assistant chatting with ${userName}. Consider their current emotion (${emotion}) if relevant, but focus on answering their question directly and concisely. Respond like a supportive friend.`;
    
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
      temperature: isGreeting ? 0.8 : 0.7, // Slightly more creative for greetings
      max_tokens: isGreeting ? 50 : 150, // Shorter responses for greetings
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
  const isGreeting = /^(hi|hello|hey|good morning|good evening|good afternoon|sup|what's up)/i.test(message.trim());
  
  if (isGreeting) {
    return `Hey! I notice you're feeling ${emotion}. How can I help you today?`;
  }
  
  return `I understand you're feeling ${emotion}. I'm having trouble connecting right now, but I'll do my best to help with your question: ${message}`;
};

