export class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(console.error);
    }
    return this.ctx;
  }

  public setMute(mute: boolean) {
    this.isMuted = mute;
  }

  public getMute(): boolean {
    return this.isMuted;
  }

  /**
   * Initialize audio context on user interaction to handle autoplay policies
   */
  public initAudioContext() {
    this.getContext();
  }

  private playTone(freq: number, type: OscillatorType, duration: number, startTimeOffset: number = 0, volume: number = 0.5) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + startTimeOffset);

    // Smooth envelope to prevent clicks
    gainNode.gain.setValueAtTime(0, ctx.currentTime + startTimeOffset);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + startTimeOffset + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTimeOffset + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(ctx.currentTime + startTimeOffset);
    osc.stop(ctx.currentTime + startTimeOffset + duration);
  }

  /**
   * Synthesizes a crisp 2-tone kitchen bell chime (880Hz -> 1760Hz double ding)
   */
  public playNewOrderChime() {
    this.playTone(880, 'sine', 0.5, 0, 0.6);
    this.playTone(1760, 'sine', 0.6, 0.15, 0.5);
  }

  /**
   * Synthesizes a 3-tone urgent alert pulse (523Hz warning tone)
   */
  public playUrgentAlert() {
    this.playTone(523, 'square', 0.3, 0, 0.4);
    this.playTone(523, 'square', 0.3, 0.4, 0.4);
    this.playTone(523, 'square', 0.3, 0.8, 0.4);
  }

  /**
   * Synthesizes a short cheerful confirmation beep (1200Hz 80ms)
   */
  public playSuccessBeep() {
    this.playTone(1200, 'sine', 0.08, 0, 0.3);
  }
}

export const soundEffects = new AudioSynthesizer();

export const playNewOrderChime = () => soundEffects.playNewOrderChime();
export const playUrgentAlert = () => soundEffects.playUrgentAlert();
export const playSuccessBeep = () => soundEffects.playSuccessBeep();
