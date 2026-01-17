
import React, { useRef, useEffect, useState, useCallback } from 'react';

interface ScratchCardProps {
  revealValue: string | number;
  onComplete: () => void;
  isAlreadyRevealed?: boolean;
}

const ScratchCard: React.FC<ScratchCardProps> = ({ revealValue, onComplete, isAlreadyRevealed }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRevealed, setIsRevealed] = useState(isAlreadyRevealed || false);
  const [isDrawing, setIsDrawing] = useState(false);

  // Use String() to ensure we never try to render an object as a React child
  const displayValue = String(revealValue ?? '??');

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || isAlreadyRevealed || isRevealed) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Dark high-tech surface
    ctx.fillStyle = '#171717';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Circuit noise/Tech pattern
    ctx.lineWidth = 1;
    for (let i = 0; i < 60; i++) {
      ctx.strokeStyle = i % 3 === 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.05)';
      ctx.beginPath();
      const x = Math.random() * rect.width;
      const y = Math.random() * rect.height;
      ctx.moveTo(x, y);
      ctx.lineTo(x + (Math.random() - 0.5) * 50, y + (Math.random() - 0.5) * 50);
      ctx.stroke();
    }

    // Branding text
    ctx.font = 'bold 16px Inter';
    ctx.fillStyle = '#dc2626';
    ctx.textAlign = 'center';
    ctx.fillText('ZERONE 7.0', rect.width / 2, rect.height / 2 - 10);
    ctx.font = '800 10px Inter';
    ctx.fillStyle = '#444';
    ctx.fillText('SCRATCH TO REVEAL SQUAD', rect.width / 2, rect.height / 2 + 15);
  }, [isAlreadyRevealed, isRevealed]);

  useEffect(() => {
    // Initial setup
    setupCanvas();
    
    // Cleanup/resize handler
    const handleResize = () => setupCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setupCanvas]);

  const getPercentage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 0;

    const { width, height } = canvas;
    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    let transparent = 0;

    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] === 0) transparent++;
    }

    return (transparent / (pixels.length / 4)) * 100;
  };

  const scratch = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || isRevealed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();

    // Auto-reveal after enough is scratched
    if (getPercentage() > 40) {
      setIsRevealed(true);
      onComplete();
    }
  };

  return (
    <div className="relative w-full max-w-sm aspect-video bg-neutral-900 rounded-[2.5rem] border-[4px] border-white/5 flex items-center justify-center overflow-hidden shadow-[0_0_80px_-20px_rgba(220,38,38,0.4)] transition-all duration-700">
      {/* Underlying Content (The Squad Number) */}
      <div className="text-center px-6 select-none">
        <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.6em] mb-2 opacity-80">Designated Unit</p>
        <div className="text-8xl font-black text-white tracking-tighter drop-shadow-[0_0_25px_rgba(255,255,255,0.3)] animate-pulse">
          {displayValue}
        </div>
      </div>

      {/* Overlay Canvas for Scratching */}
      {!isAlreadyRevealed && !isRevealed && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-crosshair touch-none transition-opacity duration-1000"
          onMouseDown={() => setIsDrawing(true)}
          onMouseUp={() => setIsDrawing(false)}
          onMouseOut={() => setIsDrawing(false)}
          onMouseMove={scratch}
          onTouchStart={() => setIsDrawing(true)}
          onTouchEnd={() => setIsDrawing(false)}
          onTouchMove={scratch}
        />
      )}
    </div>
  );
};

export default ScratchCard;
