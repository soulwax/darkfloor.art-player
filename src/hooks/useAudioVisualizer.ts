// File: src/hooks/useAudioVisualizer.ts

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getOrCreateAudioConnection,
  releaseAudioConnection,
  ensureConnectionChain,
} from "@/utils/audioContextManager";

export interface AudioVisualizerOptions {
  fftSize?: number; // Must be a power of 2 between 32 and 32768
  smoothingTimeConstant?: number; // 0-1, controls averaging
  minDecibels?: number;
  maxDecibels?: number;
}

export function useAudioVisualizer(
  audioElement: HTMLAudioElement | null,
  options: AudioVisualizerOptions = {},
) {
  const {
    fftSize = 128,
    smoothingTimeConstant = 0.8,
    minDecibels = -90,
    maxDecibels = -10,
  } = options;

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [frequencyData, setFrequencyData] = useState<Uint8Array>(
    new Uint8Array(0),
  );
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Web Audio API
  const initialize = useCallback(() => {
    if (!audioElement || isInitialized || audioContextRef.current) return;

    try {
      // Get or create shared audio connection
      const connection = getOrCreateAudioConnection(audioElement);
      if (!connection) {
        // Audio element is already connected elsewhere - this is expected
        // and not an error. The component will simply not initialize audio features.
        return;
      }

      // Create analyser node with custom settings
      // Note: We create our own analyser for custom settings, but we need to ensure
      // the connection chain is maintained. For simplicity, we'll use the shared analyser
      // if it exists, or create our own and ensure the chain is complete.
      let analyser = connection.analyser;
      if (!analyser) {
        analyser = connection.audioContext.createAnalyser();
        analyser.fftSize = 2048; // Use default for shared analyser
        analyser.smoothingTimeConstant = 0.75;
        connection.analyser = analyser;
      }
      
      // Create our own analyser with custom settings for this component
      const customAnalyser = connection.audioContext.createAnalyser();
      customAnalyser.fftSize = fftSize;
      customAnalyser.smoothingTimeConstant = smoothingTimeConstant;
      customAnalyser.minDecibels = minDecibels;
      customAnalyser.maxDecibels = maxDecibels;
      analyserRef.current = customAnalyser;

      // Connect our custom analyser in parallel to the shared analyser
      // This allows us to have custom settings while maintaining the chain
      // We'll tap into the chain after the shared analyser (if it exists) or after filters
      try {
        if (connection.filters && connection.filters.length > 0) {
          const lastFilter = connection.filters[connection.filters.length - 1]!;
          // Connect our analyser in parallel (doesn't break the chain)
          lastFilter.connect(customAnalyser);
        } else {
          // Connect our analyser in parallel to source
          connection.sourceNode.connect(customAnalyser);
        }
        // Don't connect customAnalyser to destination - it's just for analysis
      } catch (error) {
        console.error("[useAudioVisualizer] Error connecting custom analyser:", error);
      }

      audioContextRef.current = connection.audioContext;
      sourceRef.current = connection.sourceNode;

      // Ensure connection chain is complete (critical for playback)
      ensureConnectionChain(connection);

      // Initialize frequency data array
      const bufferLength = analyser.frequencyBinCount;
      setFrequencyData(new Uint8Array(bufferLength));

      setIsInitialized(true);
    } catch (error) {
      console.error("Failed to initialize audio visualizer:", error);
    }
  }, [
    audioElement,
    isInitialized,
    fftSize,
    smoothingTimeConstant,
    minDecibels,
    maxDecibels,
  ]);

  // Get frequency data
  const getFrequencyData = useCallback((): Uint8Array => {
    if (!analyserRef.current) return new Uint8Array(0);

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    return dataArray;
  }, []);

  // Get time domain data (waveform)
  const getTimeDomainData = useCallback((): Uint8Array => {
    if (!analyserRef.current) return new Uint8Array(0);

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteTimeDomainData(dataArray);

    return dataArray;
  }, []);

  // Start visualization loop
  const startVisualization = useCallback(
    (callback: (data: Uint8Array) => void) => {
      if (!analyserRef.current) return;

      const updateData = () => {
        if (!analyserRef.current) return;

        const data = getFrequencyData();
        callback(data);

        animationFrameRef.current = requestAnimationFrame(updateData);
      };

      updateData();
    },
    [getFrequencyData],
  );

  // Stop visualization loop
  const stopVisualization = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Resume audio context if suspended (required by some browsers)
  const resumeContext = useCallback(async () => {
    if (audioContextRef.current?.state === "suspended") {
      try {
        await audioContextRef.current.resume();
      } catch (error) {
        console.error("Failed to resume audio context:", error);
      }
    }
  }, []);

  // Initialize when audio element changes
  useEffect(() => {
    if (audioElement && !isInitialized) {
      // Wait for user interaction before initializing (browser requirement)
      const handleInteraction = () => {
        initialize();
        document.removeEventListener("click", handleInteraction);
        document.removeEventListener("touchstart", handleInteraction);
      };

      document.addEventListener("click", handleInteraction);
      document.addEventListener("touchstart", handleInteraction);

      return () => {
        document.removeEventListener("click", handleInteraction);
        document.removeEventListener("touchstart", handleInteraction);
      };
    }
  }, [audioElement, isInitialized, initialize]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopVisualization();

      // Release audio connection (but don't cleanup if other components are using it)
      if (audioElement) {
        releaseAudioConnection(audioElement);
      }

      audioContextRef.current = null;
      analyserRef.current = null;
      sourceRef.current = null;
      setIsInitialized(false);
    };
  }, [stopVisualization, audioElement]);

  // Get audio context sample rate
  const getSampleRate = useCallback((): number => {
    return audioContextRef.current?.sampleRate ?? 44100;
  }, []);

  // Get FFT size
  const getFFTSize = useCallback((): number => {
    return analyserRef.current?.fftSize ?? fftSize;
  }, [fftSize]);

  return {
    isInitialized,
    frequencyData,
    analyser: analyserRef.current,
    audioContext: audioContextRef.current,
    getFrequencyData,
    getTimeDomainData,
    getSampleRate,
    getFFTSize,
    startVisualization,
    stopVisualization,
    resumeContext,
    initialize,
  };
}
