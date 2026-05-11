import { LocalZmanimProvider } from './LocalZmanimProvider';
import { ZmanimProvider } from './types';

export type { DayZmanim, ZmanimProvider, ZmanimQuery } from './types';
export { LocalZmanimProvider } from './LocalZmanimProvider';

/**
 * The default provider used by the app. Swap this value to change the
 * zmanim implementation app-wide without touching consumers.
 */
export const defaultZmanimProvider: ZmanimProvider = new LocalZmanimProvider();
