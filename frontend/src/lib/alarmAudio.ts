/**
 * Sovereign Web Audio API Industrial Warning Alarm.
 *
 * Synthesizes an audible industrial alert beep when a critical actuation is DENIED
 * by the PolicyGateway. Zero external audio file dependencies.
 * Respects browser autoplay restrictions and includes mute toggle support.
 */

let audioCtx: AudioContext | null = null;
let isMuted: boolean = false;
let lastPlayedAlarmKey: string | null = null;

export function setAlarmMuted(muted: boolean): void {
  isMuted = muted;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("forge_alarm_muted", muted ? "true" : "false");
    } catch {
      // Ignore storage errors in private browsing
    }
  }
}

export function isAlarmMuted(): boolean {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("forge_alarm_muted");
      if (stored !== null) {
        isMuted = stored === "true";
      }
    } catch {
      // Ignore storage errors
    }
  }
  return isMuted;
}

/**
 * Play a short, clear dual-tone industrial alarm (880 Hz / 660 Hz pulses)
 * indicating an unauthorized blocked critical operation.
 *
 * @param runKey Unique identifier for the blocked action to prevent repeated playback.
 */
export async function playPolicyDenialAlarm(runKey?: string): Promise<boolean> {
  if (isAlarmMuted()) {
    return false;
  }

  // Prevent repeated playback for the exact same denied event
  if (runKey && lastPlayedAlarmKey === runKey) {
    return false;
  }
  if (runKey) {
    lastPlayedAlarmKey = runKey;
  }

  if (typeof window === "undefined") {
    return false;
  }

  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) {
      return false;
    }

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === "suspended") {
      await audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    // Pulse 1: 880 Hz (High warning tone)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.18);

    // Pulse 2: 660 Hz (Secondary warning tone)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = "sawtooth";
    osc2.frequency.setValueAtTime(660, now + 0.22);
    gain2.gain.setValueAtTime(0.25, now + 0.22);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.22);
    osc2.stop(now + 0.45);

    return true;
  } catch (err) {
    console.warn("[ALARM_AUDIO_FAILED] Unable to play Web Audio alarm:", err);
    return false;
  }
}
