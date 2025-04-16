import { ChatMessage } from './types';
import { Emotion } from '@/components/EmotionDetector';
import { toast } from '@/hooks/use-toast';

// API endpoint URL for Groq API
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Groq API key
const GROQ_API_KEY = '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';

// Configuration for API requests
const API_CONFIG = {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${GROQ_API_KEY}`
  },
  timeoutMs: 10000,
};

/**
 * Send a message to the chatbot API and get a response
 * @param message The user's message
 * @param emotion The detected emotion
 * @param chatHistory Previous chat messages for context
 * @param userName User's name for personalization
 * @returns Promise with the API response text
 */
export const getChatbotResponse = async (
  message: string,
  emotion: Emotion,
  chatHistory: ChatMessage[],
  userName: string = "Amar" // Default to Amar as seen in the Python code
): Promise<string> => {
  try {
    console.log('Sending request to Groq API with emotion:', emotion);
    
    // Build the system prompt based on the emotion
    const systemPrompt = `You are Jarvis, ${userName}'s humorous AI companion. Respond with humor based on detected emotion:
      - Happy: Playfully joke and be cheerful.
      - Sad: Offer humorous support and motivational jokes.
      - Angry: Calm with humor and funny distractions.
      - Surprise: React with amusing curiosity.
      - Fear or Disgust: Provide funny reassurance.
      - Neutral: Be friendly and humorous.`;
    
    // Format messages for Groq's expected structure
    const recentMessages = chatHistory.slice(-5).map(msg => ({
      role: msg.isUser ? 'user' : 'assistant',
      content: msg.text
    }));

    // Create the request to Groq
    const payload = {
      model: "mixtral-8x7b-32768", // Using Mixtral model as specified in the Python code
      messages: [
        { role: "system", content: systemPrompt },
        ...recentMessages,
        { role: "user", content: `I am feeling ${emotion}. Also, ${message}` }
      ],
      temperature: 0.7,
      max_tokens: 150,
      top_p: 0.95
    };

    console.log('Making API call to Groq...');
    
    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: API_CONFIG.headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API request failed with status ${response.status}:`, errorText);
        toast({
          title: "API Connection Failed",
          description: `Failed to connect to Groq API (${response.status}). Using fallback responses.`,
          variant: "destructive",
        });
        return simulateGroqApiCall(payload);
      }

      const data = await response.json();
      const responseText = data.choices[0].message.content.trim();
      console.log('API response successful:', responseText.substring(0, 50) + '...');
      return responseText;
    } catch (error) {
      console.error('Error in API call:', error);
      toast({
        title: "API Connection Error",
        description: "Network error connecting to Groq API. Using fallback responses.",
        variant: "destructive",
      });
      return simulateGroqApiCall(payload);
    }
  } catch (error) {
    console.error('Error in chatbot service:', error);
    toast({
      title: "Service Error",
      description: "Something went wrong with the chat service. Using local responses.",
      variant: "destructive",
    });
    return getFallbackResponse(message, emotion, userName);
  }
};

/**
 * Simulate an API call to the Groq chatbot service
 * In production, this would be replaced with a real API call
 */
const simulateGroqApiCall = async (payload: any): Promise<string> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const userMessage = payload.messages[payload.messages.length - 1].content;
  const emotionMatch = userMessage.match(/I am feeling (\w+)/);
  const emotion = emotionMatch ? emotionMatch[1].toLowerCase() : 'neutral';
  const userName = payload.messages[0].content.match(/You are Jarvis, (.+?)'s/)?.[1] || 'friend';
  
  // Simulating responses based on emotions
  if (emotion === 'happy') {
    return `Hey there, sunshine ${userName}! You're looking particularly radiant today. Must be all those endorphins doing cartwheels in your brain! About your message - that's absolutely fantastic! Let's ride this happiness wave together!`;
  }
  
  if (emotion === 'sad') {
    return `Hey ${userName}, I see those cloudy vibes. Remember, even the grumpiest cat videos can make us smile! Here's a little pick-me-up: What did the ocean say to the beach? Nothing, it just waved! Too cheesy? Well, at least it's not as salty as the ocean!`;
  }
  
  if (emotion === 'angry') {
    return `Whoa there, ${userName}! I can practically see the steam coming out of your ears! Deep breaths... in through the nose, out through the mouth. Let's look at the bright side: at least you're burning calories while fuming! Anger: nature's workout program!`;
  }
  
  if (emotion === 'surprise' || emotion === 'surprised') {
    return `Well well well, ${userName}! Your face is doing that shocked emoji thing! Plot twist, right? Life's just a box of chocolates with occasional exploding ones!`;
  }
  
  if (emotion === 'fear' || emotion === 'fearful' || emotion === 'disgust' || emotion === 'disgusted') {
    return `I see you're having one of THOSE moments, ${userName}. Don't worry - about 99% of the things we fear never actually happen! Remember, even if things get weird, at least we'll have a funny story to tell later!`;
  }
  
  // Default neutral response
  return `Hello there, ${userName}! You're looking perfectly neutral today - very zen! That's quite interesting! Did you know that the average person spends 6 months of their life waiting at traffic lights? Not relevant? Well, my random fact generator is feeling chatty today!`;
};

/**
 * Fallback response generator when API fails
 */
const getFallbackResponse = (message: string, emotion: string, userName: string): string => {
  return `I apologize, ${userName}, but I'm having trouble connecting to my knowledge base right now. Could we try again in a moment? In the meantime, here's what I can tell you: you seem ${emotion}, and I'm here to chat about whatever's on your mind.`;
};
