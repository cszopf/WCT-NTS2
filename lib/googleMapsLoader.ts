
import { getPublicConfig } from './publicEnv';

/**
 * Singleton state for Google Maps loader
 */
let mapsPromise: Promise<void> | null = null;
let mapsStatus: 'idle' | 'loading' | 'ready' | 'error' = 'idle';
let lastError: string | null = null;

/**
 * Returns the current loader status and last error
 */
export function getMapsStatus() {
  return { mapsStatus, lastError };
}

/**
 * Idempotent loader for Google Maps Places library.
 * It will wait for the global script (injected by App.tsx) to be ready.
 */
export async function loadGoogleMapsPlaces(): Promise<void> {
  // 1. If already ready, resolve immediately
  if (typeof window !== 'undefined' && (window as any).google?.maps?.places) {
    mapsStatus = 'ready';
    return Promise.resolve();
  }

  // 2. If already loading, return existing promise
  if (mapsPromise) {
    return mapsPromise;
  }

  // 3. Start loading process
  console.debug("Maps loader: start");
  mapsStatus = 'loading';

  mapsPromise = new Promise(async (resolve, reject) => {
    try {
      // Wait for configuration to be fetched
      const config = await getPublicConfig();
      const key = config.googleMapsKey || (window as any).__GOOGLE_MAPS_KEY;

      if (!key || key.length < 10) {
        lastError = "Google Maps API Key missing. Please check your Vercel environment variables.";
        mapsStatus = 'error';
        console.error("Maps loader error:", lastError);
        return reject(new Error(lastError));
      }

      // Check for existing script tag or wait for it
      const scriptId = 'google-maps-js';
      let script = document.getElementById(scriptId) as HTMLScriptElement;

      if (!script) {
        // Fallback injection if the root component didn't handle it
        script = document.createElement('script');
        script.id = scriptId;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&v=weekly`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }

      // Set global auth failure hook
      (window as any).gm_authFailure = () => {
        lastError = "Google Maps authentication failure. This is often due to 'RefererNotAllowedMapError'. Please ensure your API key allows referrers from this domain in the Google Cloud Console.";
        mapsStatus = 'error';
      };

      const timeoutId = setTimeout(() => {
        if (mapsStatus !== 'ready') {
          lastError = "Maps load timeout (15s)";
          mapsStatus = 'error';
          reject(new Error(lastError));
        }
      }, 15000);

      const checkAvailability = setInterval(() => {
        if ((window as any).google?.maps?.places) {
          clearTimeout(timeoutId);
          clearInterval(checkAvailability);
          mapsStatus = 'ready';
          console.debug("Maps loader: ready");
          resolve();
        }
      }, 100);

      script.addEventListener('error', () => {
        clearTimeout(timeoutId);
        clearInterval(checkAvailability);
        lastError = "Failed to load Google Maps script file";
        mapsStatus = 'error';
        reject(new Error(lastError));
      });
    } catch (err: any) {
      lastError = err.message || "Unknown error during initialization";
      mapsStatus = 'error';
      reject(new Error(lastError));
    }
  });

  return mapsPromise;
}
