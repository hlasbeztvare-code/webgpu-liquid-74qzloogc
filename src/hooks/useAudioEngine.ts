import { useRef, useCallback } from 'react';

interface AmbientNodes {
  gain: GainNode;
  filter: BiquadFilterNode;
}

/**
 * useAudioEngine
 * 
 * Manages the WebAudio binaural ambient drone + transient sound FX.
 * - `init()` — creates AudioContext + ambient oscillators on first user gesture
 * - `playSwitch(on)` — architect mode toggle sound
 * - `playDetonate()` — detonation explosion sound
 */
export function useAudioEngine() {
  const ctxRef = useRef<AudioContext | null>(null);
  const ambientRef = useRef<AmbientNodes | null>(null);

  const init = useCallback(() => {
    if (!ctxRef.current) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      ctxRef.current = new AC();
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume();

    if (!ambientRef.current && ctxRef.current) {
      const ctx = ctxRef.current;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc1.type = 'sine'; osc1.frequency.value = 40;
      osc2.type = 'sine'; osc2.frequency.value = 40.5; // binaural beat
      filter.type = 'lowpass'; filter.frequency.value = 200;
      gain.gain.value = 0;

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc1.start();
      osc2.start();
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 3);

      ambientRef.current = { gain, filter };
    }
  }, []);

  const playTransient = useCallback((opts: {
    waveform: OscillatorType;
    freqStart: number;
    freqEnd: number;
    filterStart: number;
    duration: number;
    ambientFilterTarget: number;
    ambientGainTarget: number;
  }) => {
    try {
      init();
      const ctx = ctxRef.current!;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const g = ctx.createGain();

      osc.connect(filter);
      filter.connect(g);
      g.connect(ctx.destination);

      osc.type = opts.waveform;
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(opts.filterStart, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + opts.duration);

      osc.frequency.setValueAtTime(opts.freqStart, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(opts.freqEnd, ctx.currentTime + opts.duration);

      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + opts.duration);

      osc.start();
      osc.stop(ctx.currentTime + opts.duration);

      if (ambientRef.current) {
        ambientRef.current.filter.frequency.exponentialRampToValueAtTime(
          opts.ambientFilterTarget, ctx.currentTime + 1
        );
        ambientRef.current.gain.gain.linearRampToValueAtTime(
          opts.ambientGainTarget, ctx.currentTime + 1
        );
      }
    } catch { /* silent fail — audio is non-critical */ }
  }, [init]);

  const playSwitch = useCallback((on: boolean) => {
    playTransient({
      waveform: on ? 'sawtooth' : 'sine',
      freqStart: on ? 150 : 80,
      freqEnd: on ? 60 : 160,
      filterStart: on ? 2000 : 500,
      duration: 1.2,
      ambientFilterTarget: on ? 600 : 200,
      ambientGainTarget: on ? 0.12 : 0.08,
    });
  }, [playTransient]);

  const playDetonate = useCallback(() => {
    playTransient({
      waveform: 'sawtooth',
      freqStart: 150,
      freqEnd: 20,
      filterStart: 4000,
      duration: 2.0,
      ambientFilterTarget: 80,
      ambientGainTarget: 0.2,
    });
  }, [playTransient]);

  return { init, playSwitch, playDetonate };
}
