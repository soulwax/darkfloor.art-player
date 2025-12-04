interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  hue: number;
  life: number;
  maxLife: number;
  trail: { x: number; y: number; alpha: number }[];
}

interface FlowVector {
  angle: number;
  magnitude: number;
}

export class FlowFieldRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private flowField: FlowVector[][] = [];
  private time = 0;
  private width = 0;
  private height = 0;
  private gridSize = 40;
  private cols = 0;
  private rows = 0;
  private noiseScale = 0.003;
  private timeScale = 0.0008;
  private hueBase = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: true })!;
    this.width = canvas.width;
    this.height = canvas.height;

    this.cols = Math.ceil(this.width / this.gridSize);
    this.rows = Math.ceil(this.height / this.gridSize);

    this.initializeFlowField();
    this.initializeParticles();
  }

  private initializeFlowField(): void {
    this.flowField = [];
    for (let y = 0; y < this.rows; y++) {
      const row: FlowVector[] = [];
      for (let x = 0; x < this.cols; x++) {
        row[x] = { angle: 0, magnitude: 0 };
      }
      this.flowField[y] = row;
    }
  }

  private initializeParticles(): void {
    const particleCount = Math.min(800, Math.floor((this.width * this.height) / 1000));

    for (let i = 0; i < particleCount; i++) {
      this.particles.push(this.createParticle());
    }
  }

  private createParticle(): Particle {
    const maxLife = 200 + Math.random() * 300;
    return {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      vx: 0,
      vy: 0,
      size: 1 + Math.random() * 2.5,
      hue: Math.random() * 60,
      life: maxLife,
      maxLife,
      trail: [],
    };
  }

  // Improved Perlin-like noise function
  private noise(x: number, y: number, z: number): number {
    // Multi-octave simplex-style noise
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    // Z dimension for future 3D expansion
    // const Z = Math.floor(z) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);

    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);

    const A = this.hash(X) + Y;
    const B = this.hash(X + 1) + Y;

    return this.lerp(w,
      this.lerp(v,
        this.lerp(u, this.grad(this.hash(A), x, y, z),
                    this.grad(this.hash(B), x - 1, y, z)),
        this.lerp(u, this.grad(this.hash(A + 1), x, y - 1, z),
                    this.grad(this.hash(B + 1), x - 1, y - 1, z))),
      this.lerp(v,
        this.lerp(u, this.grad(this.hash(A + 1), x, y, z - 1),
                    this.grad(this.hash(B + 1), x - 1, y, z - 1)),
        this.lerp(u, this.grad(this.hash(A + 2), x, y - 1, z - 1),
                    this.grad(this.hash(B + 2), x - 1, y - 1, z - 1)))
    );
  }

  private hash(i: number): number {
    const masked = i & 255;
    return ((masked * 2654435761) & 0xFFFFFFFF) >> 24;
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number, z: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  private updateFlowField(audioIntensity: number, bassIntensity: number, midIntensity: number): void {
    const timeOffset = this.time * this.timeScale;
    const audioInfluence = 1 + audioIntensity * 2;

    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const xPos = x * this.gridSize;
        const yPos = y * this.gridSize;

        // Multi-layered noise for complexity
        const noise1 = this.noise(
          xPos * this.noiseScale,
          yPos * this.noiseScale,
          timeOffset
        );

        const noise2 = this.noise(
          xPos * this.noiseScale * 2 + 1000,
          yPos * this.noiseScale * 2 + 1000,
          timeOffset * 1.5
        );

        const noise3 = this.noise(
          xPos * this.noiseScale * 0.5,
          yPos * this.noiseScale * 0.5,
          timeOffset * 0.5 + bassIntensity * 10
        );

        // Combine noise layers with audio influence
        const combinedNoise = (noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2) * audioInfluence;

        // Create vortex centers that move with mid frequencies
        const vortexX = this.width * 0.5 + Math.sin(timeOffset * 2 + midIntensity * Math.PI) * this.width * 0.3;
        const vortexY = this.height * 0.5 + Math.cos(timeOffset * 1.5 + midIntensity * Math.PI) * this.height * 0.3;

        const dx = xPos - vortexX;
        const dy = yPos - vortexY;
        const distToVortex = Math.sqrt(dx * dx + dy * dy);
        const vortexInfluence = Math.max(0, 1 - distToVortex / (Math.min(this.width, this.height) * 0.5));

        // Blend flow field with vortex
        const baseAngle = combinedNoise * Math.PI * 4;
        const vortexAngle = Math.atan2(dy, dx) + Math.PI * 0.5;
        const angle = baseAngle * (1 - vortexInfluence * 0.7) + vortexAngle * vortexInfluence * 0.7;

        const magnitude = 0.5 + audioIntensity * 1.5 + vortexInfluence * 0.5;

        const row = this.flowField[y];
        if (row) {
          row[x] = { angle, magnitude };
        }
      }
    }
  }

  private updateParticle(particle: Particle, audioIntensity: number, trebleIntensity: number): void {
    // Get flow field influence
    const col = Math.floor(particle.x / this.gridSize);
    const row = Math.floor(particle.y / this.gridSize);

    if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
      const flowRow = this.flowField[row];
      if (flowRow) {
        const flow = flowRow[col];
        if (flow) {
          const force = flow.magnitude * (0.3 + audioIntensity * 0.4);

          particle.vx += Math.cos(flow.angle) * force;
          particle.vy += Math.sin(flow.angle) * force;
        }
      }
    }

    // Add subtle attraction to center with treble
    const centerX = this.width * 0.5;
    const centerY = this.height * 0.5;
    const dx = centerX - particle.x;
    const dy = centerY - particle.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      const attractionForce = trebleIntensity * 0.02;
      particle.vx += (dx / dist) * attractionForce;
      particle.vy += (dy / dist) * attractionForce;
    }

    // Apply velocity with damping
    const damping = 0.98;
    particle.vx *= damping;
    particle.vy *= damping;

    // Limit velocity
    const maxSpeed = 3 + audioIntensity * 4;
    const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
    if (speed > maxSpeed) {
      particle.vx = (particle.vx / speed) * maxSpeed;
      particle.vy = (particle.vy / speed) * maxSpeed;
    }

    // Store trail
    particle.trail.push({
      x: particle.x,
      y: particle.y,
      alpha: particle.life / particle.maxLife
    });

    // Limit trail length based on audio
    const maxTrailLength = Math.floor(15 + audioIntensity * 25);
    if (particle.trail.length > maxTrailLength) {
      particle.trail.shift();
    }

    // Update position
    particle.x += particle.vx;
    particle.y += particle.vy;

    // Decrease life
    particle.life -= 1;

    // Wrap around edges with smooth transition
    const margin = 50;
    if (particle.x < -margin) particle.x = this.width + margin;
    if (particle.x > this.width + margin) particle.x = -margin;
    if (particle.y < -margin) particle.y = this.height + margin;
    if (particle.y > this.height + margin) particle.y = -margin;

    // Respawn if dead
    if (particle.life <= 0) {
      const newParticle = this.createParticle();
      particle.x = newParticle.x;
      particle.y = newParticle.y;
      particle.vx = newParticle.vx;
      particle.vy = newParticle.vy;
      particle.life = newParticle.maxLife;
      particle.maxLife = newParticle.maxLife;
      particle.hue = this.hueBase + Math.random() * 60;
      particle.trail = [];
    }
  }

  private drawParticle(particle: Particle, audioIntensity: number, trebleIntensity: number): void {
    const ctx = this.ctx;
    const lifeRatio = particle.life / particle.maxLife;

    // Draw trail with gradient
    if (particle.trail.length > 1 && particle.trail[0]) {
      ctx.beginPath();
      ctx.moveTo(particle.trail[0].x, particle.trail[0].y);

      for (let i = 1; i < particle.trail.length; i++) {
        const point = particle.trail[i];
        if (point) {
          ctx.lineTo(point.x, point.y);
        }
      }

      const trailGradient = ctx.createLinearGradient(
        particle.trail[0].x,
        particle.trail[0].y,
        particle.x,
        particle.y
      );

      const hue = (this.hueBase + particle.hue) % 360;
      const saturation = 70 + audioIntensity * 30;
      const lightness = 50 + trebleIntensity * 20;

      trailGradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness}%, 0)`);
      trailGradient.addColorStop(0.5, `hsla(${hue}, ${saturation}%, ${lightness}%, ${lifeRatio * 0.15})`);
      trailGradient.addColorStop(1, `hsla(${hue}, ${saturation}%, ${lightness}%, ${lifeRatio * 0.3})`);

      ctx.strokeStyle = trailGradient;
      ctx.lineWidth = particle.size * 0.8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }

    // Draw particle glow
    const glowSize = particle.size * (2 + audioIntensity * 3);
    const hue = (this.hueBase + particle.hue) % 360;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    const gradient = ctx.createRadialGradient(
      particle.x, particle.y, 0,
      particle.x, particle.y, glowSize
    );

    const alpha = lifeRatio * (0.3 + audioIntensity * 0.2);
    gradient.addColorStop(0, `hsla(${hue}, 100%, 70%, ${alpha})`);
    gradient.addColorStop(0.4, `hsla(${hue}, 90%, 60%, ${alpha * 0.5})`);
    gradient.addColorStop(1, `hsla(${hue}, 80%, 50%, 0)`);

    ctx.fillStyle = gradient;
    ctx.fillRect(
      particle.x - glowSize,
      particle.y - glowSize,
      glowSize * 2,
      glowSize * 2
    );

    ctx.restore();

    // Draw core
    ctx.save();
    ctx.fillStyle = `hsla(${(hue + 30) % 360}, 100%, 90%, ${lifeRatio * 0.5})`;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawAmbientGlow(audioIntensity: number, bassIntensity: number): void {
    const ctx = this.ctx;

    // Create ambient flowing background
    const glowCount = 3;

    for (let i = 0; i < glowCount; i++) {
      const phase = this.time * 0.0003 + i * Math.PI * 2 / glowCount;
      const x = this.width * 0.5 + Math.cos(phase) * this.width * 0.3;
      const y = this.height * 0.5 + Math.sin(phase * 1.3) * this.height * 0.3;
      const radius = Math.min(this.width, this.height) * (0.3 + bassIntensity * 0.2);

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

      const hue = (this.hueBase + i * 120) % 360;
      gradient.addColorStop(0, `hsla(${hue}, 70%, 50%, ${audioIntensity * 0.05})`);
      gradient.addColorStop(0.5, `hsla(${hue}, 60%, 40%, ${audioIntensity * 0.025})`);
      gradient.addColorStop(1, `hsla(${hue}, 50%, 30%, 0)`);

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
    }
  }

  render(dataArray: Uint8Array, bufferLength: number): void {
    const ctx = this.ctx;

    // Calculate audio metrics
    const avgFrequency = dataArray.reduce((sum, val) => sum + val, 0) / bufferLength;
    const audioIntensity = Math.min(1, avgFrequency / 255);
    const bassIntensity = this.getFrequencyBandIntensity(dataArray, bufferLength, 0, 0.1);
    const midIntensity = this.getFrequencyBandIntensity(dataArray, bufferLength, 0.2, 0.5);
    const trebleIntensity = this.getFrequencyBandIntensity(dataArray, bufferLength, 0.6, 1.0);

    // Update time and hue
    this.time += 1;
    this.hueBase = (this.hueBase + 0.2 + bassIntensity * 0.5) % 360;

    // Fade previous frame for trails
    ctx.fillStyle = `rgba(0, 0, 0, ${0.05 + audioIntensity * 0.03})`;
    ctx.fillRect(0, 0, this.width, this.height);

    // Draw ambient glow
    this.drawAmbientGlow(audioIntensity, bassIntensity);

    // Update flow field
    this.updateFlowField(audioIntensity, bassIntensity, midIntensity);

    // Update and draw particles
    for (const particle of this.particles) {
      this.updateParticle(particle, audioIntensity, trebleIntensity);
      this.drawParticle(particle, audioIntensity, trebleIntensity);
    }

    // Add some sparkle with high treble
    if (trebleIntensity > 0.6 && Math.random() > 0.7) {
      this.addSparkle(trebleIntensity);
    }
  }

  private addSparkle(intensity: number): void {
    const x = Math.random() * this.width;
    const y = Math.random() * this.height;
    const size = 2 + Math.random() * 4;

    this.ctx.save();
    this.ctx.fillStyle = `hsla(${this.hueBase}, 100%, 100%, ${intensity * 0.5})`;
    this.ctx.shadowBlur = 10 + intensity * 20;
    this.ctx.shadowColor = `hsla(${this.hueBase}, 100%, 80%, ${intensity * 0.5})`;
    this.ctx.beginPath();
    this.ctx.arc(x, y, size, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
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
    return Math.min(1, sum / (endIndex - startIndex) / 255);
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;

    this.cols = Math.ceil(width / this.gridSize);
    this.rows = Math.ceil(height / this.gridSize);

    this.initializeFlowField();
    this.particles = [];
    this.initializeParticles();
  }
}
