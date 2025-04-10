
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
    const response = await simulateChatbotApiCall(payload);
    
    return response;
  } catch (error) {
    console.error('Error calling chatbot API:', error);
    // Fallback to local response generation if API fails
    return getFallbackResponse(message, emotion, userName);
  }
};

/**
 * Simulate an API call to a chatbot service
 * In production, this would be replaced with a real API call
 */
const simulateChatbotApiCall = async (payload: any): Promise<string> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const { message, emotion, userName } = payload;
  
  // Simple response generation based on message content
  if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
    return `Hello ${userName}! How can I assist you today?`;
  }
  
  if (message.toLowerCase().includes('help')) {
    return `I'm here to help you, ${userName}. What would you like to know about?`;
  }
  
  if (message.toLowerCase().includes('weather')) {
    return `I don't have access to real-time weather data, but I can suggest checking a weather service for the most up-to-date information.`;
  }
  
  if (message.toLowerCase().includes('thank')) {
    return `You're welcome, ${userName}! Is there anything else I can help with?`;
  }
  
  // Emotion-based responses
  if (emotion === 'happy') {
    return `I'm glad you're feeling good today, ${userName}! Your positive energy is contagious.`;
  }
  
  if (emotion === 'sad') {
    return `I notice you might be feeling down, ${userName}. Remember that it's okay to have off days, and I'm here if you want to talk about it.`;
  }
  
  // Default response
  return `Thanks for your message, ${userName}. I'm still learning, but I'm here to chat with you about anything on your mind.`;
};

/**
 * Fallback response generator when API fails
 */
const getFallbackResponse = (message: string, emotion: string, userName: string): string => {
  return `I apologize, ${userName}, but I'm having trouble connecting to my knowledge base right now. Could we try again in a moment?`;
};
