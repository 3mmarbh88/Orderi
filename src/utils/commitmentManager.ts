import { MonthlyCommitment, DayOfWeek } from '../types';

export const DAYS_OF_WEEK_MAP: { id: DayOfWeek; name: string; short: string; dayIndex: number }[] = [
  { id: 'sun', name: 'الأحد', short: 'أحد', dayIndex: 0 },
  { id: 'mon', name: 'الإثنين', short: 'إثن', dayIndex: 1 },
  { id: 'tue', name: 'الثلاثاء', short: 'ثلا', dayIndex: 2 },
  { id: 'wed', name: 'الأربعاء', short: 'أرب', dayIndex: 3 },
  { id: 'thu', name: 'الخميس', short: 'خمي', dayIndex: 4 },
  { id: 'fri', name: 'الجمعة', short: 'جمع', dayIndex: 5 },
  { id: 'sat', name: 'السبت', short: 'سبت', dayIndex: 6 },
];

export const STORAGE_KEY_COMMITMENTS = 'orderi_monthly_commitments';

/**
 * Get commitments from local storage
 */
export function getStoredCommitments(): MonthlyCommitment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COMMITMENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('[Orderi Commitments] Error loading commitments:', e);
  }

  // Pre-seed with realistic Bahrain monthly commitments (توصيل مدارس وتوصيل يومي)
  const defaultCommitments: MonthlyCommitment[] = [
    {
      id: 'commit-school-1',
      title: 'توصيل مدارس (مدرسة النور - الرفاع)',
      type: 'school',
      clientName: 'أم علي',
      clientPhone: '97339887766',
      fromArea: 'مدينة عيسى',
      toArea: 'الرفاع',
      pickupTime: '06:50',
      returnPickupTime: '13:40',
      durationMinutes: 45,
      days: ['sun', 'mon', 'tue', 'wed', 'thu'],
      monthlyFeeBhd: 45.0,
      reminderMinutesBefore: 20,
      isActive: true,
      notes: 'توصيل طالبين يومياً في أيام المدارس مع العودة ظهراً',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'commit-work-2',
      title: 'توصيل موظف يومي (مجمع السيف)',
      type: 'daily_work',
      clientName: 'أبو حسين',
      clientPhone: '97336554433',
      fromArea: 'سار',
      toArea: 'السيف',
      pickupTime: '08:15',
      returnPickupTime: '16:30',
      durationMinutes: 30,
      days: ['sun', 'mon', 'tue', 'wed', 'thu'],
      monthlyFeeBhd: 55.0,
      reminderMinutesBefore: 15,
      isActive: true,
      notes: 'التزام دوام يومي - عدم التأخير',
      createdAt: new Date().toISOString(),
    },
  ];

  try {
    localStorage.setItem(STORAGE_KEY_COMMITMENTS, JSON.stringify(defaultCommitments));
  } catch {}

  return defaultCommitments;
}

export function saveStoredCommitments(commitments: MonthlyCommitment[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_COMMITMENTS, JSON.stringify(commitments));
  } catch (e) {
    console.warn('[Orderi Commitments] Error saving commitments:', e);
  }
}

/**
 * Converts a time string "HH:MM" into minutes from midnight (0 to 1439)
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map((p) => parseInt(p, 10));
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return 0;
  return parts[0] * 60 + parts[1];
}

/**
 * Formats minutes from midnight to 12h Arabic time string
 */
export function formatMinutesTo12h(minutes: number): string {
  const norm = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  const isPm = h >= 12;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const mStr = m < 10 ? `0${m}` : `${m}`;
  return `${h12}:${mStr} ${isPm ? 'مساءً' : 'صباحاً'}`;
}

/**
 * Checks for schedule conflicts between two commitments:
 * Returns conflict details if their time windows overlap on ANY common day.
 */
export function checkCommitmentConflict(
  c1: MonthlyCommitment,
  c2: MonthlyCommitment
): { hasConflict: boolean; conflictingDay?: string; overlapDetail?: string } {
  if (c1.id === c2.id || !c1.isActive || !c2.isActive) {
    return { hasConflict: false };
  }

  // Find common days
  const commonDays = c1.days.filter((d) => c2.days.includes(d));
  if (commonDays.length === 0) {
    return { hasConflict: false };
  }

  const windowsC1: [number, number][] = [
    [parseTimeToMinutes(c1.pickupTime), parseTimeToMinutes(c1.pickupTime) + c1.durationMinutes],
  ];
  if (c1.returnPickupTime) {
    windowsC1.push([
      parseTimeToMinutes(c1.returnPickupTime),
      parseTimeToMinutes(c1.returnPickupTime) + c1.durationMinutes,
    ]);
  }

  const windowsC2: [number, number][] = [
    [parseTimeToMinutes(c2.pickupTime), parseTimeToMinutes(c2.pickupTime) + c2.durationMinutes],
  ];
  if (c2.returnPickupTime) {
    windowsC2.push([
      parseTimeToMinutes(c2.returnPickupTime),
      parseTimeToMinutes(c2.returnPickupTime) + c2.durationMinutes,
    ]);
  }

  for (const [s1, e1] of windowsC1) {
    for (const [s2, e2] of windowsC2) {
      // Buffer of 15 minutes between commitments
      const buffer = 15;
      const isOverlap = (s1 - buffer < e2) && (e1 + buffer > s2);
      if (isOverlap) {
        const dayLabel = DAYS_OF_WEEK_MAP.find((d) => d.id === commonDays[0])?.name || commonDays[0];
        return {
          hasConflict: true,
          conflictingDay: dayLabel,
          overlapDetail: `تعارض زمني بين «${c1.title}» (${formatMinutesTo12h(s1)}) و «${c2.title}» (${formatMinutesTo12h(s2)}) في يوم ${dayLabel}`,
        };
      }
    }
  }

  return { hasConflict: false };
}

