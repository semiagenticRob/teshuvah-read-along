import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SefariaTextResponse } from '../types';

const SEFARIA_BASE_URL = 'https://www.sefaria.org/api';
const CACHE_PREFIX = '@sefaria_cache_';

/**
 * Fetches prayer text from the Sefaria API.
 * Results are cached in AsyncStorage for offline use.
 *
 * @param ref - Sefaria text reference (e.g., "Siddur Ashkenaz, Weekday, Shacharit, Preparatory Prayers, Modeh Ani")
 * @returns The Hebrew and English text arrays
 */
export async function fetchPrayerText(ref: string): Promise<SefariaTextResponse> {
  const cacheKey = CACHE_PREFIX + ref;

  // Check cache first
  const cached = await AsyncStorage.getItem(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch from Sefaria API
  const encodedRef = encodeURIComponent(ref).replace(/%2C/g, ',').replace(/%20/g, '%20');
  const url = `${SEFARIA_BASE_URL}/texts/${encodedRef}?context=0&pad=0`;

  const response = await axios.get<SefariaTextResponse>(url, {
    timeout: 15000,
    headers: {
      Accept: 'application/json',
    },
  });

  const data: SefariaTextResponse = {
    ref: response.data.ref,
    he: response.data.he,
    text: response.data.text,
    sectionNames: response.data.sectionNames,
    titleVariants: response.data.titleVariants,
    heTitle: response.data.heTitle,
  };

  // Cache the result
  await AsyncStorage.setItem(cacheKey, JSON.stringify(data));

  return data;
}

/**
 * Fetches multiple prayer texts and returns them keyed by reference.
 */
export async function fetchMultiplePrayers(
  refs: string[],
): Promise<Map<string, SefariaTextResponse>> {
  const results = new Map<string, SefariaTextResponse>();

  // Fetch in parallel, but limit concurrency to avoid rate limiting
  const batchSize = 3;
  for (let i = 0; i < refs.length; i += batchSize) {
    const batch = refs.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((ref) => fetchPrayerText(ref).then((data) => ({ ref, data }))),
    );
    for (const { ref, data } of batchResults) {
      results.set(ref, data);
    }
  }

  return results;
}

/**
 * Clears the Sefaria text cache (for manual refresh).
 */
export async function clearCache(): Promise<void> {
  const allKeys = await AsyncStorage.getAllKeys();
  const cacheKeys = allKeys.filter((key) => key.startsWith(CACHE_PREFIX));
  await AsyncStorage.multiRemove(cacheKeys);
}

/**
 * Normalizes Sefaria text response into flat string arrays.
 * Sefaria may return nested arrays for complex texts.
 */
export function flattenTextArray(text: string | string[] | string[][]): string[] {
  if (typeof text === 'string') {
    return [text];
  }
  const result: string[] = [];
  for (const item of text) {
    if (Array.isArray(item)) {
      result.push(...flattenTextArray(item));
    } else {
      result.push(item);
    }
  }
  return result;
}

/**
 * Strips HTML tags from Sefaria text (they sometimes include formatting).
 */
export function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, '').trim();
}
