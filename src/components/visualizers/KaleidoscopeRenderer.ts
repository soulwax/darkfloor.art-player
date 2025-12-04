interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  hue: number;
  life: number;
}

export class KaleidoscopeRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;
  private segments = 12;
  private particles: Particle[] = [];
  private time = 0;
  private hueOffset = 0;
  private centerX = 0;
  private centerY = 0;
  private maxRadius = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;

    // Create offscreen canvas for one segment
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = canvas.width;
    this.offscreenCanvas.height = canvas.height;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d')!;

    this.centerX = canvas.width / 2;
    this.centerY = canvas.height / 2;
    this.maxRadius = Math.max(canvas.width, canvas.height);

    this.initializeParticles();
  }

  private initializeParticles(): void {
    const particleCount = 100;
    const segmentAngle = (Math.PI * 2) / this.segments;

    for (let i = 0; i < particleCount; i++) {
      // Place particles only in first segment, they'll be mirrored
      const angle = Math.random() * segmentAngle;
      const radius = Math.random() * this.maxRadius * 0.3;

      this.particles.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: 5 + Math.random() * 15,
        hue: Math.random() * 360,
        life: 1,
      });
    }
  }

  render(dataArray: Uint8Array, bufferLength: number): void {
    const { ctx, canvas } = this;
    this.time += 1;
    this.hueOffset = (this.hueOffset + 0.5) % 360;

    // Calculate audio metrics
    const avgFrequency = dataArray.reduce((sum, val) => sum + val, 0) / bufferLength;
    const audioIntensity = avgFrequency / 255;
    const bassIntensity = this.getFrequencyBandIntensity(dataArray, bufferLength, 0, 0.15);
    const midIntensity = this.getFrequencyBandIntensity(dataArray, bufferLength, 0.3, 0.6);
    const trebleIntensity = this.getFrequencyBandIntensity(dataArray, bufferLength, 0.7, 1.0);

    // Clear main canvas with slight fade for trails (darker for more vibrant trails)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Adjust segment count based on audio
    const targetSegments = Math.floor(8 + bassIntensity * 16);
    if (Math.abs(this.segments - targetSegments) > 0 && this.time % 10 === 0) {
      this.segments = targetSegments;
    }

    // Clear offscreen canvas
    this.offscreenCtx.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);

    // Draw one segment on offscreen canvas
    this.drawSegment(audioIntensity, bassIntensity, midIntensity, trebleIntensity);

    // Mirror the segment across all kaleidoscope segments
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    const segmentAngle = (Math.PI * 2) / this.segments;

    for (let i = 0; i < this.segments; i++) {
      ctx.save();

      // Rotate to segment position
      ctx.rotate(segmentAngle * i);

      // Mirror every other segment for true kaleidoscope effect
      if (i % 2 === 1) {
        ctx.scale(1, -1);
      }

      // Draw the offscreen canvas
      ctx.drawImage(
        this.offscreenCanvas,
        -this.centerX,
        -this.centerY
      );

      ctx.restore();
    }

    ctx.restore();

    // Update particles
    this.updateParticles(audioIntensity, bassIntensity);
  }

  private getFrequencyBandIntensity(
    dataArray: Uint8Array,
    bufferLength: number,
    startRatio: number,
    endRatio: number
  ): number {
    const startIndex = Math.floor(bufferLength * startRatio);
    const endIndex = Math.floor(bufferLength * endRatio);
    let sum = 0;
    for (let i = startIndex; i < endIndex; i++) {
      sum += dataArray[i] ?? 0;
    }
    return sum / (endIndex - startIndex) / 255;
  }

  private drawSegment(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
    trebleIntensity: number
  ): void {
    const ctx = this.offscreenCtx;
    const segmentAngle = (Math.PI * 2) / this.segments;

    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    // Clip to one segment (a triangle from center)
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(0) * this.maxRadius, Math.sin(0) * this.maxRadius);
    ctx.lineTo(Math.cos(segmentAngle) * this.maxRadius, Math.sin(segmentAngle) * this.maxRadius);
    ctx.closePath();
    ctx.clip();

    // Draw colorful rays within the segment
    this.drawRays(ctx, audioIntensity, bassIntensity, midIntensity, segmentAngle);

    // Draw particles
    this.drawParticles(ctx, audioIntensity, trebleIntensity);

    // Draw geometric patterns
    this.drawGeometricPatterns(ctx, audioIntensity, midIntensity, trebleIntensity);

    ctx.restore();
  }

  private drawRays(
    ctx: CanvasRenderingContext2D,
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
    segmentAngle: number
  ): void {
    const rayCount = 12;

    for (let i = 0; i < rayCount; i++) {
      const angle = (segmentAngle * i) / rayCount;
      const length = this.maxRadius * (0.6 + Math.sin(this.time * 0.02 + i) * 0.2 + bassIntensity * 0.3);
      const width = (2 + bassIntensity * 8) * (1 + Math.sin(this.time * 0.03 + i) * 0.3);

      const endX = Math.cos(angle) * length;
      const endY = Math.sin(angle) * length;

      // Create colorful gradient
      const gradient = ctx.createLinearGradient(0, 0, endX, endY);
      const hue1 = (this.hueOffset + i * 45 + this.time * 0.5) % 360;
      const hue2 = (hue1 + 60) % 360;
      const hue3 = (hue1 + 120) % 360;

      gradient.addColorStop(0, `hsla(${hue1}, 100%, ${50 + audioIntensity * 30}%, ${0.3 + bassIntensity * 0.2})`);
      gradient.addColorStop(0.5, `hsla(${hue2}, 100%, ${60 + midIntensity * 30}%, ${0.35 + audioIntensity * 0.15})`);
      gradient.addColorStop(1, `hsla(${hue3}, 100%, 70%, 0)`);

      ctx.save();
      ctx.strokeStyle = gradient;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.shadowBlur = 20 + bassIntensity * 40;
      ctx.shadowColor = `hsla(${hue1}, 100%, 60%, ${0.8 + audioIntensity * 0.2})`;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.restore();
    }
  }

  private drawParticles(
    ctx: CanvasRenderingContext2D,
    audioIntensity: number,
    trebleIntensity: number
  ): void {
    this.particles.forEach((particle) => {
      if (particle.life <= 0) return;

      const size = particle.size * (0.5 + audioIntensity * 0.5 + trebleIntensity * 0.5);
      const alpha = particle.life * (0.6 + audioIntensity * 0.4);

      // Draw particle with glow
      ctx.save();
      ctx.translate(particle.x, particle.y);

      const hue = (particle.hue + this.hueOffset) % 360;
      ctx.fillStyle = `hsla(${hue}, 100%, ${60 + trebleIntensity * 30}%, ${alpha * 0.5})`;
      ctx.shadowBlur = 15 + trebleIntensity * 25;
      ctx.shadowColor = `hsla(${hue}, 100%, 70%, ${alpha * 0.5})`;

      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fill();

      // Draw inner bright core
      ctx.fillStyle = `hsla(${(hue + 30) % 360}, 100%, 90%, ${alpha * 0.4})`;
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  }

  private drawGeometricPatterns(
    ctx: CanvasRenderingContext2D,
    audioIntensity: number,
    midIntensity: number,
    trebleIntensity: number
  ): void {
    const circles = 5;

    for (let i = 0; i < circles; i++) {
      const radius = (i + 1) * 30 * (0.8 + audioIntensity * 0.4);
      const pulse = Math.sin(this.time * 0.05 + i) * 10;
      const currentRadius = radius + pulse + midIntensity * 20;

      const hue = (this.hueOffset + i * 60 + this.time) % 360;

      ctx.save();
      ctx.strokeStyle = `hsla(${hue}, 100%, ${50 + trebleIntensity * 30}%, ${0.15 + audioIntensity * 0.15})`;
      ctx.lineWidth = 2 + midIntensity * 4;
      ctx.shadowBlur = 10 + trebleIntensity * 20;
      ctx.shadowColor = `hsla(${hue}, 100%, 60%, ${0.25 + audioIntensity * 0.25})`;

      ctx.beginPath();
      ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Draw rotating polygons
    const sides = 6;
    const polygonRadius = 100 * (0.7 + audioIntensity * 0.5);
    const rotation = this.time * 0.02;

    ctx.save();
    ctx.rotate(rotation);

    const hue = (this.hueOffset + this.time * 2) % 360;
    ctx.strokeStyle = `hsla(${hue}, 100%, ${60 + midIntensity * 30}%, ${0.25 + audioIntensity * 0.2})`;
    ctx.fillStyle = `hsla(${hue}, 100%, ${50 + audioIntensity * 30}%, ${0.075 + trebleIntensity * 0.1})`;
    ctx.lineWidth = 3 + trebleIntensity * 5;
    ctx.shadowBlur = 15 + audioIntensity * 30;
    ctx.shadowColor = `hsla(${hue}, 100%, 70%, ${0.3 + audioIntensity * 0.2})`;

    ctx.beginPath();
    for (let i = 0; i <= sides; i++) {
      const angle = (Math.PI * 2 * i) / sides;
      const x = Math.cos(angle) * polygonRadius;
      const y = Math.sin(angle) * polygonRadius;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  private updateParticles(audioIntensity: number, bassIntensity: number): void {
    const segmentAngle = (Math.PI * 2) / this.segments;

    this.particles.forEach((particle) => {
      // Update position
      particle.x += particle.vx * (1 + audioIntensity);
      particle.y += particle.vy * (1 + audioIntensity);

      // Add some rotation
      const angle = Math.atan2(particle.y, particle.x);
      const radius = Math.sqrt(particle.x ** 2 + particle.y ** 2);
      const newAngle = angle + 0.01 * (1 + audioIntensity);
      particle.x = Math.cos(newAngle) * radius;
      particle.y = Math.sin(newAngle) * radius;

      // Decay life
      particle.life -= 0.005;

      // Keep within segment bounds
      let particleAngle = Math.atan2(particle.y, particle.x);
      if (particleAngle < 0) particleAngle += Math.PI * 2;

      if (particleAngle > segmentAngle) {
        particleAngle = segmentAngle - (particleAngle - segmentAngle);
        particle.x = Math.cos(particleAngle) * radius;
        particle.y = Math.sin(particleAngle) * radius;
        particle.vx *= -0.8;
        particle.vy *= -0.8;
      }

      // Respawn dead particles
      if (particle.life <= 0 || radius > this.maxRadius * 0.4) {
        const newAngle = Math.random() * segmentAngle;
        const newRadius = Math.random() * 50;
        particle.x = Math.cos(newAngle) * newRadius;
        particle.y = Math.sin(newAngle) * newRadius;
        particle.vx = (Math.random() - 0.5) * 2;
        particle.vy = (Math.random() - 0.5) * 2;
        particle.life = 1;
        particle.hue = Math.random() * 360;
        particle.size = 5 + Math.random() * 15 + bassIntensity * 10;
      }
    });
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.offscreenCanvas.width = width;
    this.offscreenCanvas.height = height;
    this.centerX = width / 2;
    this.centerY = height / 2;
    this.maxRadius = Math.max(width, height);
    this.particles = [];
    this.initializeParticles();
  }
}
