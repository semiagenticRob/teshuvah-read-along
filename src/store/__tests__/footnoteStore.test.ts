import { footnoteKey, useFootnoteStore } from '../footnoteStore';

describe('footnoteKey', () => {
  it('builds a key with prayerId, lineIndex, wordIndex', () => {
    expect(footnoteKey('modeh_ani', 0, 2)).toBe('modeh_ani:0:2');
  });

  it('substitutes "line" when wordIndex is omitted', () => {
    expect(footnoteKey('modeh_ani', 1)).toBe('modeh_ani:1:line');
  });
});

describe('useFootnoteStore', () => {
  beforeEach(() => {
    useFootnoteStore.setState({ openKey: null });
  });

  it('opens a key', () => {
    useFootnoteStore.getState().open('a:0:0');
    expect(useFootnoteStore.getState().openKey).toBe('a:0:0');
  });

  it('closes', () => {
    useFootnoteStore.getState().open('a:0:0');
    useFootnoteStore.getState().close();
    expect(useFootnoteStore.getState().openKey).toBeNull();
  });

  it('toggle on a closed key opens it', () => {
    useFootnoteStore.getState().toggle('a:0:0');
    expect(useFootnoteStore.getState().openKey).toBe('a:0:0');
  });

  it('toggle on the same open key closes it', () => {
    useFootnoteStore.getState().open('a:0:0');
    useFootnoteStore.getState().toggle('a:0:0');
    expect(useFootnoteStore.getState().openKey).toBeNull();
  });

  it('toggle on a different key swaps to it', () => {
    useFootnoteStore.getState().open('a:0:0');
    useFootnoteStore.getState().toggle('b:1:2');
    expect(useFootnoteStore.getState().openKey).toBe('b:1:2');
  });
});
