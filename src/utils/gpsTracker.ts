import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { findNearestArea, calculateDistanceKm } from '../data/bahrainAreas';
import { MatcherLocation } from './matcher';
import { AreaLocation } from '../types';

export interface GpsResult {
  success: boolean;
  location?: MatcherLocation;
  nearestArea?: AreaLocation;
  distanceKm?: number;
  errorMessage?: string;
  isPermissionDenied?: boolean;
}

export interface VehicleTrackingCallbacks {
  onLocationChange: (loc: MatcherLocation, isAreaChanged: boolean) => void;
  onError?: (msg: string) => void;
  onSpeedUpdate?: (speedKmh: number) => void;
}

/**
 * Fetch current GPS location with multi-tiered fallback:
 * 1. Native Capacitor Geolocation (on Android APK)
 * 2. High-Accuracy Web GPS (Satellites)
 * 3. Standard-Accuracy Fallback (WiFi / Cellular networks)
 */
export async function getDetailedCurrentPosition(): Promise<GpsResult> {
  const isNative = Capacitor.isNativePlatform();

  // 1. Native Capacitor Android Platform
  if (isNative) {
    try {
      const perm = await Geolocation.checkPermissions();
      if (perm.location !== 'granted') {
        const req = await Geolocation.requestPermissions();
        if (req.location !== 'granted') {
          return {
            success: false,
            errorMessage: 'تم رفض إذن الوصول للموقع في إعدادات الهاتف. يرجى تفعيل الموقع لتطبيق Ordari.',
            isPermissionDenied: true,
          };
        }
      }

      // Try High Accuracy
      try {
        const pos = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 30000,
        });
        return processCoords(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy, pos.coords.speed, pos.coords.heading);
      } catch {
        // Fallback to low accuracy / network
        const posFallback = await Geolocation.getCurrentPosition({
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 180000,
        });
        return processCoords(posFallback.coords.latitude, posFallback.coords.longitude, posFallback.coords.accuracy, posFallback.coords.speed, posFallback.coords.heading);
      }
    } catch (err: any) {
      console.warn('Capacitor native geolocation error:', err);
    }
  }

  // 2. Web Browser & PWA Environment
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return {
      success: false,
      errorMessage: 'خدمة تحديد الموقع GPS غير مدعومة في جهازك أو متصفحك.',
    };
  }

  return new Promise<GpsResult>((resolve) => {
    // Attempt 1: High Accuracy GPS (10 seconds timeout)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve(processCoords(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy, pos.coords.speed, pos.coords.heading));
      },
      (err1) => {
        // If permission explicitly denied, do not retry
        if (err1.code === 1) {
          resolve({
            success: false,
            errorMessage: 'تم رفض إذن تحديد الموقع. يرجى السماح للمتصفح بالوصول للموقع عبر شريط العنوان بالأعلى.',
            isPermissionDenied: true,
          });
          return;
        }

        // Attempt 2: Immediate fallback to Network / WiFi / Cell-Tower Geolocation (almost always works indoor/car)
        navigator.geolocation.getCurrentPosition(
          (posFallback) => {
            resolve(processCoords(posFallback.coords.latitude, posFallback.coords.longitude, posFallback.coords.accuracy, posFallback.coords.speed, posFallback.coords.heading));
          },
          (err2) => {
            let msg = 'تعذر التقاط إشارة GPS. تأكد من تشغيل زر الموقع (Location) في هاتفك أو حدد منطقتك يدوياً.';
            if (err2.code === 1) {
              msg = 'تم رفض إذن الوصول لموقعك الحالي.';
            } else if (err2.code === 3) {
              msg = 'استغرق التقاط إشارة GPS وقتاً طويلاً. يمكنك اختيار منطقتك في البحرين يدوياً بنقرة واحدة.';
            }
            resolve({
              success: false,
              errorMessage: msg,
              isPermissionDenied: err2.code === 1,
            });
          },
          { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 }
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  });
}

