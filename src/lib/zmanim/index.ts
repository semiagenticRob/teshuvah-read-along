import { HebcalZmanimProvider } from './HebcalZmanimProvider';
import { ZmanimProvider } from './types';

export type { DayZmanim, ZmanimProvider, ZmanimQuery } from './types';
export { HebcalZmanimProvider } from './HebcalZmanimProvider';

/**
 * The default provider used by the app. Swap this value to change the
 * zmanim implementation app-wide without touching consumers.
 */
export const defaultZmanimProvider: ZmanimProvider = new HebcalZmanimProvider();
