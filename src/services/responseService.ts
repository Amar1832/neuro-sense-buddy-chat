
import { ChatMessage, VoiceGender } from './types';
import { Emotion } from '@/components/EmotionDetector';
import { getChatbotResponse } from './chatbotApiService';

// Configuration flag to determine whether to use the API or local implementation
const USE_CHATBOT_API = true;

// This service handles getting responses either from the API or a local implementation
export const getAIResponse = async (
  message: string, 
  emotion: Emotion,
  chatHistory: ChatMessage[],
  userName: string = "friend"
): Promise<string> => {
  // If using the chatbot API, call the API service
  if (USE_CHATBOT_API) {
    try {
      return await getChatbotResponse(message, emotion, chatHistory, userName);
    } catch (error) {
      console.error('Error from chatbot API, falling back to local implementation:', error);
      // If API fails, fall back to local implementation
    }
  }
  
  // Local implementation as fallback or if API is disabled
  // Simulated delay to mimic API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log(`Generating local response based on emotion: ${emotion}`);

  // Generate context-aware greeting based on message length
  const greeting = message.length < 10 
    ? getRandomGreeting(userName) 
    : "";

  // Get the response template based on the emotion
  const responseTemplate = getEmotionBasedResponse(emotion, userName);
  
  // Combine greeting and response
  return `${greeting} ${responseTemplate}`.trim();
};

const getRandomGreeting = (userName: string): string => {
  const greetings = [
    `Hey ${userName}!`,
    `Hi there ${userName}!`,
    `Hello ${userName}!`,
    `What's up, ${userName}?`,
    `Nice to see you, ${userName}!`
  ];
  
  return greetings[Math.floor(Math.random() * greetings.length)];
};

const getEmotionBasedResponse = (emotion: Emotion, userName: string): string => {
  const responses = {
    happy: [
      `You seem happy today! That's amazing! Your positive energy is contagious.`,
      `I love seeing you happy! What's been bringing you joy today?`,
      `Your smile brightens my circuits! Keep that positive energy flowing!`,
      `You're radiating happiness! It's a great day to be awesome, isn't it?`
    ],
    sad: [
      `I notice you might be feeling a bit down. Remember that tough times are temporary, but your strength is permanent.`,
      `Even on cloudy days, the sun is still there. Whatever you're going through, I'm here to chat.`,
      `Everyone has off days. What's something small that might brighten your mood right now?`,
      `When you're feeling sad, remember that you've overcome every difficult day so far. That's quite an achievement!`
    ],
    angry: [
      `I can see you might be frustrated right now. Taking deep breaths can help calm those feelings.`,
      `Sometimes life can be pretty irritating! Would talking about it help? Or would you prefer a distraction?`,
      `I sense some tension. Remember, it's okay to feel angry, but also okay to let it go when you're ready.`,
      `When anger visits, it helps to remember it's just a temporary guest, not a permanent resident.`
    ],
    fearful: [
      `It seems like something might be worrying you. Remember that courage isn't the absence of fear, but moving forward despite it.`,
      `Being scared is perfectly normal. Would talking about what's causing this feeling help?`,
      `I notice you might be anxious. Remember to focus on what you can control right now.`,
      `Fear often disappears when faced directly. Is there something specific on your mind?`
    ],
    disgusted: [
      `Your expression suggests you might have encountered something unpleasant. Would talking about something else help?`,
      `Not everything in life is pleasant - but focus can shift to better things. What's something nice that happened recently?`,
      `I notice you might be feeling repulsed by something. Let's switch to a more pleasant topic?`,
      `Sometimes life presents us with things we'd rather avoid. How about we talk about something more enjoyable?`
    ],
    surprised: [
      `You look surprised! Did something unexpected happen?`,
      `That's quite the surprised expression! What's caught you off guard?`,
      `Life is full of surprises, isn't it? What's happened?`,
      `Your expression suggests something unexpected! Care to share?`
    ],
    neutral: [
      `How are you feeling today? I'm here to chat about whatever is on your mind.`,
      `What's been on your mind lately? I'm all ears... well, metaphorically speaking!`,
      `I'm here and ready to chat about anything you'd like to discuss.`,
      `Is there something specific you'd like to talk about today?`
    ]
  };

  const selectedResponses = responses[emotion] || responses.neutral;
  return selectedResponses[Math.floor(Math.random() * selectedResponses.length)];
};
