import React, { useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { Colors } from '@/constants/colors';
import { ScoreBadge } from '@/components/ui/ScoreBadge';
import { QuickStats } from '@/components/colleges/QuickStats';
import { ReviewSection } from '@/components/colleges/ReviewSection';
import { CutoffsTable } from '@/components/colleges/CutoffsTable';
import { RecruitersRow } from '@/components/colleges/RecruitersRow';
import { YouTubeLinks } from '@/components/colleges/YouTubeLinks';
import { PlacementBarChart } from '@/components/charts/PlacementBarChart';
import { FeesPieChart } from '@/components/charts/FeesPieChart';
import { ScoreBarChart } from '@/components/charts/ScoreBarChart';
import { useSession } from '@/context/SessionContext';
import { useCompare } from '@/context/CompareContext';
import { useChat } from '@/context/ChatContext';
import type { CollegeDetail } from '@/types';

interface SectionHeaderProps {
  title: string;
}

function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );
}

export default function CollegeDetailScreen() {
  const params = useLocalSearchParams<{ code: string; data: string }>();
  const navigation = useNavigation();

  const rawData = Array.isArray(params.data) ? params.data[0] : params.data;

  // H2: wrap JSON.parse in try/catch — malformed/missing param must not crash the screen
  let college: CollegeDetail | null = null;
  try {
    if (rawData) college = JSON.parse(rawData) as CollegeDetail;
  } catch {
    // college stays null; we render an error state below
  }

  const { isFavorite, addToFavorites, removeFromFavorites } = useSession();
  const { isInCompare, addToCompare, removeFromCompare, isFull } = useCompare();
  const { openForCollege } = useChat();

  const favorited = college ? isFavorite(college.code) : false;
  const inCompare = college ? isInCompare(college.code) : false;

  useEffect(() => {
    if (college) navigation.setOptions({ title: college.name });
  }, [college, navigation]);

  const handleFavoriteToggle = () => {
    if (favorited) {
      removeFromFavorites(college.code);
    } else {
      addToFavorites(college);
    }
  };

  const handleCompareToggle = () => {
    if (inCompare) {
      removeFromCompare(college.code);
    } else if (!isFull()) {
      addToCompare(college);
    }
  };

  // H2: early return if college data could not be parsed
  if (!college) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>College data unavailable. Please go back and try again.</Text>
      </View>
    );
  }

  const hasPlacement =
    college.placement != null &&
    (college.placement.avg_lpa != null || college.placement.highest_lpa != null);

  const hasFees = college.fees != null;
  const hasReviews = college.reviews != null;
  const hasCourses = college.courses != null && college.courses.length > 0;
  const hasScoreBreakdown = college.score_breakdown != null;
  const hasRecruiters =
    college.placement?.top_companies != null &&
    college.placement.top_companies.length > 0;
  const hasVideos =
    college.youtube_videos != null && college.youtube_videos.length > 0;

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header card */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <Text style={styles.collegeName}>{college.name}</Text>
          <ScoreBadge score={college.score} size="md" />
        </View>

        <View style={styles.codeBadge}>
          <Text style={styles.codeBadgeText}>{college.anna_university_code}</Text>
        </View>

        <Text style={styles.location}>
          {college.city}, {college.district}
        </Text>
        <Text style={styles.affiliation}>{college.affiliation}</Text>

        {college.approved_by.length > 0 && (
          <Text style={styles.approvedBy}>
            Approved by: {college.approved_by.join(', ')}
          </Text>
        )}

        {college.nirf_rank != null && (
          <Text style={styles.nirfRank}>NIRF Rank: #{college.nirf_rank}</Text>
        )}
      </View>

      {/* Quick Stats */}
      <View style={styles.section}>
        <QuickStats college={college} />
      </View>

      {/* Action buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, favorited && styles.actionBtnActive]}
          onPress={handleFavoriteToggle}
        >
          <Text style={[styles.actionBtnText, favorited && styles.actionBtnTextActive]}>
            {favorited ? '★ In Favorites' : '★ Add to Favorites'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionBtn,
            inCompare && styles.actionBtnActive,
            !inCompare && isFull() && styles.actionBtnDisabled,
          ]}
          onPress={handleCompareToggle}
          disabled={!inCompare && isFull()}
        >
          <Text style={[styles.actionBtnText, inCompare && styles.actionBtnTextActive]}>
            {inCompare ? '✓ Comparing' : 'Compare'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnChat]}
          onPress={() => openForCollege(college)}
        >
          <Text style={styles.actionBtnTextChat}>Ask College Buddy</Text>
        </TouchableOpacity>
      </View>

      {/* Reviews */}
      {hasReviews && college.reviews != null && (
        <View style={styles.section}>
          <SectionHeader title="Reviews & Sentiment" />
          <ReviewSection college={college} />
        </View>
      )}

      {/* Placement Chart */}
      {hasPlacement && college.placement != null && (
        <View style={styles.section}>
          <SectionHeader title="Placement Data" />
          <PlacementBarChart placement={college.placement} />
        </View>
      )}

      {/* Fees Chart */}
      {hasFees && college.fees != null && (
        <View style={styles.section}>
          <SectionHeader title="Fee Breakdown" />
          <FeesPieChart fees={college.fees} />
        </View>
      )}

      {/* Score Breakdown */}
      {hasScoreBreakdown && college.score_breakdown != null && (
        <View style={styles.section}>
          <SectionHeader title="Score Breakdown" />
          <ScoreBarChart breakdown={college.score_breakdown} />
        </View>
      )}

      {/* Cutoffs Table */}
      {hasCourses && (
        <View style={styles.section}>
          <SectionHeader title="TNEA Cutoffs" />
          <CutoffsTable college={college} />
        </View>
      )}

      {/* Top Recruiters */}
      {hasRecruiters && college.placement?.top_companies != null && (
        <View style={styles.section}>
          <SectionHeader title="Top Recruiters" />
          <RecruitersRow companies={college.placement.top_companies} />
        </View>
      )}

      {/* YouTube Videos */}
      {hasVideos && college.youtube_videos != null && (
        <View style={styles.section}>
          <SectionHeader title="YouTube Videos" />
          <YouTubeLinks videos={college.youtube_videos} />
        </View>
      )}

      {/* Disclaimer */}
      <View style={styles.section}>
        <Text style={styles.disclaimer}>
          Disclaimer: 2026 TNEA cutoffs shown are AI-predicted estimates based on 2024–2025
          historical trends and are not official figures. Verify with the official TNEA portal
          before making decisions.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },

  /* Header card */
  headerCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  collegeName: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 24,
  },
  codeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.gray100,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  codeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.gray600,
    letterSpacing: 0.5,
  },
  location: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  affiliation: {
    fontSize: 12,
    color: Colors.gray500,
  },
  approvedBy: {
    fontSize: 12,
    color: Colors.gray500,
  },
  nirfRank: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.warning,
  },

  /* Section */
  section: {
    gap: 10,
  },
  sectionHeader: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
    paddingBottom: 6,
  },
  sectionHeaderText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },

  /* Action buttons */
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    alignItems: 'center',
  },
  actionBtnActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  actionBtnDisabled: {
    opacity: 0.4,
  },
  actionBtnChat: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.gray700,
    textAlign: 'center',
  },
  actionBtnTextActive: {
    color: Colors.primary,
  },
  actionBtnTextChat: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.white,
    textAlign: 'center',
  },

  /* Disclaimer */
  disclaimer: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 16,
    fontStyle: 'italic',
  },

  /* Error state */
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: Colors.background,
  },
  errorText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
