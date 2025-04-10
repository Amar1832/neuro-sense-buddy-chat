
import { ChatMessage } from './types';

// API endpoint URL - in production, this would be a real API endpoint
const API_URL = 'https://api.example.com/chatbot';

// Configuration for API requests
const API_CONFIG = {
  headers: {
    'Content-Type': 'application/json',
  },
  timeoutMs: 10000,
};

// Groq API key - in production, this should be stored securely
// For this demo, we're using a sample key format (not a real key)
const GROQ_API_KEY = "YOUR_GROQ_API_KEY"; // Replace with your actual key

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
    // Create payload for the API
    const payload = {
      message,
      emotion,
      chatHistory: chatHistory.slice(-10), // Send the last 10 messages for context
      userName,
      timestamp: new Date().toISOString(),
    };

    // Simulate API call with a timeout to simulate network latency
    console.log('Sending request to chatbot API:', payload);
    
    // In a real implementation, this would be a fetch call to an actual API
    // For now, we'll simulate a response to demonstrate the flow
    const response = await simulateGroqApiCall(payload);
    
    return response;
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
  
  const { message, emotion, userName } = payload;
  
  // Simulating a Groq AI response based on emotion and message
  const systemPrompt = `You are Jarvis, ${userName}'s humorous AI companion. Respond with humor based on detected emotion:
    - Happy: Playfully joke and be cheerful.
    - Sad: Offer humorous support and motivational jokes.
    - Angry: Calm with humor and funny distractions.
    - Surprise: React with amusing curiosity.
    - Fear or Disgust: Provide funny reassurance.
    - Neutral: Be friendly and humorous.`;
  
  // In production, this would make an actual API call to Groq
  console.log('System prompt:', systemPrompt);
  console.log(`User emotion: ${emotion}, Message: ${message}`);
  
  // Simple simulated response based on emotion
  if (emotion === 'happy') {
    return `Hey there, sunshine ${userName}! You're looking particularly radiant today. Must be all those endorphins doing cartwheels in your brain! About "${message}" - that's absolutely fantastic! Let's ride this happiness wave together!`;
  }
  
  if (emotion === 'sad') {
    return `Hey ${userName}, I see those cloudy vibes. Remember, even the grumpiest cat videos can make us smile! Regarding "${message}" - here's a little pick-me-up: What did the ocean say to the beach? Nothing, it just waved! Too cheesy? Well, at least it's not as salty as the ocean!`;
  }
  
  if (emotion === 'angry') {
    return `Whoa there, ${userName}! I can practically see the steam coming out of your ears! Deep breaths... in through the nose, out through the mouth. About "${message}" - let's look at the bright side: at least you're burning calories while fuming! Anger: nature's workout program!`;
  }
  
  if (emotion === 'surprised') {
    return `Well well well, ${userName}! Your face is doing that shocked emoji thing! About "${message}" - plot twist, right? Life's just a box of chocolates with occasional exploding ones!`;
  }
  
  if (emotion === 'fearful' || emotion === 'disgusted') {
    return `I see you're having one of THOSE moments, ${userName}. Don't worry - about 99% of the things we fear never actually happen! Regarding "${message}" - remember, even if things get weird, at least we'll have a funny story to tell later!`;
  }
  
  // Default neutral response
  return `Hello there, ${userName}! You're looking perfectly neutral today - very zen! About "${message}" - that's quite interesting! Did you know that the average person spends 6 months of their life waiting at traffic lights? Not relevant? Well, my random fact generator is feeling chatty today!`;
};

/**
 * Fallback response generator when API fails
 */
const getFallbackResponse = (message: string, emotion: string, userName: string): string => {
  return `I apologize, ${userName}, but I'm having trouble connecting to my knowledge base right now. Could we try again in a moment?`;
};
