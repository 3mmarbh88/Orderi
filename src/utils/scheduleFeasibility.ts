import { calculateDistanceKm, findAreaByName } from '../data/bahrainAreas';
import { findLandmarkByName } from '../data/bahrainLandmarks';
import type { MatcherLocation } from './matcher';

export interface ScheduleFeasibility {
  status: 'not_scheduled' | 'feasible' | 'late' | 'ambiguous' | 'unknown_location';
  eligible: boolean;
  resolvedTimeMinutes?: number;
  etaMinutes?: number;
  minutesUntilPickup?: number;
  reason: string;
}

function parseExplicitPeriod(text: string): 'am' | 'pm' | null {
  if (/(صباح|الصبح|الصباح|(?:^|\s)ص(?=\s|$))/i.test(text)) return 'am';
  if (/(مساء|المساء|العصر|الظهر|المغرب|بالليل|في الليل|ليل|(?:^|\s)م(?=\s|$))/i.test(text)) return 'pm';
  return null;
}

function getRawHourAndMinute(text: string, scheduledTimeMinutes?: number): { hour: number; minute: number } | null {
  const converted = text.replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
  const clock = /(?:^|[^\d])(\d{1,2})\s*:\s*(\d{1,2})(?!\d)/.exec(converted);
  if (clock) {
    const left = Number(clock[1]);
    const right = Number(clock[2]);
    if ([0, 15, 30, 45].includes(left) && right >= 1 && right <= 12) return { hour: right, minute: left };
    if (left <= 23 && right <= 59) return { hour: left, minute: right };
  }

  // Explicit schedule keywords like: الساعة 3, موعد 5, توقيت 4
  // Ensure not followed by prices (e.g. 2 دينار, 2.5 د.ب) or quantities (e.g. 2 وجبات, 3 كراتين)
  const explicitClock = /(?:الساعة|ساعة|على الساعة|في حدود الساعة|توقيت|موعد|وقت)\s*(\d{1,2})(?!\s*[:：])(?!\s*(?:دينار|د\.ب|دنانير|فلس|bd|bhd|دب|طلب|طلبات|كرتون|كراتين|وجبة|وجبات|طرد|طرود|حبة|حبات|أكياس|اكياس|أغراض|اغراض|كيلو|كم|[.,٫]\d))/i.exec(converted);
  if (explicitClock) {
    const h = Number(explicitClock[1]);
    if (h >= 1 && h <= 24) return { hour: h, minute: 0 };
  }

  // Delivery / pickup words only if explicitly paired with time keywords or am/pm dayparts
  const pickupTime = /(?:استلام|تسليم|توصيل)\s+(?:الساعة|ساعة|في حدود|على)\s*(\d{1,2})(?!\s*[:：])/i.exec(converted);
  if (pickupTime) {
    const h = Number(pickupTime[1]);
    if (h >= 1 && h <= 24) return { hour: h, minute: 0 };
  }

  const pickupDaypart = /(?:استلام|تسليم|توصيل)\s*(\d{1,2})\s*(?:صباحاً|صباحا|الصبح|الصباح|مساءً|مساء|المساء|الظهر|العصر|المغرب|بالليل|في الليل|ليل|ص|م)\b/i.exec(converted);
  if (pickupDaypart) {
    const h = Number(pickupDaypart[1]);
    if (h >= 1 && h <= 12) return { hour: h, minute: 0 };
  }

  if (typeof scheduledTimeMinutes === 'number' && Number.isFinite(scheduledTimeMinutes)) {
    return { hour: Math.floor(scheduledTimeMinutes / 60), minute: scheduledTimeMinutes % 60 };
  }
  return null;
}

/**
 * Resolves an ambiguous 12-hour clock using the post timestamp and current local time.
 * For unlabelled times, chooses the next plausible occurrence after the post; it never
 * silently treats an already-missed appointment as a new future appointment.
 */
