
import { VoiceGender, VoiceOption, VoiceAccent } from './types';

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
