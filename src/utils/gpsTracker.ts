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
  // Android/iOS APK: ALWAYS use the native Capacitor GPS API.
  // Do not fall back to navigator.geolocation inside the WebView.
  if (Capacitor.isNativePlatform()) {
    try {
      const perm = await Geolocation.checkPermissions();

      if (perm.location !== 'granted') {
        const req = await Geolocation.requestPermissions();

        if (req.location !== 'granted') {
          return {
            success: false,
            errorMessage:
              'تم رفض إذن الموقع. افتح إعدادات الهاتف > التطبيقات > Orderi > الأذونات > الموقع، ثم اختر السماح أثناء استخدام التطبيق.',
            isPermissionDenied: true,
          };
        }
      }

      try {
        const pos = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 15000,
        });

        return processCoords(
          pos.coords.latitude,
          pos.coords.longitude,
          pos.coords.accuracy,
          pos.coords.speed,
          pos.coords.heading
        );
      } catch (highAccuracyError) {
        console.warn('Orderi high accuracy GPS failed:', highAccuracyError);

        // Network/cell assisted location through the native Android API.
        try {
          const pos = await Geolocation.getCurrentPosition({
            enableHighAccuracy: false,
            timeout: 15000,
            maximumAge: 120000,
          });

          return processCoords(
            pos.coords.latitude,
            pos.coords.longitude,
            pos.coords.accuracy,
            pos.coords.speed,
            pos.coords.heading
          );
        } catch (fallbackError: any) {
          console.warn('Orderi native GPS fallback failed:', fallbackError);

          return {
            success: false,
            errorMessage:
              'تعذر تحديد موقعك حالياً. تأكد من تشغيل "الموقع" في الهاتف ومن منح Orderi صلاحية الموقع، ثم حاول مرة أخرى.',
            isPermissionDenied:
              String(fallbackError?.message || '').toLowerCase().includes('permission'),
          };
        }
      }
    } catch (err: any) {
      console.error('Orderi native geolocation error:', err);

      return {
        success: false,
        errorMessage:
          'تعذر الوصول إلى خدمة الموقع في الهاتف. تأكد من تشغيل GPS ومنح Orderi إذن الموقع.',
        isPermissionDenied: false,
      };
    }
  }

  // Browser/PWA only. This branch is never used by the native APK.
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return {
      success: false,
      errorMessage: 'خدمة تحديد الموقع غير متوفرة.',
    };
  }

  return new Promise<GpsResult>((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve(
          processCoords(
            pos.coords.latitude,
            pos.coords.longitude,
            pos.coords.accuracy,
            pos.coords.speed,
            pos.coords.heading
          )
        );
      },
      (err) => {
        resolve({
          success: false,
          errorMessage:
            err.code === 1
              ? 'تم رفض إذن الموقع.'
              : 'تعذر تحديد الموقع.',
          isPermissionDenied: err.code === 1,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
      }
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

    this.isActive = true;

    try {
      // Native Android/iOS watcher inside the APK.
      if (Capacitor.isNativePlatform()) {
        Geolocation.watchPosition(
          {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 5000,
          },
          (position, err) => {
            if (!this.isActive) return;

            if (err || !position) {
              console.warn('Orderi native GPS watcher:', err);
              if (err?.message?.toLowerCase().includes('permission')) {
                callbacks.onError?.('تم إيقاف صلاحية تتبع الموقع');
              }
              return;
            }

            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const speedKmh =
              position.coords.speed && position.coords.speed > 0
                ? Math.round(position.coords.speed * 3.6)
                : 0;

            callbacks.onSpeedUpdate?.(speedKmh);

            let shouldUpdate = false;
            if (this.lastLat === null || this.lastLon === null) {
              shouldUpdate = true;
            } else {
              const distanceMoved = calculateDistanceKm(
                this.lastLat,
                this.lastLon,
                lat,
                lon
              );
              if (
                distanceMoved >= 0.2 ||
                (speedKmh > 15 && distanceMoved >= 0.15)
              ) {
                shouldUpdate = true;
              }
            }

            const nearest = findNearestArea(lat, lon);
            const isAreaChanged =
              this.lastAreaName !== null &&
              this.lastAreaName !== nearest.area.name;

            if (shouldUpdate || isAreaChanged) {
              this.lastLat = lat;
              this.lastLon = lon;
              this.lastAreaName = nearest.area.name;

              callbacks.onLocationChange(
                {
                  latitude: lat,
                  longitude: lon,
                  areaName: nearest.area.name,
                  speedKmh,
                  heading: position.coords.heading || undefined,
                  accuracyMeters: position.coords.accuracy
                    ? Math.round(position.coords.accuracy)
                    : undefined,
                  lastUpdated: new Date().toLocaleTimeString('ar-BH', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  }),
                },
                isAreaChanged
              );
            }
          }
        ).then((id) => {
          if (this.isActive) this.watchId = id;
        });

        return true;
      }

      // Browser/PWA watcher only.
      if (typeof window === 'undefined' || !navigator.geolocation) {
        callbacks.onError?.('خدمة تحديد الموقع غير متوفرة');
        this.isActive = false;
        return false;
      }

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
      if (Capacitor.isNativePlatform()) {
        Geolocation.clearWatch({ id: String(this.watchId) }).catch(() => {});
      } else if (typeof this.watchId === 'number') {
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
