import { AlertToneId, VibrationPatternId } from '../types';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

/**
 * Advanced Sound Synthesizer & Audio Player using Web Audio API and HTML5 Audio
 */
let audioCtx: AudioContext | null = null;
let currentCustomAudio: HTMLAudioElement | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

export interface TonePreset {
  id: AlertToneId;
  name: string;
  category: string;
  description: string;
  iconName: string;
}

export const ALERT_TONE_PRESETS: TonePreset[] = [
  {
    id: 'whatsapp',
    name: 'نغمة إشعار واتساب الأصلية (WhatsApp Note) 💬',
    category: 'نغمات واتساب',
    description: 'نغمة رسائل واتساب الشهيرة بنبرتها المزدوجة الواضحة جداً',
    iconName: 'MessageSquare',
  },
  {
    id: 'chime',
    name: 'جرس كلاسيكي (Chime)',
    category: 'نغمة الهاتف الأساسية',
    description: 'نغمة جرس ناعمة وواضحة جداً داخل السيارة',
    iconName: 'Bell',
  },
  {
    id: 'radar_beep',
    name: 'نبضات الرادار (Radar Pulse)',
    category: 'تكتيكي',
    description: 'صافرات رادارية سريعة ومميزة للتوصيل',
    iconName: 'Radar',
  },
  {
    id: 'cash_register',
    name: 'رنين النقود والأرباح (Cash Register)',
    category: 'أرباح',
    description: 'صوت رنين الكاشير المبهج عند وصول طلب مربح',
    iconName: 'Coins',
  },
  {
    id: 'marimba',
    name: 'ماريمبا آيفون (Marimba Style)',
    category: 'نغمات هواتف',
    description: 'نغمات إيقاعية موسيقية واضحة وممتعة',
    iconName: 'Music',
  },
  {
    id: 'car_horn',
    name: 'بوق سيارة مزدوج (Delivery Beep)',
    category: 'سياقة وطريق',
    description: 'تنبيه قوي ينبه السائق حتى مع الموسيقى والضجيج',
    iconName: 'Car',
  },
  {
    id: 'urgent_siren',
    name: 'تنبيه فوري سريع (Urgent Rush)',
    category: 'سرعة البرق',
    description: 'نغمة طارئة لحجز الطلب قبل زملائك في الجروب',
    iconName: 'Zap',
  },
  {
    id: 'custom_file',
    name: 'ملف صوتي خاص من هاتفك 🎵',
    category: 'مخصص',
    description: 'ارفع أو اختر أي نغمة MP3 / WAV من جهازك',
    iconName: 'UploadCloud',
  },
];

export interface VibrationPreset {
  id: VibrationPatternId;
  name: string;
  description: string;
  durations: number[];
}

export const VIBRATION_PRESETS: VibrationPreset[] = [
  {
    id: 'standard',
    name: 'اهتزاز قياسي (Double Buzz)',
    description: 'نبضتان متوازنتان مناسبتان لوضع الهاتف في الحامل',
    durations: [180, 80, 180],
  },
  {
    id: 'pulse',
    name: 'نبضات سريعة متتالية (Rapid Pulse)',
    description: 'ثلاث نبضات خاطفة ملفتة للانتباه',
    durations: [100, 60, 100, 60, 100],
  },
  {
    id: 'heavy',
    name: 'اهتزاز قوي وممتد (Heavy Rumble)',
    description: 'اهتزاز عميق مخصص للسيارات ذات الاهتزاز العالي',
    durations: [350, 100, 350],
  },
  {
    id: 'urgent',
    name: 'اهتزاز تصاعدي طارئ (VIP Urgent)',
    description: 'نمط تصاعدي مميز للطلبات العاجلة',
    durations: [150, 80, 200, 80, 300],
  },
  {
    id: 'subtle',
    name: 'اهتزاز خفيف هادئ (Subtle Tap)',
    description: 'نبضة لطيفة وغير مزعجة',
    durations: [90],
  },
];

/**
 * Play alert tone based on selection, volume, and optional custom file
 */
export function playAlertTone(
  tone: AlertToneId = 'chime',
  volume: number = 80, // 0 to 100
  customDataUrl?: string
) {
  const normVol = Math.max(0.01, Math.min(1, volume / 100));

  // If user selected custom uploaded file and it exists, play it!
  if (tone === 'custom_file' && customDataUrl) {
    try {
      if (currentCustomAudio) {
        currentCustomAudio.pause();
        currentCustomAudio.currentTime = 0;
      }
      currentCustomAudio = new Audio(customDataUrl);
      currentCustomAudio.volume = normVol;
      currentCustomAudio.play().catch((err) => {
        console.warn('Playback of custom audio failed, falling back to synthesizer', err);
        playSynthesizedTone('chime', normVol);
      });
      return;
    } catch {
      playSynthesizedTone('chime', normVol);
      return;
    }
  }

  playSynthesizedTone(tone, normVol);
}

