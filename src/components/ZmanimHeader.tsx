import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useZmanim } from '../hooks/useZmanim';
import { FONTS, INK, SECTIONS } from '../theme/shacharitTheme';

const AMBER = SECTIONS.birchot;

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function urgencyForMinutes(minutesUntilEnd: number | null): 'normal' | 'amber' | 'red' | null {
  if (minutesUntilEnd == null) return null;
  if (minutesUntilEnd <= 0) return null;
  if (minutesUntilEnd <= 10) return 'red';
  if (minutesUntilEnd <= 30) return 'amber';
  return 'normal';
}

const URGENCY_COLORS = {
  normal: { background: 'rgba(176,122,28,0.10)', accent: AMBER.accent, text: INK.strong },
  amber: { background: 'rgba(217,119,6,0.18)', accent: '#92400E', text: '#7A4910' },
  red: { background: 'rgba(220,38,38,0.15)', accent: '#991B1B', text: '#8A1717' },
} as const;

export const ZmanimHeader: React.FC = () => {
  const { zmanim, hasLocation, now } = useZmanim();

  if (!hasLocation || !zmanim) return null;

  const sofZman = zmanim.sofZmanTfillaGRA;
  const minutesUntilEnd = Math.floor((sofZman.getTime() - now.getTime()) / 60_000);
  const urgency = urgencyForMinutes(minutesUntilEnd);

  const sunriseStr = formatTime(zmanim.sunrise);
  const sofZmanStr = formatTime(sofZman);
  const minchaStr = formatTime(zmanim.minchaGedola);
  const sunsetStr = formatTime(zmanim.sunset);

  const palette = urgency ? URGENCY_COLORS[urgency] : URGENCY_COLORS.normal;

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <View style={styles.row}>
        <ZmanCell label="Sunrise" value={sunriseStr} accent={palette.accent} textColor={palette.text} />
        <Divider />
        <ZmanCell
          label="Latest Shacharit"
          value={sofZmanStr}
          accent={palette.accent}
          textColor={palette.text}
          countdown={
            urgency === 'amber' || urgency === 'red'
              ? `${minutesUntilEnd} min`
              : undefined
          }
        />
        <Divider />
        <ZmanCell label="Mincha" value={minchaStr} accent={palette.accent} textColor={palette.text} />
        <Divider />
        <ZmanCell label="Sunset" value={sunsetStr} accent={palette.accent} textColor={palette.text} />
      </View>
    </View>
  );
};

interface ZmanCellProps {
  label: string;
  value: string;
  accent: string;
  textColor: string;
  countdown?: string;
}

const ZmanCell: React.FC<ZmanCellProps> = ({ label, value, accent, textColor, countdown }) => (
  <View style={styles.cell}>
    <Text style={[styles.label, { color: accent }]}>{label}</Text>
    <Text style={[styles.value, { color: textColor }]}>{value}</Text>
    {countdown && <Text style={[styles.countdown, { color: accent }]}>{countdown}</Text>}
  </View>
);

const Divider: React.FC = () => <View style={styles.divider} />;

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(176,122,28,0.22)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    fontFamily: FONTS.serifBody,
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  value: {
    fontFamily: FONTS.serifBody,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  countdown: {
    fontFamily: FONTS.serifBodyItalic,
    fontStyle: 'italic',
    fontSize: 10,
    marginTop: 1,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: 'rgba(120,80,20,0.18)',
    marginHorizontal: 4,
  },
});
