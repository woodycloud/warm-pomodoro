// Web Audio API Synthesizer for high-quality audio feedback without external assets.

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  // Resume if suspended (browsers auto-suspend audio context until user interaction)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play a professional warm chime indicating completion of a session
 */
export function playChime(volume: number = 0.5) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Main chime note G5 (783.99 Hz) and C6 (1046.50 Hz) for a bright, positive finish
    const notes = [783.99, 1046.50];
    
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      
      // Warm envelope
      gainNode.gain.setValueAtTime(0, now + idx * 0.08);
      gainNode.gain.linearRampToValueAtTime(volume * 0.3, now + idx * 0.08 + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 1.2);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 1.3);
    });
  } catch (error) {
    console.warn('Failed to play chime audio:', error);
  }
}

/**
 * Play a peaceful ambient sound indicating break completion / start of focus
 */
export function playFocusStartChime(volume: number = 0.5) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Ascending warm tone (C5 to G5)
    const notes = [523.25, 659.25, 783.99];
    
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);
      
      gainNode.gain.setValueAtTime(0, now + idx * 0.1);
      gainNode.gain.linearRampToValueAtTime(volume * 0.25, now + idx * 0.1 + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 0.8);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.9);
    });
  } catch (error) {
    console.warn('Failed to play focus start chime:', error);
  }
}

/**
 * Play a soft clicking feedback for buttons and tactile interaction
 */
export function playClickSound(volume: number = 0.5) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.03);
    
    gainNode.gain.setValueAtTime(volume * 0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.04);
  } catch (error) {
    console.warn('Failed to play click sound:', error);
  }
}