export interface OrderCommitmentConflictResult {
  hasConflict: boolean;
  commitment?: MonthlyCommitment;
  scheduledTimeStr?: string;
  minutesUntilPickup?: number;
  warningMessage?: string;
}

/**
 * Checks if accepting a current new order conflicts with an upcoming monthly commitment today!
 * (يعطي تحذير اذا قبلت طلب في وقت التوصيل الشهري بأن لديك توصيل شهري لا تنساه)
 */
export function checkOrderConflictWithCommitments(
  commitments: MonthlyCommitment[],
  estimatedOrderDurationMinutes = 40,
  referenceDate = new Date()
): OrderCommitmentConflictResult {
  const currentDayIndex = referenceDate.getDay(); // 0 is Sun, 6 is Sat
  const dayId = DAYS_OF_WEEK_MAP.find((d) => d.dayIndex === currentDayIndex)?.id;
  if (!dayId) return { hasConflict: false };

  const currentMinutes = referenceDate.getHours() * 60 + referenceDate.getMinutes();

  for (const c of commitments) {
    if (!c.isActive) continue;
    if (!c.days.includes(dayId)) continue;

    // Check primary pickup window
    const pMinutes = parseTimeToMinutes(c.pickupTime);
    // If order takes e.g. 40 mins, order window is [currentMinutes, currentMinutes + estimatedOrderDurationMinutes]
    // Commitment starts at pMinutes, ends at pMinutes + durationMinutes
    const orderEnd = currentMinutes + estimatedOrderDurationMinutes;
    const commitStart = pMinutes;
    const commitEnd = pMinutes + c.durationMinutes;

    // Conflict exists if order overlaps with commitment or commitment is within the next 45 minutes
    const isOverlapping = (currentMinutes <= commitEnd) && (orderEnd >= commitStart - 10);
    const isVerySoon = (commitStart >= currentMinutes) && (commitStart - currentMinutes <= 50);

    if (isOverlapping || isVerySoon) {
      const minutesUntil = commitStart - currentMinutes;
      const timeStr = formatMinutesTo12h(commitStart);
      const diffDesc = minutesUntil > 0 ? `خلال ${minutesUntil} دقيقة (${timeStr})` : `حان وقته الآن (${timeStr})`;

      return {
        hasConflict: true,
        commitment: c,
        scheduledTimeStr: timeStr,
        minutesUntilPickup: minutesUntil,
        warningMessage: `⚠️ تنبيه هام: لديك ارتباط توصيل شهري («${c.title}») موعده ${diffDesc} من ${c.fromArea} إلى ${c.toArea}! لا تنسَ موعدك الشهري ⏰`,
      };
    }

    // Check return pickup window if present
    if (c.returnPickupTime) {
      const retMinutes = parseTimeToMinutes(c.returnPickupTime);
      const retStart = retMinutes;
      const retEnd = retMinutes + c.durationMinutes;
      const isRetOverlapping = (currentMinutes <= retEnd) && (orderEnd >= retStart - 10);
      const isRetVerySoon = (retStart >= currentMinutes) && (retStart - currentMinutes <= 50);

      if (isRetOverlapping || isRetVerySoon) {
        const minutesUntil = retStart - currentMinutes;
        const timeStr = formatMinutesTo12h(retStart);
        const diffDesc = minutesUntil > 0 ? `خلال ${minutesUntil} دقيقة (${timeStr})` : `حان وقته الآن (${timeStr})`;

        return {
          hasConflict: true,
          commitment: c,
          scheduledTimeStr: timeStr,
          minutesUntilPickup: minutesUntil,
          warningMessage: `⚠️ تنبيه عودة: لديك توصيل شهري رجوع («${c.title}») موعده ${diffDesc} من ${c.toArea} إلى ${c.fromArea}! لا تنسَ موعدك الشهري ⏰`,
        };
      }
    }
  }

  return { hasConflict: false };
}

/**
 * Gets the next upcoming commitment today or tomorrow for live reminder badge
 */
export function getNextUpcomingCommitment(
  commitments: MonthlyCommitment[],
  referenceDate = new Date()
): { commitment: MonthlyCommitment; pickupTime12h: string; isToday: boolean; minutesUntil: number } | null {
  const currentDayIndex = referenceDate.getDay();
  const dayId = DAYS_OF_WEEK_MAP.find((d) => d.dayIndex === currentDayIndex)?.id;
  const currentMinutes = referenceDate.getHours() * 60 + referenceDate.getMinutes();

  let closest: { commitment: MonthlyCommitment; pickupTime12h: string; isToday: boolean; minutesUntil: number } | null = null;

  for (const c of commitments) {
    if (!c.isActive) continue;
    if (dayId && c.days.includes(dayId)) {
      const pMin = parseTimeToMinutes(c.pickupTime);
      if (pMin >= currentMinutes) {
        const diff = pMin - currentMinutes;
        if (!closest || diff < closest.minutesUntil) {
          closest = {
            commitment: c,
            pickupTime12h: formatMinutesTo12h(pMin),
            isToday: true,
            minutesUntil: diff,
          };
        }
      }
      if (c.returnPickupTime) {
        const rMin = parseTimeToMinutes(c.returnPickupTime);
        if (rMin >= currentMinutes) {
          const diff = rMin - currentMinutes;
          if (!closest || diff < closest.minutesUntil) {
            closest = {
              commitment: c,
              pickupTime12h: formatMinutesTo12h(rMin),
              isToday: true,
              minutesUntil: diff,
            };
          }
        }
      }
    }
  }

  return closest;
}
