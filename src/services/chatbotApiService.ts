
import { ChatMessage } from './types';

// API endpoint URL for Groq API
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Configuration for API requests
const API_CONFIG = {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.GROQ_API_KEY || 'YOUR_GROQ_API_KEY'}` // API key should be in env variables
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
  emotion: string,
  chatHistory: ChatMessage[],
  userName: string = "friend"
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

    // In production environment, make an actual API call
    if (process.env.NODE_ENV === 'production') {
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
    } else {
      // For development, use simulated response
      console.log('Development mode: Simulating Groq API response');
      return simulateGroqApiCall(payload);
    }
  } catch (error) {
    console.error('Error calling chatbot API:', error);
    // Fallback to local response generation if API fails
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
  return `I apologize, ${userName}, but I'm having trouble connecting to my knowledge base right now. Could we try again in a moment?`;
};
