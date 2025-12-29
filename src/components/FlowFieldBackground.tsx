// File: src/components/FlowFieldBackground.tsx

"use client";

import { useEffect, useRef } from "react";
import { FlowFieldRenderer } from "./visualizers/FlowFieldRenderer";

interface FlowFieldBackgroundProps {
  analyser: AnalyserNode | null;
  audioContext: AudioContext | null;
  isPlaying: boolean;
  onRendererReady?: (renderer: FlowFieldRenderer | null) => void;
}

export function FlowFieldBackground({
  analyser,
  audioContext,
  isPlaying,
  onRendererReady,
}: FlowFieldBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<FlowFieldRenderer | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize renderer and handle resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateSize = () => {
      // Use display size - renderer handles quality scaling internally
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      if (rendererRef.current) {
        rendererRef.current.resize(window.innerWidth, window.innerHeight);
      } else {
        rendererRef.current = new FlowFieldRenderer(canvas);
      }
      onRendererReady?.(rendererRef.current);
    };

    updateSize();
    window.addEventListener("resize", updateSize);

    return () => {
      window.removeEventListener("resize", updateSize);
      onRendererReady?.(null);
      rendererRef.current = null;
    };
  }, [onRendererReady]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || !analyser || !rendererRef.current) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const renderer = rendererRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const animate = () => {
      analyser.getByteFrequencyData(dataArray);
      renderer.render(dataArray, dataArray.length);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Resume audio context if suspended
    if (audioContext?.state === "suspended") {
      void audioContext.resume();
    }

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, analyser, audioContext]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: -1,
        pointerEvents: "none",
        opacity: 0.6,
        filter: "blur(8px) contrast(1.4) saturate(1.6)",
        mixBlendMode: "screen",
      }}
    />
  );
}
