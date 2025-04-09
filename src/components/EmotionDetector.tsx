
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

  useEffect(() => {
    const loadModels = async () => {
      try {
        // Use CDN URLs directly instead of trying to load from local files
        const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
        
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
        ]);
        
        setIsModelLoaded(true);
        console.log('Models loaded successfully from CDN');
      } catch (error) {
        console.error('Error loading models:', error);
        setError('Failed to load emotion detection models. Please check your internet connection.');
      }
    };

    loadModels();

    // Cleanup function
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

    const detectEmotions = async () => {
      if (!videoRef.current || !canvasRef.current || !isModelLoaded) return;
      
      // Only run detection if video is playing and not paused
      if (videoRef.current.paused || videoRef.current.ended) return;
      
      const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });
      
      const detections = await faceapi
        .detectAllFaces(videoRef.current, options)
        .withFaceExpressions();
      
      if (detections && detections.length > 0) {
        const expressions = detections[0].expressions;
        const dominantEmotion = Object.keys(expressions).reduce((a, b) => 
          expressions[a as keyof EmotionData] > expressions[b as keyof EmotionData] ? a : b
        ) as Emotion;
        
        const confidence = expressions[dominantEmotion];
        onEmotionDetected(dominantEmotion, confidence);
        
        // Draw detection results for visual feedback
        const canvas = canvasRef.current;
        const displaySize = { width: videoRef.current.width, height: videoRef.current.height };
        faceapi.matchDimensions(canvas, displaySize);
        
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        
        canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections, 0.05);
      }
      
      // Continue detection loop
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
