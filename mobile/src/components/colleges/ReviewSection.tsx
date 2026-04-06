import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import type { CollegeDetail } from '@/types';

interface ReviewSectionProps {
  college: CollegeDetail;
}

export function ReviewSection({ college }: ReviewSectionProps) {
  const reviews = college.reviews;
  if (!reviews) return null;

  const pros = reviews.pros?.slice(0, 5) ?? [];
  const cons = reviews.cons?.slice(0, 5) ?? [];
  const snippets = reviews.review_texts?.slice(0, 3) ?? [];

  return (
    <View style={styles.container}>
      {/* Google rating row */}
      {reviews.google_rating != null && (
        <View style={styles.ratingRow}>
          <Text style={styles.starIcon}>★</Text>
          <Text style={styles.ratingText}>
            {reviews.google_rating.toFixed(1)}/5
          </Text>
          {reviews.sentiment_score != null && (
            <View style={styles.sentimentBadge}>
              <Text style={styles.sentimentText}>
                Sentiment: {reviews.sentiment_score.toFixed(1)}/10
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Pros */}
      {pros.length > 0 && (
        <View style={styles.listSection}>
          <Text style={styles.listHeader}>Pros</Text>
          {pros.map((pro, idx) => (
            <View key={idx} style={styles.bulletRow}>
              <Text style={styles.greenDot}>●</Text>
              <Text style={styles.bulletText}>{pro}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Cons */}
      {cons.length > 0 && (
        <View style={styles.listSection}>
          <Text style={styles.listHeader}>Cons</Text>
          {cons.map((con, idx) => (
            <View key={idx} style={styles.bulletRow}>
              <Text style={styles.redDot}>●</Text>
              <Text style={styles.bulletText}>{con}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Summary */}
      {reviews.summary != null && reviews.summary.length > 0 && (
        <Text style={styles.summary}>{reviews.summary}</Text>
      )}

      {/* Common complaints */}
      {reviews.common_complaints != null && reviews.common_complaints.length > 0 && (
        <View style={styles.listSection}>
          <Text style={styles.complaintsHeader}>Common Complaints</Text>
          {reviews.common_complaints.map((complaint, idx) => (
            <View key={idx} style={styles.bulletRow}>
              <Text style={styles.grayDot}>●</Text>
              <Text style={styles.complaintText}>{complaint}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Review snippets */}
      {snippets.length > 0 && (
        <View style={styles.listSection}>
          <Text style={styles.listHeader}>Reviews</Text>
          {snippets.map((snippet, idx) => (
            <View key={idx} style={styles.snippetCard}>
              <Text style={styles.snippetText}>
                {snippet.length > 150 ? snippet.slice(0, 150) + '…' : snippet}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starIcon: {
    fontSize: 20,
    color: Colors.warning,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  sentimentBadge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sentimentText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  listSection: {
    gap: 6,
  },
  listHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gray700,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  greenDot: {
    fontSize: 10,
    color: Colors.success,
    marginTop: 3,
  },
  redDot: {
    fontSize: 10,
    color: Colors.danger,
    marginTop: 3,
  },
  grayDot: {
    fontSize: 10,
    color: Colors.gray400,
    marginTop: 3,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  summary: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  complaintsHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gray500,
  },
  complaintText: {
    flex: 1,
    fontSize: 12,
    color: Colors.gray500,
    lineHeight: 18,
  },
  snippetCard: {
    backgroundColor: Colors.gray100,
    borderRadius: 8,
    padding: 10,
  },
  snippetText: {
    fontSize: 12,
    color: Colors.gray600,
    lineHeight: 18,
  },
});
