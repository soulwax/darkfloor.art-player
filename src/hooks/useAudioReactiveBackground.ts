// File: src/hooks/useAudioReactiveBackground.ts

"use client";

import { useAudioVisualizer } from "@/hooks/useAudioVisualizer";
import { analyzeAudio } from "@/utils/audioAnalysis";
import { useEffect, useRef } from "react";

/**
 * Hook that analyzes audio and updates CSS variables for reactive background effects
 */
export function useAudioReactiveBackground(
  audioElement: HTMLAudioElement | null,
  isPlaying: boolean
) {
  const visualizer = useAudioVisualizer(audioElement, {
    fftSize: 256,
    smoothingTimeConstant: 0.8,
  });

  const animationFrameRef = useRef<number | null>(null);
  const previousAnalysisRef = useRef<{ overallVolume: number; bass: number } | null>(null);

  useEffect(() => {
    if (!isPlaying || !visualizer.isInitialized || !audioElement) {
      // Reset to default when not playing
      document.documentElement.style.setProperty("--audio-intensity", "0");
      document.documentElement.style.setProperty("--audio-bass", "0");
      document.documentElement.style.setProperty("--audio-energy", "0");
      document.documentElement.style.setProperty("--audio-hue", "0");
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const updateBackground = () => {
      const frequencyData = visualizer.getFrequencyData();
      if (frequencyData.length === 0) {
        animationFrameRef.current = requestAnimationFrame(updateBackground);
        return;
      }

      // Get audio context sample rate and fft size for analysis
      const audioContext = visualizer.audioContext;
      if (!audioContext) {
        animationFrameRef.current = requestAnimationFrame(updateBackground);
        return;
      }

      const sampleRate = audioContext.sampleRate;
      const fftSize = visualizer.getFFTSize();
      const analysis = analyzeAudio(frequencyData, sampleRate, fftSize);

      // Smooth the values to prevent jitter
      const previous = previousAnalysisRef.current;
      const smoothing = 0.7;
      
      const overallVolume = previous
        ? previous.overallVolume * smoothing + analysis.overallVolume * (1 - smoothing)
        : analysis.overallVolume;
      
      const bass = previous
        ? previous.bass * smoothing + analysis.frequencyBands.bass * (1 - smoothing)
        : analysis.frequencyBands.bass;

      previousAnalysisRef.current = { overallVolume, bass };

      // Calculate intensity (0-1) - boost it for more vibrant effects
      const intensity = Math.min(1, overallVolume * 1.5);
      const bassBoost = Math.min(1, bass * 1.8);
      const energy = Math.min(1, (overallVolume + bass) * 1.2);

      // Calculate hue shift based on frequency bands
      // Bass = red/orange, Mid = yellow/gold, Treble = purple/blue
      const bassWeight = analysis.frequencyBands.bass;
      const midWeight = analysis.frequencyBands.mid;
      const trebleWeight = analysis.frequencyBands.treble;
      
      // Normalize weights
      const total = bassWeight + midWeight + trebleWeight;
      const normalizedBass = total > 0 ? bassWeight / total : 0;
      const normalizedMid = total > 0 ? midWeight / total : 0;
      const normalizedTreble = total > 0 ? trebleWeight / total : 0;
      
      // Hue range: 0-60 (red-orange-yellow) for bass/mid, 240-300 (purple-pink) for treble
      const hue = normalizedBass * 15 + normalizedMid * 45 + normalizedTreble * 280;

      // Update CSS variables
      document.documentElement.style.setProperty("--audio-intensity", intensity.toString());
      document.documentElement.style.setProperty("--audio-bass", bassBoost.toString());
      document.documentElement.style.setProperty("--audio-energy", energy.toString());
      document.documentElement.style.setProperty("--audio-hue", hue.toString());

      animationFrameRef.current = requestAnimationFrame(updateBackground);
    };

    // Initialize visualizer if needed
    if (!visualizer.isInitialized && audioElement) {
      visualizer.initialize();
      // Try to resume context if suspended
      void visualizer.resumeContext();
    }

    // Start the animation loop only if initialized
    if (visualizer.isInitialized) {
      animationFrameRef.current = requestAnimationFrame(updateBackground);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying, visualizer, audioElement]);
}

