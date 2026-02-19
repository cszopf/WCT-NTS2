
/**
 * Runtime public environment configuration.
 * In this environment, we read directly from process.env.
 */

interface PublicConfig {
  googleMapsKey: string | null;
}

let cachedConfig: PublicConfig | null = null;

export async function getPublicConfig(): Promise<PublicConfig> {
  if (cachedConfig) return cachedConfig;

  // In this platform, environment variables are available on process.env
  // We check for several common naming conventions.
  const key = (process.env as any).NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || null;

  cachedConfig = { googleMapsKey: key };
  return cachedConfig;
}

/**
 * Synchronous check for key presence. 
 */
export const hasGoogleMapsKeySync = () => {
  const key = (process.env as any).NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  return !!key && key.length > 10;
};

export const getGoogleMapsKeySync = () => {
  return (process.env as any).NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
};
