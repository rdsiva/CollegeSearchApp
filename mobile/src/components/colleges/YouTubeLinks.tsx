import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import type { YouTubeVideo } from '@/types';

interface YouTubeLinksProps {
  videos: YouTubeVideo[];
}

export function YouTubeLinks({ videos }: YouTubeLinksProps) {
  if (!videos || videos.length === 0) return null;

  const handleOpen = async (url: string): Promise<void> => {
    // H1: validate URL scheme before opening — reject non-https to prevent malicious deep links
    if (!/^https:\/\//i.test(url)) return;
    const supported = await Linking.canOpenURL(url);
    if (supported) Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={styles.container}>
      {videos.map((video, idx) => (
        <TouchableOpacity
          key={idx}
          style={styles.card}
          onPress={() => handleOpen(video.url)}
          activeOpacity={0.7}
        >
          <Feather name="play-circle" size={28} color={Colors.danger} style={styles.icon} />
          <View style={styles.textContent}>
            <Text style={styles.title} numberOfLines={1}>
              {video.title}
            </Text>
            {video.description != null && video.description.length > 0 && (
              <Text style={styles.description} numberOfLines={2}>
                {video.description}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    gap: 12,
  },
  icon: {
    flexShrink: 0,
  },
  textContent: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  description: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
});
