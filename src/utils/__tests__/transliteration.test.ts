import { transliterateHebrew, capitalizeTransliteration } from '../transliteration';

describe('transliterateHebrew', () => {
  it('transliterates basic Hebrew words without niqqud', () => {
    // שלום = shin-lamed-vav-mem(final)
    const result = transliterateHebrew('שלום');
    expect(result).toBe('shlvm');
  });

  it('transliterates Modeh Ani prayer opening', () => {
    // מודה אני - basic consonants
    const result = transliterateHebrew('מודה אני');
    expect(result).toContain('m');
    expect(result).toContain('n');
  });

  it('handles empty string', () => {
    expect(transliterateHebrew('')).toBe('');
  });

  it('preserves spaces between words', () => {
    const result = transliterateHebrew('ברוך אתה');
    expect(result).toContain(' ');
  });

  it('handles shin vs sin with dots', () => {
    // שׁ (shin with right dot) -> 'sh'
    expect(transliterateHebrew('\u05E9\u05C1')).toBe('sh');
    // שׂ (sin with left dot) -> 's'
    expect(transliterateHebrew('\u05E9\u05C2')).toBe('s');
  });

  it('handles bet with and without dagesh', () => {
    // בּ (bet with dagesh) -> 'b'
    expect(transliterateHebrew('\u05D1\u05BC')).toBe('b');
    // ב (vet without dagesh) -> 'v'
    expect(transliterateHebrew('\u05D1')).toBe('v');
  });

  it('handles kaf with and without dagesh', () => {
    // כּ (kaf with dagesh) -> 'k'
    expect(transliterateHebrew('\u05DB\u05BC')).toBe('k');
    // כ (khaf without dagesh) -> 'ch'
    expect(transliterateHebrew('\u05DB')).toBe('ch');
  });

  it('handles pe with and without dagesh', () => {
    // פּ (pe with dagesh) -> 'p'
    expect(transliterateHebrew('\u05E4\u05BC')).toBe('p');
    // פ (fe without dagesh) -> 'f'
    expect(transliterateHebrew('\u05E4')).toBe('f');
  });

  it('handles vav with dagesh as shuruq (u)', () => {
    // וּ (vav with dagesh = shuruq) -> 'u'
    expect(transliterateHebrew('\u05D5\u05BC')).toBe('u');
  });

  it('handles vowel marks', () => {
    // בָּ (bet-dagesh-qamats) -> 'ba'
    const result = transliterateHebrew('\u05D1\u05BC\u05B8');
    expect(result).toBe('ba');
  });

  it('handles final letters', () => {
    // ך (final kaf) -> 'ch'
    expect(transliterateHebrew('\u05DA')).toBe('ch');
    // ם (final mem) -> 'm'
    expect(transliterateHebrew('\u05DD')).toBe('m');
    // ן (final nun) -> 'n'
    expect(transliterateHebrew('\u05DF')).toBe('n');
    // ף (final pe) -> 'f'
    expect(transliterateHebrew('\u05E3')).toBe('f');
    // ץ (final tsadi) -> 'tz'
    expect(transliterateHebrew('\u05E5')).toBe('tz');
  });

  it('passes through punctuation', () => {
    const result = transliterateHebrew('שלום, עולם!');
    expect(result).toContain(',');
    expect(result).toContain('!');
  });
});

describe('capitalizeTransliteration', () => {
  it('capitalizes first letter', () => {
    expect(capitalizeTransliteration('shalom')).toBe('Shalom');
  });

  it('handles empty string', () => {
    expect(capitalizeTransliteration('')).toBe('');
  });
});
