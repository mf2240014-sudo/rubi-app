/**
 * Procedural Web Audio API ambient rain soundscape — zero external MP3 dependencies.
 */
class AmbientRainEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private running = false;

  async toggle(): Promise<boolean> {
    if (this.running) {
      this.stop();
      return false;
    }
    await this.start();
    return this.running;
  }

  async start(): Promise<void> {
    if (this.running || typeof window === 'undefined') return;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const bufferSize = ctx.sampleRate * 3;
    const noiseBuffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const output = noiseBuffer.getChannelData(ch);
      let b0 = 0;
      let b1 = 0;
      let b2 = 0;
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99765 * b0 + white * 0.099046;
        b1 = 0.963 * b1 + white * 0.2965164;
        b2 = 0.57 * b2 + white * 1.0526913;
        const pink = (b0 + b1 + b2 + white * 0.1848) * 0.08;
        lastOut = (lastOut + 0.02 * white) / 1.02;
        output[i] = pink * 0.65 + lastOut * 0.55;
      }
    }

    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 1150;

    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 160;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
    masterGain.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + 1.2);

    source.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(masterGain);
    masterGain.connect(ctx.destination);
    source.start();

    this.ctx = ctx;
    this.masterGain = masterGain;
    this.running = true;
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    try {
      this.masterGain?.disconnect();
      void this.ctx?.close();
    } catch {
      // Ignore cleanup failures
    } finally {
      this.masterGain = null;
      this.ctx = null;
    }
  }
}

export const ambientRain = new AmbientRainEngine();
