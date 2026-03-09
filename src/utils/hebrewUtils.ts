/**
 * Utility functions for handling Hebrew text in a React Native context.
 */

/**
 * Checks if a string contains Hebrew characters.
 */
export function containsHebrew(text: string): boolean {
  return /[\u0590-\u05FF]/.test(text);
}

/**
 * Strips niqqud (vowel marks) from Hebrew text.
 * Useful for comparing text without diacritics.
 */
export function stripNiqqud(text: string): string {
  return text.replace(/[\u05B0-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7]/g, '');
}

/**
 * Strips cantillation marks (ta'amim / trop) from Hebrew text.
 * Sefaria sometimes includes these in biblical passages.
 */
export function stripCantillation(text: string): string {
  return text.replace(/[\u0591-\u05AF]/g, '');
}

/**
 * Cleans Hebrew text for display: strips cantillation but keeps niqqud.
 */
export function cleanHebrewForDisplay(text: string): string {
  return stripCantillation(text).trim();
}

/**
 * Returns the text size multiplier for a given TextSize setting.
 */
export function getTextSizeMultiplier(size: 'small' | 'medium' | 'large' | 'xlarge'): number {
  switch (size) {
    case 'small': return 0.85;
    case 'medium': return 1.0;
    case 'large': return 1.2;
    case 'xlarge': return 1.45;
  }
}

/**
 * Base font sizes used in the app.
 */
export const BASE_FONT_SIZES = {
  hebrewPrimary: 26,
  transliteration: 16,
  english: 15,
  hebrewSmall: 18,
} as const;

/**
 * Returns scaled font sizes based on user's text size preference.
 */
export function getScaledFontSizes(textSize: 'small' | 'medium' | 'large' | 'xlarge') {
  const multiplier = getTextSizeMultiplier(textSize);
  return {
    hebrewPrimary: Math.round(BASE_FONT_SIZES.hebrewPrimary * multiplier),
    transliteration: Math.round(BASE_FONT_SIZES.transliteration * multiplier),
    english: Math.round(BASE_FONT_SIZES.english * multiplier),
  };
}

/**
 * Gets the current day of week for determining variable prayers (Shir Shel Yom, etc.).
 */
export function getDayOfWeek(): 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'shabbat' {
  const day = new Date().getDay();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'shabbat'] as const;
  return days[day];
}
