import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { getModelURL } from '@/services/modelService';

type EmotionData = {
  happy: number;
  sad: number;
  angry: number;
  fearful: number;
  disgusted: number;
  surprised: number;
  neutral: number;
};

export type Emotion = keyof EmotionData;

interface EmotionDetectorProps {
  onEmotionDetected: (emotion: Emotion, confidence: number) => void;
  isActive: boolean;
}

const EmotionDetector: React.FC<EmotionDetectorProps> = ({ onEmotionDetected, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const recentEmotionsRef = useRef<Array<{emotion: Emotion, confidence: number}>>([]);
  const detectionCountRef = useRef(0);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
        
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        
        setIsModelLoaded(true);
        console.log('Models loaded successfully from CDN');
      } catch (error) {
        console.error('Error loading models:', error);
        setError('Failed to load emotion detection models. Please check your internet connection.');
      }
    };

    loadModels();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!isModelLoaded || !isActive) return;

    let animationFrameId: number;
    
    const startVideo = async () => {
      try {
        if (!videoRef.current) return;
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          } 
        });
        
        videoRef.current.srcObject = stream;
      } catch (err) {
        console.error('Error accessing webcam:', err);
        setError('Unable to access your webcam. Please check your camera permissions.');
      }
    };

    const calculateMostReliableEmotion = (recentEmotions: Array<{emotion: Emotion, confidence: number}>): {emotion: Emotion, confidence: number} => {
      const emotionCounts: Record<Emotion, {count: number, totalConfidence: number}> = {
        happy: {count: 0, totalConfidence: 0},
        sad: {count: 0, totalConfidence: 0},
        angry: {count: 0, totalConfidence: 0},
        fearful: {count: 0, totalConfidence: 0},
        disgusted: {count: 0, totalConfidence: 0},
        surprised: {count: 0, totalConfidence: 0},
        neutral: {count: 0, totalConfidence: 0}
      };
      
      recentEmotions.forEach(({emotion, confidence}) => {
        emotionCounts[emotion].count++;
        emotionCounts[emotion].totalConfidence += confidence;
      });
      
      const EMOTION_WEIGHTS = {
        happy: 1.0,
        sad: 1.4,
        angry: 1.5,
        fearful: 1.4,
        disgusted: 1.5,
        surprised: 1.3,
        neutral: 0.9
      };
      
      let bestEmotion: Emotion = 'neutral';
      let bestScore = 0;
      
      Object.entries(emotionCounts).forEach(([emotion, {count, totalConfidence}]) => {
        if (count === 0) return;
        
        const avgConfidence = totalConfidence / count;
        const weighted = avgConfidence * EMOTION_WEIGHTS[emotion as Emotion] * (count / recentEmotions.length);
        
        if (weighted > bestScore) {
          bestScore = weighted;
          bestEmotion = emotion as Emotion;
        }
      });
      
      const avgConfidence = emotionCounts[bestEmotion].count > 0 
        ? emotionCounts[bestEmotion].totalConfidence / emotionCounts[bestEmotion].count 
        : 0;
      
      return { emotion: bestEmotion, confidence: avgConfidence };
    };

    const detectEmotions = async () => {
      if (!videoRef.current || !canvasRef.current || !isModelLoaded) return;
      
      if (videoRef.current.paused || videoRef.current.ended) return;
      
      const options = new faceapi.TinyFaceDetectorOptions({ 
        inputSize: 320,
        scoreThreshold: 0.5 
      });
      
      try {
        const detections = await faceapi
          .detectAllFaces(videoRef.current, options)
          .withFaceLandmarks()
          .withFaceExpressions();
        
        if (detections && detections.length > 0) {
          const expressions = detections[0].expressions;
          
          const adjustedExpressions: EmotionData = {
            ...expressions as EmotionData,
            sad: expressions.sad * 1.2,
            angry: expressions.angry * 1.3,
            fearful: expressions.fearful * 1.2,
            disgusted: expressions.disgusted * 1.3,
            surprised: expressions.surprised * 1.2
          };
          
          const dominantEmotion = Object.keys(adjustedExpressions).reduce((a, b) => 
            adjustedExpressions[a as keyof EmotionData] > adjustedExpressions[b as keyof EmotionData] ? a : b
          ) as Emotion;
          
          const confidence = expressions[dominantEmotion];
          
          recentEmotionsRef.current.push({ emotion: dominantEmotion, confidence });
          if (recentEmotionsRef.current.length > 10) {
            recentEmotionsRef.current.shift();
          }
          
          detectionCountRef.current++;
          if (detectionCountRef.current % 5 === 0 && recentEmotionsRef.current.length >= 3) {
            const reliableEmotion = calculateMostReliableEmotion(recentEmotionsRef.current);
            onEmotionDetected(reliableEmotion.emotion, reliableEmotion.confidence);
          } else if (recentEmotionsRef.current.length < 3) {
            onEmotionDetected(dominantEmotion, confidence);
          }
          
          const canvas = canvasRef.current;
          const displaySize = { width: videoRef.current.width, height: videoRef.current.height };
          faceapi.matchDimensions(canvas, displaySize);
          
          const resizedDetections = faceapi.resizeResults(detections, displaySize);
          
          canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
          faceapi.draw.drawDetections(canvas, resizedDetections);
          faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
          faceapi.draw.drawFaceExpressions(canvas, resizedDetections, 0.05);
        }
      } catch (err) {
        console.error('Error during emotion detection:', err);
      }
      
      animationFrameId = requestAnimationFrame(detectEmotions);
    };

    if (isActive) {
      startVideo();
      videoRef.current?.addEventListener('play', detectEmotions);
    } else if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (videoRef.current) {
        videoRef.current.removeEventListener('play', detectEmotions);
        if (videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          const tracks = stream.getTracks();
          tracks.forEach((track) => track.stop());
        }
      }
    };
  }, [isModelLoaded, isActive, onEmotionDetected]);

  return (
    <div className="relative w-full max-w-md mx-auto">
      {error && (
        <div className="p-4 mb-4 text-red-800 bg-red-100 rounded-lg">
          {error}
        </div>
      )}
      
      <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
        {!isModelLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-10">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
              <p>Loading emotion detection models from CDN...</p>
            </div>
          </div>
        )}
        
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`w-full h-full object-cover ${!isActive ? 'hidden' : ''}`}
          width={640}
          height={480}
        />
        
        <canvas 
          ref={canvasRef} 
          className="absolute top-0 left-0 w-full h-full" 
          width={640}
          height={480}
        />
        
        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
            <p className="text-white">Camera is off</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmotionDetector;
