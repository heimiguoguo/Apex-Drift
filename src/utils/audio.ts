// Procedural Audio Engine using Web Audio API

class SoundManager {
  private ctx: AudioContext | null = null;
  private engineGain: GainNode | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private nitroGain: GainNode | null = null;
  private nitroNoise: AudioBufferSourceNode | null = null;
  private driftGain: GainNode | null = null;
  private driftNoise: AudioBufferSourceNode | null = null;
  private isMuted: boolean = false;
  private initialized: boolean = false;

  private initContext() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      // Master engine oscillator
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc2 = this.ctx.createOscillator();
      this.engineGain = this.ctx.createGain();

      this.engineOsc.type = 'sawtooth';
      this.engineOsc2.type = 'triangle';
      this.engineOsc.frequency.value = 55;
      this.engineOsc2.frequency.value = 27.5;

      this.engineGain.gain.value = 0.0; // Starts silent

      this.engineOsc.connect(this.engineGain);
      this.engineOsc2.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc.start();
      this.engineOsc2.start();

      // White noise buffer for drift and nitro
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      // Drift sound
      this.driftGain = this.ctx.createGain();
      this.driftGain.gain.value = 0;
      const driftFilter = this.ctx.createBiquadFilter();
      driftFilter.type = 'bandpass';
      driftFilter.frequency.value = 900;
      driftFilter.Q.value = 1.8;

      const driftSource = this.ctx.createBufferSource();
      driftSource.buffer = noiseBuffer;
      driftSource.loop = true;
      driftSource.connect(driftFilter);
      driftFilter.connect(this.driftGain);
      this.driftGain.connect(this.ctx.destination);
      driftSource.start();

      // Nitro sound
      this.nitroGain = this.ctx.createGain();
      this.nitroGain.gain.value = 0;
      const nitroFilter = this.ctx.createBiquadFilter();
      nitroFilter.type = 'highpass';
      nitroFilter.frequency.value = 1200;

      const nitroSource = this.ctx.createBufferSource();
      nitroSource.buffer = noiseBuffer;
      nitroSource.loop = true;
      nitroSource.connect(nitroFilter);
      nitroFilter.connect(this.nitroGain);
      this.nitroGain.connect(this.ctx.destination);
      nitroSource.start();

      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio not supported or blocked:', e);
    }
  }

  public userGesture() {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public updateEngine(rpmRatio: number, speedKmh: number, isAccelerating: boolean) {
    if (!this.initialized || !this.ctx || this.isMuted) return;

    const baseFreq = 50 + rpmRatio * 180;
    const targetGain = isAccelerating ? 0.12 : speedKmh > 5 ? 0.05 : 0.02;

    this.engineOsc?.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.06);
    this.engineOsc2?.frequency.setTargetAtTime(baseFreq * 0.5, this.ctx.currentTime, 0.06);
    this.engineGain?.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.08);
  }

  public setDrifting(isDrifting: boolean, driftIntensity: number = 1.0) {
    if (!this.initialized || !this.ctx || this.isMuted) return;
    const target = isDrifting ? Math.min(0.18, 0.08 * driftIntensity) : 0;
    this.driftGain?.gain.setTargetAtTime(target, this.ctx.currentTime, 0.05);
  }

  public setNitro(isNitro: boolean) {
    if (!this.initialized || !this.ctx || this.isMuted) return;
    const target = isNitro ? 0.22 : 0;
    this.nitroGain?.gain.setTargetAtTime(target, this.ctx.currentTime, 0.06);
  }

  public playGearShift() {
    if (!this.initialized || !this.ctx || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch {}
  }

  public playLapBeep(isFinal: boolean = false) {
    if (!this.initialized || !this.ctx || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isFinal ? 880 : 587, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch {}
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.engineGain) {
      this.engineGain.gain.value = 0;
      if (this.driftGain) this.driftGain.gain.value = 0;
      if (this.nitroGain) this.nitroGain.gain.value = 0;
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }
}

export const soundManager = new SoundManager();
