export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export interface SliceSource {
  id: string;
  url: string;
}

export interface RuntimeConfig {
  apiBaseUrl: string;
  slices?: SliceSource[];
}

export const defaultRuntimeConfig: RuntimeConfig = { apiBaseUrl: 'http://localhost:5179/api' };

function isJsonObject(json: JsonValue | undefined): json is { [key: string]: JsonValue } {
  return typeof json === 'object' && json !== null && !Array.isArray(json);
}

function parseSliceSource(json: JsonValue): SliceSource | undefined {
  if (!isJsonObject(json)) return undefined;
  const { id, url } = json;
  return typeof id === 'string' && id.length > 0 && typeof url === 'string' && url.length > 0 ? { id, url } : undefined;
}

function parseSliceSources(json: JsonValue | undefined): SliceSource[] | undefined {
  if (!Array.isArray(json)) return undefined;
  return json.flatMap((entry) => parseSliceSource(entry) ?? []);
}

export function parseRuntimeConfig(json: JsonValue): RuntimeConfig | undefined {
  if (!isJsonObject(json)) return undefined;
  const { apiBaseUrl } = json;
  if (typeof apiBaseUrl !== 'string' || apiBaseUrl.length === 0) return undefined;
  const slices = parseSliceSources(json.slices);
  return slices ? { apiBaseUrl, slices } : { apiBaseUrl };
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
