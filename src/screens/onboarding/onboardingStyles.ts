import { StyleSheet } from 'react-native';
import { FONTS, INK, PARCHMENT, SECTIONS } from '../../theme/shacharitTheme';

export const AMBER = SECTIONS.birchot;

export const onboardingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PARCHMENT,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 72,
    paddingBottom: 32,
  },
  eyebrow: {
    fontFamily: FONTS.serifBody,
    fontSize: 11,
    letterSpacing: 3.0,
    textTransform: 'uppercase',
    color: AMBER.accent,
    marginBottom: 14,
  },
  title: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 40,
    lineHeight: 46,
    color: INK.strong,
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: FONTS.serifBodyItalic,
    fontStyle: 'italic',
    fontSize: 17,
    lineHeight: 26,
    color: INK.soft,
    marginBottom: 32,
  },
  primaryButton: {
    alignSelf: 'stretch',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 999,
    backgroundColor: INK.strong,
    alignItems: 'center',
    shadowColor: '#2a1a0a',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  primaryButtonPressed: {
    opacity: 0.85,
  },
  primaryButtonText: {
    fontFamily: FONTS.serifBodyItalic,
    fontStyle: 'italic',
    fontSize: 17,
    letterSpacing: 0.6,
    color: PARCHMENT,
  },
  secondaryButton: {
    alignSelf: 'stretch',
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontFamily: FONTS.serifBodyItalic,
    fontStyle: 'italic',
    fontSize: 15,
    color: INK.soft,
  },
  footerNote: {
    fontFamily: FONTS.serifBody,
    fontSize: 12,
    lineHeight: 18,
    color: INK.faint,
    textAlign: 'center',
    marginTop: 18,
  },
  buttonGroup: {
    marginTop: 'auto',
    gap: 6,
  },
});