/**
 * Play synthesized sound effects with accurate waveforms
 */
function playSynthesizedTone(tone: AlertToneId, volume: number) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume, now);
    masterGain.connect(ctx.destination);

    switch (tone) {
      case 'whatsapp': {
        // Iconic WhatsApp incoming notification chime (cheerful double pop/bell)
        // First note: 880Hz (A5)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, now);
        osc1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.05); // slight rise
        gain1.gain.setValueAtTime(0.01, now);
        gain1.gain.linearRampToValueAtTime(0.45, now + 0.01);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc1.connect(gain1);
        gain1.connect(masterGain);
        osc1.start(now);
        osc1.stop(now + 0.15);

        // Second note: 1318.5Hz (E6) bright and ringing
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1318.5, now + 0.08);
        osc2.frequency.exponentialRampToValueAtTime(1480, now + 0.15);
        gain2.gain.setValueAtTime(0.01, now + 0.08);
        gain2.gain.linearRampToValueAtTime(0.55, now + 0.095);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
        osc2.connect(gain2);
        gain2.connect(masterGain);
        osc2.start(now + 0.08);
        osc2.stop(now + 0.45);

        // High harmonic sparkle (2637 Hz / E7) for the crisp digital touch
        const osc3 = ctx.createOscillator();
        const gain3 = ctx.createGain();
        osc3.type = 'triangle';
        osc3.frequency.setValueAtTime(2637, now + 0.085);
        gain3.gain.setValueAtTime(0.01, now + 0.085);
        gain3.gain.linearRampToValueAtTime(0.12, now + 0.095);
        gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc3.connect(gain3);
        gain3.connect(masterGain);
        osc3.start(now + 0.085);
        osc3.stop(now + 0.3);
        break;
      }

      case 'radar_beep': {
        // High-tech radar pings (two fast high chirps)
        [0, 0.12].forEach((offset) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1400, now + offset);
          osc.frequency.exponentialRampToValueAtTime(1800, now + offset + 0.08);

          gain.gain.setValueAtTime(0.01, now + offset);
          gain.gain.linearRampToValueAtTime(0.35, now + offset + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.08);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(now + offset);
          osc.stop(now + offset + 0.09);
        });
        break;
      }

      case 'cash_register': {
        // "Cha-ching!" effect: metal noise burst + bright high bell
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const bellGain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(987.77, now); // B5
        osc1.frequency.setValueAtTime(1318.51, now + 0.1); // E6

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1975.53, now + 0.1); // B6

        bellGain.gain.setValueAtTime(0.01, now);
        bellGain.gain.linearRampToValueAtTime(0.4, now + 0.02);
        bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        osc1.connect(bellGain);
        osc2.connect(bellGain);
        bellGain.connect(masterGain);

        osc1.start(now);
        osc2.start(now + 0.1);
        osc1.stop(now + 0.6);
        osc2.stop(now + 0.6);
        break;
      }

      case 'car_horn': {
        // Two simultaneous frequencies creating a friendly dual-tone vehicle honk
        [370, 440].forEach((freq) => {
          [0, 0.18].forEach((offset) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now + offset);

            gain.gain.setValueAtTime(0.01, now + offset);
            gain.gain.linearRampToValueAtTime(0.15, now + offset + 0.02);
            gain.gain.linearRampToValueAtTime(0.12, now + offset + 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.12);

            osc.connect(gain);
            gain.connect(masterGain);

            osc.start(now + offset);
            osc.stop(now + offset + 0.13);
          });
        });
        break;
      }

      case 'marimba': {
        // Warm percussive marimba chord
        const notes = [440, 554.37, 659.25, 880];
        notes.forEach((freq, idx) => {
          const startTime = now + idx * 0.06;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime);

          gain.gain.setValueAtTime(0.01, startTime);
          gain.gain.linearRampToValueAtTime(0.35, startTime + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(startTime);
          osc.stop(startTime + 0.32);
        });
        break;
      }

      case 'urgent_siren': {
        // Siren glide up and down
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(700, now);
        osc.frequency.linearRampToValueAtTime(1200, now + 0.18);
        osc.frequency.linearRampToValueAtTime(800, now + 0.35);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.4, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + 0.42);
        break;
      }

      case 'chime':
      default: {
        // Classic high-clarity delivery chime (D5 -> A5)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880, now + 0.12); // A5

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.35, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + 0.58);
        break;
      }
    }
  } catch (e) {
    console.warn('Audio alert error:', e);
  }
}