function processCoords(
  latitude: number, 
  longitude: number, 
  accuracy?: number | null, 
  speed?: number | null, 
  heading?: number | null
): GpsResult {
  const nearest = findNearestArea(latitude, longitude);
  const speedKmh = speed && speed > 0 ? Math.round(speed * 3.6) : 0;
  
  const location: MatcherLocation = {
    latitude,
    longitude,
    areaName: nearest.area.name,
    accuracyMeters: accuracy ? Math.round(accuracy) : undefined,
    speedKmh,
    heading: heading || undefined,
    lastUpdated: new Date().toLocaleTimeString('ar-BH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };

  return {
    success: true,
    location,
    nearestArea: nearest.area,
    distanceKm: Math.round(nearest.distanceKm * 10) / 10,
  };
}

/**
 * Live Continuous Vehicle Tracking Watcher
 * Continuously tracks car movements and updates the driver's location & closest area in Bahrain.
 */
export class VehicleLiveTracker {
  private watchId: number | string | null = null;
  private lastLat: number | null = null;
  private lastLon: number | null = null;
  private lastAreaName: string | null = null;
  private isActive: boolean = false;

  public start(callbacks: VehicleTrackingCallbacks): boolean {
    if (this.isActive) {
      this.stop();
    }

    if (typeof window === 'undefined' || !navigator.geolocation) {
      callbacks.onError?.('خدمة تحديد الموقع GPS غير متوفرة في هذا الجهاز');
      return false;
    }

    this.isActive = true;

    try {
      this.watchId = navigator.geolocation.watchPosition(
        (pos) => {
          if (!this.isActive) return;

          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const speedKmh = pos.coords.speed && pos.coords.speed > 0 ? Math.round(pos.coords.speed * 3.6) : 0;

          if (callbacks.onSpeedUpdate) {
            callbacks.onSpeedUpdate(speedKmh);
          }

          // Check distance moved from last known point
          let shouldUpdate = false;
          if (this.lastLat === null || this.lastLon === null) {
            shouldUpdate = true;
          } else {
            const distanceMoved = calculateDistanceKm(this.lastLat, this.lastLon, lat, lon);
            // Update if vehicle moved more than 200 meters or moving at speed
            if (distanceMoved >= 0.2 || (speedKmh > 15 && distanceMoved >= 0.15)) {
              shouldUpdate = true;
            }
          }

          const nearest = findNearestArea(lat, lon);
          const isAreaChanged = this.lastAreaName !== null && this.lastAreaName !== nearest.area.name;

          if (shouldUpdate || isAreaChanged) {
            this.lastLat = lat;
            this.lastLon = lon;
            this.lastAreaName = nearest.area.name;

            const loc: MatcherLocation = {
              latitude: lat,
              longitude: lon,
              areaName: nearest.area.name,
              speedKmh,
              heading: pos.coords.heading || undefined,
              accuracyMeters: pos.coords.accuracy ? Math.round(pos.coords.accuracy) : undefined,
              lastUpdated: new Date().toLocaleTimeString('ar-BH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            };

            callbacks.onLocationChange(loc, isAreaChanged);
          }
        },
        (err) => {
          console.warn('Car GPS Watcher notice:', err);
          if (err.code === 1) {
            callbacks.onError?.('تم إيقاف صلاحية تتبع الموقع');
            this.stop();
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: 4000,
          timeout: 20000,
        }
      );

      return true;
    } catch (e: any) {
      console.error('Failed to initiate live car tracking:', e);
      callbacks.onError?.('تعذر بدء التتبع الحي لموقع السيارة');
      return false;
    }
  }

  public stop(): void {
    if (this.watchId !== null) {
      if (typeof this.watchId === 'number') {
        navigator.geolocation.clearWatch(this.watchId);
      }
      this.watchId = null;
    }
    this.isActive = false;
    this.lastLat = null;
    this.lastLon = null;
    this.lastAreaName = null;
  }

  public getStatus(): boolean {
    return this.isActive;
  }
}

export const globalVehicleTracker = new VehicleLiveTracker();
