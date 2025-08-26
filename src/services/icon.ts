// src/services/icon.ts
import { apiFetch } from '@/services/apiFetch';
import qs from 'qs';

import { getCachedIcon, setCachedIcon } from '@/services/iconCache';
interface ListIconsParams {
  prefix?: string;
  sort?: 'prefix' | 'name';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export async function listIcons(params: ListIconsParams) {
  const query = qs.stringify(params, { addQueryPrefix: true });
  return await apiFetch(`/icon/list${query}`);
}

export async function getIconNameSvg(icon: string): Promise<string> {
  const [prefix, name] = icon.split(':');
  const cacheKey = `${prefix}:${name}`;

  // Try cache first
  const cached = getCachedIcon(cacheKey);
  if (cached) return cached;

  const endpoint = `/api/icon/${prefix}/${name}`;
  const fetchSvg = async () => {
    const svg = await apiFetch<string>(endpoint, {
      method: 'GET',
      responseType: 'text',
      headers: {
        Accept: 'image/svg+xml',
      },
    });
    setCachedIcon(cacheKey, svg);
    return svg;
  };

  try {
    return await fetchSvg();
  } catch (error: any) {
    if (error.status === 404) {
      try {
        await downloadIcons([`${prefix}:${name}`]);
        return await fetchSvg();
      } catch {
        throw new Error(`Failed to download and retrieve icon "${icon}"`);
      }
    }
    throw error;
  }
}

export async function getIconSvg(
  prefix: string,
  name: string,
): Promise<string> {
  return await apiFetch<string>(`/api/icon/${prefix}/${name}`, {
    method: 'GET',
    responseType: 'text',
    headers: {
      Accept: 'image/svg+xml',
    },
  });
}

export async function downloadIcons(names: string[]) {
  const query = qs.stringify(
    { name: names },
    { arrayFormat: 'repeat', addQueryPrefix: true },
  );
  return await apiFetch(`/api/icon/download${query}`);
}
