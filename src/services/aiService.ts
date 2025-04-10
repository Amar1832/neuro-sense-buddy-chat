import { Emotion } from '@/components/EmotionDetector';

interface ChatMessage {
  isUser: boolean;
  text: string;
  timestamp: Date;
  emotion?: Emotion;
}

// Voice settings
export type VoiceGender = 'female' | 'male';
export type VoiceAccent = 'standard' | 'british' | 'australian' | 'indian';

export interface VoiceOption {
  id: string;
  name: string; 
  gender: VoiceGender;
  accent?: VoiceAccent;
}

// This is a local implementation that doesn't require API keys
// In production, this would connect to an API
export const getAIResponse = async (
  message: string, 
  emotion: Emotion,
  chatHistory: ChatMessage[],
  userName: string = "friend"
): Promise<string> => {
  // Simulated delay to mimic API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log(`Generating response based on emotion: ${emotion}`);

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

// Speech recognition service
export const startSpeechRecognition = (): Promise<SpeechRecognition | null> => {
  return new Promise((resolve) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech recognition not supported in this browser');
      resolve(null);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    recognition.start();
    resolve(recognition);
  });
};

// Enhanced text-to-speech service with premium voice options
export const speakText = (text: string, voiceId?: string, voiceGender: VoiceGender = 'female'): void => {
  if (!('speechSynthesis' in window)) {
    console.error('Text-to-speech not supported in this browser');
    return;
  }

  // Stop any current speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Load available voices
  let voices = window.speechSynthesis.getVoices();
  
  // Sometimes voices aren't loaded immediately, so we wait for them
  if (voices.length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      voices = window.speechSynthesis.getVoices();
      if (voiceId) {
        setVoiceById(utterance, voices, voiceId);
      } else {
        setVoiceByGender(utterance, voices, voiceGender);
      }
    };
  } else {
    if (voiceId) {
      setVoiceById(utterance, voices, voiceId);
    } else {
      setVoiceByGender(utterance, voices, voiceGender);
    }
  }
  
  // Adjust speech parameters for better quality
  utterance.rate = 0.95; // Slightly slower for better clarity
  utterance.pitch = voiceGender === 'female' ? 1.05 : 0.95; // Slight pitch adjustment
  utterance.volume = 1; // Full volume
  
  window.speechSynthesis.speak(utterance);
};

// Set voice by specific ID
const setVoiceById = (
  utterance: SpeechSynthesisUtterance, 
  voices: SpeechSynthesisVoice[], 
  voiceId: string
): void => {
  const selectedVoice = voices.find(voice => voice.voiceURI === voiceId);
  if (selectedVoice) {
    utterance.voice = selectedVoice;
    console.log(`Selected specific voice: ${selectedVoice.name}`);
  } else {
    console.warn(`Voice with ID ${voiceId} not found, falling back to default`);
    setVoiceByGender(utterance, voices, 'female');
  }
};

// Helper function to find and set the best voice by gender
const setVoiceByGender = (
  utterance: SpeechSynthesisUtterance, 
  voices: SpeechSynthesisVoice[], 
  gender: VoiceGender
): void => {
  // Premium voice names that typically sound better
  const premiumVoiceKeywords = [
    'Google', 'Premium', 'Enhanced', 'Microsoft', 'Natural', 'Neural'
  ];

  // Define gender-specific voice keywords
  const femaleKeywords = ['female', 'woman', 'girl', 'Samantha', 'Victoria', 'Karen', 'Tessa', 'Moira', 'Veena'];
  const maleKeywords = ['male', 'man', 'guy', 'Daniel', 'David', 'Thomas', 'Alex', 'Matthew', 'James'];
  
  const genderKeywords = gender === 'female' ? femaleKeywords : maleKeywords;
  
  // First try to find premium voices of requested gender
  let selectedVoice = voices.find(voice => {
    const voiceName = voice.name.toLowerCase();
    const isPremium = premiumVoiceKeywords.some(keyword => voiceName.includes(keyword.toLowerCase()));
    const isMatchingGender = genderKeywords.some(keyword => voiceName.includes(keyword.toLowerCase()));
    return isPremium && isMatchingGender;
  });
  
  // If no premium gender-specific voice found, try any of the requested gender
  if (!selectedVoice) {
    selectedVoice = voices.find(voice => {
      return genderKeywords.some(keyword => voice.name.toLowerCase().includes(keyword.toLowerCase()));
    });
  }
  
  // If still no voice found, try any premium voice
  if (!selectedVoice) {
    selectedVoice = voices.find(voice => {
      return premiumVoiceKeywords.some(keyword => voice.name.toLowerCase().includes(keyword.toLowerCase()));
    });
  }
  
  // Fall back to any non-default voice or the first available voice
  if (!selectedVoice && voices.length > 1) {
    selectedVoice = voices[1]; // Skip the default voice (usually index 0)
  } else if (!selectedVoice && voices.length > 0) {
    selectedVoice = voices[0];
  }
  
  if (selectedVoice) {
    utterance.voice = selectedVoice;
    console.log(`Selected voice: ${selectedVoice.name} (${gender})`);
  }
};

// Get available voice options for the UI
export const getAvailableVoiceOptions = (): VoiceOption[] => {
  if (!('speechSynthesis' in window)) {
    return [
      { id: 'female-default', name: 'Female Voice', gender: 'female' },
      { id: 'male-default', name: 'Male Voice', gender: 'male' }
    ];
  }

  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) {
    return [
      { id: 'female-default', name: 'Female Voice', gender: 'female' },
      { id: 'male-default', name: 'Male Voice', gender: 'male' }
    ];
  }

  // Filter to get only high-quality English voices
  const qualityVoices = voices
    .filter(voice => voice.lang.startsWith('en'))
    .map(voice => {
      const name = voice.name;
      const isFemale = name.toLowerCase().includes('female') || 
                       voice.name.includes('Karen') || 
                       voice.name.includes('Victoria') || 
                       voice.name.includes('Samantha') || 
                       voice.name.includes('Moira');
                      
      let accent: VoiceAccent = 'standard';
      if (voice.lang === 'en-GB') accent = 'british';
      else if (voice.lang === 'en-AU') accent = 'australian';
      else if (voice.lang === 'en-IN') accent = 'indian';
      
      return {
        id: voice.voiceURI,
        name: voice.name,
        gender: isFemale ? 'female' : 'male' as VoiceGender,
        accent
      };
    });

  // Sort with premium voices first, then by gender
  return qualityVoices.sort((a, b) => {
    const isPremiumA = a.name.includes('Google') || a.name.includes('Premium') || a.name.includes('Neural');
    const isPremiumB = b.name.includes('Google') || b.name.includes('Premium') || b.name.includes('Neural');
    
    if (isPremiumA && !isPremiumB) return -1;
    if (!isPremiumA && isPremiumB) return 1;
    
    // If same premium status, sort by gender (female first)
    if (a.gender === 'female' && b.gender === 'male') return -1;
    if (a.gender === 'male' && b.gender === 'female') return 1;
    
    // If same gender, sort alphabetically
    return a.name.localeCompare(b.name);
  });
};