/**
 * Play an uplifting 4-note ascending fanfare for VIP Excellent orders (90%+)
 */
export function playExcellentAlertSound(volume: number = 85) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const normVol = Math.max(0.01, Math.min(1, volume / 100));
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(normVol, now);
    masterGain.connect(ctx.destination);

    // Play an uplifting 4-note ascending fanfare (C5, E5, G5, C6)
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const noteTime = now + idx * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.01, noteTime);
      gain.gain.linearRampToValueAtTime(0.4, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.45);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.5);
    });
  } catch (e) {
    console.warn('Excellent alert error:', e);
  }
}

/**
 * Synthesizes a tactile acoustic motor vibration sound (low frequency 54Hz buzz pulse)
 * Matches real phone vibration motors so the user can feel/hear the vibration even
 * in browsers, iframes, iOS Safari, or desktops where physical motor is unavailable or restricted.
 */
export function playHapticFeedbackTone(durations: number[], intensity = 2) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const baseFreq = intensity === 1 ? 72 : intensity === 3 ? 48 : 58;
    const gainLevel = intensity === 1 ? 0.2 : intensity === 3 ? 0.6 : 0.4;
    const startTime = ctx.currentTime;
    let accumulatedTime = startTime;

    durations.forEach((durMs, idx) => {
      const durSec = Math.max(0.04, durMs / 1000);
      const isVibratePulse = idx % 2 === 0;

      if (isVibratePulse) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Create deep resonant vibration buzz
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(baseFreq, accumulatedTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.92, accumulatedTime + durSec);

        // Lowpass filter to muffle the sawtooth into a low ERM motor vibration hum
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(140, accumulatedTime);

        gain.gain.setValueAtTime(0.01, accumulatedTime);
        gain.gain.linearRampToValueAtTime(gainLevel, accumulatedTime + 0.02);
        gain.gain.setValueAtTime(gainLevel, accumulatedTime + Math.max(0.02, durSec - 0.03));
        gain.gain.linearRampToValueAtTime(0.001, accumulatedTime + durSec);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(accumulatedTime);
        osc.stop(accumulatedTime + durSec + 0.05);
      }

      accumulatedTime += durSec;
    });
  } catch (err) {
    console.warn('[Orderi] Haptic sound simulation error:', err);
  }
}

/**
 * Trigger vibration pattern with user selected intensity and pattern
 * Multi-tiered engine:
 * 1. Capacitor Native Haptics on Android
 * 2. Web Vibration API (navigator.vibrate)
 * 3. Tactile sub-bass motor resonance audio buzz (works 100% on all browsers/iframes/iOS/desktops)
 * Returns the total duration in milliseconds
 */
export function triggerCustomVibration(
  pattern: VibrationPatternId = 'standard',
  intensity: number = 2, // 1: subtle, 2: medium, 3: heavy
  isExcellent = false
): number {
  const preset = VIBRATION_PRESETS.find((p) => p.id === pattern) || VIBRATION_PRESETS[0];
  const durations = isExcellent ? [150, 80, 200, 80, 280] : preset.durations;

  const multiplier = intensity === 1 ? 0.6 : intensity === 3 ? 1.4 : 1.0;
  const scaledDurations = durations.map((dur, index) => {
    return index % 2 === 0 ? Math.round(dur * multiplier) : dur;
  });

  const totalDurationMs = scaledDurations.reduce((acc, curr) => acc + curr, 0);

  // 1. Capacitor Native Haptics for Android
  try {
    if (pattern === 'subtle') {
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    } else if (pattern === 'heavy' || intensity === 3) {
      Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
    } else if (isExcellent || pattern === 'urgent') {
      Haptics.notification({ type: NotificationType.Success }).catch(() => {});
    } else {
      Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
    }
    // Also trigger native pattern vibration
    Haptics.vibrate({ duration: scaledDurations[0] || 200 }).catch(() => {});
  } catch {}

  // 2. Standard Web Vibration API
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(scaledDurations);
    }
  } catch {}

  // 3. Tactile Acoustic Motor Resonance Buzz (Ensures 100% feedback across all devices & iframes)
  playHapticFeedbackTone(scaledDurations, intensity);

  return totalDurationMs;
}
