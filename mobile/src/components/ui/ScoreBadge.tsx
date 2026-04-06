import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

interface ScoreBadgeProps {
  score: number | null | undefined;
  size?: 'sm' | 'md';
}

function getScoreColors(score: number | null | undefined): { bg: string; text: string } {
  if (score == null) return { bg: Colors.gray200, text: Colors.gray600 };
  if (score >= 75) return { bg: Colors.successLight, text: Colors.success };
  if (score >= 55) return { bg: Colors.warningLight, text: Colors.warning };
  return { bg: Colors.dangerLight, text: Colors.danger };
}

export function ScoreBadge({ score, size = 'md' }: ScoreBadgeProps) {
  const { bg, text } = getScoreColors(score);
  const label = score != null ? score.toFixed(0) : '—';

  return (
    <View
      style={[
        styles.base,
        size === 'sm' ? styles.sm : styles.md,
        { backgroundColor: bg },
      ]}
    >
      <Text
        style={[
          styles.text,
          size === 'sm' ? styles.textSm : styles.textMd,
          { color: text },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  md: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    fontWeight: '700',
  },
  textSm: {
    fontSize: 11,
  },
  textMd: {
    fontSize: 14,
  },
});
