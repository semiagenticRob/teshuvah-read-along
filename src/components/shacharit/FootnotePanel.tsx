import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Audio, AVPlaybackSource } from 'expo-av';
import { FONTS, INK } from '../../theme/shacharitTheme';
import { BundledCommentary } from '../../data/bundled/shacharit';
import ExpandablePanel from './ExpandablePanel';

interface Props {
  commentary: BundledCommentary | null;
  accent: string;
  isOpen: boolean;
  /** Resolved audio source (require() result). UI hides play button when undefined. */
  audioSource?: AVPlaybackSource;
}

/**
 * Expanded card with commentary text and an optional play button for
 * per-commentary audio. Mounts lazily via ExpandablePanel.
 */
function FootnotePanel({ commentary, accent, isOpen, audioSource }: Props) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePlay = useCallback(async () => {
    if (!audioSource) return;
    setIsLoading(true);
    try {
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(audioSource, { shouldPlay: true });
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (!status.isLoaded) return;
          setIsPlaying(status.isPlaying);
          if (status.didJustFinish) setIsPlaying(false);
        });
        setSound(newSound);
        setIsPlaying(true);
      }
    } catch {
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  }, [audioSource, sound, isPlaying]);

  React.useEffect(() => {
    return () => {
      sound?.unloadAsync();
    };
  }, [sound]);

  return (
    <ExpandablePanel open={isOpen}>
      <View style={[styles.card, { borderLeftColor: accent }]}>
        {commentary && (
          <>
            <View style={styles.headerRow}>
              <Text style={[styles.marker, { color: accent }]}>{commentary.marker}</Text>
              {audioSource && (
                <Pressable onPress={handlePlay} hitSlop={8} style={styles.playButton}>
                  {isLoading ? (
                    <ActivityIndicator size="small" color={accent} />
                  ) : (
                    <Text style={[styles.playLabel, { color: accent }]}>
                      {isPlaying ? '❚❚  Pause' : '▶  Play commentary'}
                    </Text>
                  )}
                </Pressable>
              )}
            </View>
            <Text style={styles.body}>{commentary.text}</Text>
          </>
        )}
      </View>
    </ExpandablePanel>
  );
}

export default React.memo(FootnotePanel);

const styles = StyleSheet.create({
  card: {
    borderLeftWidth: 2,
    paddingLeft: 14,
    paddingVertical: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  marker: {
    fontFamily: FONTS.serifBody,
    fontSize: 11,
    letterSpacing: 1.4,
    fontWeight: '700',
  },
  playButton: {
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  playLabel: {
    fontFamily: FONTS.serifBodyItalic,
    fontStyle: 'italic',
    fontSize: 12,
  },
  body: {
    fontFamily: FONTS.serifBody,
    fontSize: 15,
    lineHeight: 23,
    color: INK.soft,
  },
});