export function resolveAdSchedule(
  rawText: string,
  scheduledTimeMinutes: number | undefined,
  postedAt: Date | string | undefined,
  now: Date = new Date()
): { minutes: number; date: Date; ambiguous: boolean } | null {
  const raw = getRawHourAndMinute(rawText, scheduledTimeMinutes);
  if (!raw || raw.hour < 0 || raw.hour > 24 || raw.minute < 0 || raw.minute > 59) return null;
  const postDate = postedAt ? (postedAt instanceof Date ? new Date(postedAt.getTime()) : new Date(postedAt)) : now;
  const reference = Number.isNaN(postDate.getTime()) ? now : postDate;
  const explicit = parseExplicitPeriod(rawText);
  const hasDaypartWords = /صباح|الصبح|الصباح|مساء|المساء|العصر|الظهر|المغرب|بالليل|في الليل|ليل/i.test(rawText);
  const candidates: Date[] = [];
  const baseHour = raw.hour === 24 ? 0 : raw.hour;

  if (explicit) {
    let hour24 = baseHour % 12;
    if (explicit === 'pm') hour24 += 12;
    if (baseHour === 12 && /مساء|المساء|بالليل|في الليل|ليل/i.test(rawText) && !/الظهر/i.test(rawText)) hour24 = 0;
    if (baseHour === 12 && /الظهر/i.test(rawText)) hour24 = 12;
    const date = new Date(reference.getTime());
    date.setHours(hour24, raw.minute, 0, 0);
    if (date.getTime() < reference.getTime() - 60_000) date.setDate(date.getDate() + 1);
    candidates.push(date);
  } else if (baseHour > 12) {
    const date = new Date(reference.getTime());
    date.setHours(baseHour, raw.minute, 0, 0);
    if (date.getTime() < reference.getTime() - 60_000) date.setDate(date.getDate() + 1);
    candidates.push(date);
  } else {
    const hours = baseHour === 12 ? [12, 0] : [baseHour, baseHour + 12];
    for (const hour of hours) {
      const date = new Date(reference.getTime());
      date.setHours(hour, raw.minute, 0, 0);
      if (date.getTime() < reference.getTime() - 60_000) date.setDate(date.getDate() + 1);
      candidates.push(date);
    }
  }

  candidates.sort((a, b) => a.getTime() - b.getTime());
  if (!candidates.length) return null;
  // Prefer the closest future candidate. At exactly 12, the post/current context decides noon vs midnight.
  const chosen = candidates[0];
  const minutes = chosen.getHours() * 60 + chosen.getMinutes();
  const ambiguous = !explicit && baseHour <= 12 && !hasDaypartWords;
  return { minutes, date: chosen, ambiguous };
}

/**
 * Dynamic pickup ETA: route distance from current GPS to pickup, urban driving estimate,
 * and a small preparation/parking buffer. If location is unavailable, return review state.
 */
export function evaluateScheduleFeasibility(args: {
  rawText: string;
  scheduledTimeMinutes?: number;
  postedAt?: Date | string;
  driverLocation: MatcherLocation | null;
  pickupAreaName?: string;
  now?: Date;
}): ScheduleFeasibility {
  const now = args.now || new Date();
  const resolved = resolveAdSchedule(args.rawText, args.scheduledTimeMinutes, args.postedAt, now);
  if (!resolved) {
    return { status: 'not_scheduled', eligible: true, reason: 'لا يوجد موعد صريح يحتاج إلى حساب الوصول' };
  }

  const minutesUntilPickup = Math.floor((resolved.date.getTime() - now.getTime()) / 60_000);
  if (minutesUntilPickup < 0) {
    return {
      status: 'late',
      eligible: false,
      resolvedTimeMinutes: resolved.minutes,
      minutesUntilPickup,
      reason: 'موعد الاستلام فات بالفعل',
    };
  }

  if (!args.driverLocation) {
    return {
      status: 'unknown_location',
      eligible: true,
      resolvedTimeMinutes: resolved.minutes,
      minutesUntilPickup,
      reason: 'موعد مجدول (في انتظار تحديد موقع السائق بالـ GPS لحساب وقت الوصول بدقة)',
    };
  }

  const fromMatch = /(?:من|استلام من|بيك اب من|بال)\s*([^،,\n]+)/i.exec(args.rawText);
  const fromText = fromMatch?.[1]?.split(/(?:الى|إلى|لـ|لل)/i)[0]?.trim() || '';
  const pickupName = args.pickupAreaName || fromText;
  const pickup = findAreaByName(pickupName) || findAreaByName(fromText) || findAreaByName(args.rawText);
  const landmark = findLandmarkByName(pickupName) || findLandmarkByName(fromText) || findLandmarkByName(args.rawText);
  const pickupArea = pickup || (landmark ? findAreaByName(landmark.parentAreaName) : null);

  if (!pickupArea) {
    return {
      status: 'ambiguous',
      eligible: true,
      resolvedTimeMinutes: resolved.minutes,
      minutesUntilPickup,
      reason: 'موعد مجدول (بانتظار تأكيد إحداثيات منطقة الاستلام بدقة لحساب وقت الوصول)',
    };
  }

  const distanceKm = calculateDistanceKm(
    args.driverLocation.latitude,
    args.driverLocation.longitude,
    pickupArea.latitude,
    pickupArea.longitude
  );
  // Conservative city estimate: 25 km/h average + 5 minutes for parking/access.
  const etaMinutes = Math.max(3, Math.ceil((distanceKm / 25) * 60) + 5);
  const eligible = minutesUntilPickup >= etaMinutes;
  return {
    status: eligible ? 'feasible' : 'late',
    eligible,
    resolvedTimeMinutes: resolved.minutes,
    etaMinutes,
    minutesUntilPickup,
    reason: eligible
      ? `الوصول التقديري خلال ${etaMinutes} دقيقة، والمتبقي ${minutesUntilPickup} دقيقة`
      : `الوقت المتبقي ${minutesUntilPickup} دقيقة أقل من زمن الوصول التقديري ${etaMinutes} دقيقة`,
  };
}
