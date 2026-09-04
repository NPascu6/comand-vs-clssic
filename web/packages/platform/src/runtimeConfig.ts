// Read at boot from /config.json, which the deployment writes next to index.html, so one build runs anywhere.

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export interface RuntimeConfig {
  apiBaseUrl: string;
}

export const defaultRuntimeConfig: RuntimeConfig = { apiBaseUrl: 'http://localhost:5179/api' };

function parseRuntimeConfig(json: JsonValue): RuntimeConfig | undefined {
  if (typeof json !== 'object' || json === null || Array.isArray(json)) return undefined;
  const { apiBaseUrl } = json;
  return typeof apiBaseUrl === 'string' && apiBaseUrl.length > 0 ? { apiBaseUrl } : undefined;
}

/** A missing, unreadable or malformed file yields the defaults. Never throws. */
export async function loadRuntimeConfig(url = '/config.json'): Promise<RuntimeConfig> {
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) return defaultRuntimeConfig;
    const json: JsonValue = await response.json();
    return parseRuntimeConfig(json) ?? defaultRuntimeConfig;
  } catch {
    return defaultRuntimeConfig;
  }
}
