import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { ScoreBadge } from '@/components/ui/ScoreBadge';
import { useSession } from '@/context/SessionContext';
import { useCompare } from '@/context/CompareContext';
import { useChat } from '@/context/ChatContext';
import type { CollegeDetail } from '@/types';

interface CollegeCardProps {
  college: CollegeDetail;
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return 'N/A';
  return `\u20b9${value.toLocaleString('en-IN')}`;
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export default function CollegeCard({ college }: CollegeCardProps) {
  const router = useRouter();
  const { isFavorite, addToFavorites, removeFromFavorites } = useSession();
  const { compareList, isInCompare, addToCompare, removeFromCompare, isFull } = useCompare();
  const { openForCollege } = useChat();

  const [showBranchModal, setShowBranchModal] = useState(false);
  const [branchSelection, setBranchSelection] = useState<Set<string>>(new Set());

  const favorited = isFavorite(college.code);
  const comparing = isInCompare(college.code);
  const compareActive = compareList.length > 0;

  const avgLpa =
    college.placement?.avg_lpa != null
      ? `${college.placement.avg_lpa} LPA`
      : 'N/A';
  const tneaFees = formatCurrency(college.fees?.tnea);
  const sentiment =
    college.reviews?.sentiment_score != null
      ? `${college.reviews.sentiment_score}/10`
      : 'N/A';
  const placementPct =
    college.placement?.placement_percentage != null
      ? `${college.placement.placement_percentage}%`
      : 'N/A';

  const pros = college.reviews?.pros?.slice(0, 2) ?? [];
  const cons = college.reviews?.cons?.slice(0, 2) ?? [];
  const hasProsOrCons = pros.length > 0 || cons.length > 0;

  const handleViewDetails = () => {
    router.push({
      pathname: '/college/[code]',
      params: { code: college.code, data: JSON.stringify(college) },
    });
  };

  const handleFavoriteToggle = () => {
    if (favorited) {
      removeFromFavorites(college.code);
    } else if (college.courses.length <= 1) {
      addToFavorites(college);
    } else {
      setBranchSelection(new Set(college.courses.map((c) => c.branch_name)));
      setShowBranchModal(true);
    }
  };

  const handleSaveBranches = () => {
    const allSelected = branchSelection.size === college.courses.length;
    addToFavorites({
      ...college,
      selectedCourses: allSelected ? undefined : Array.from(branchSelection),
    });
    setShowBranchModal(false);
  };

  const toggleBranch = (branchName: string) => {
    setBranchSelection((prev) => {
      const next = new Set(prev);
      if (next.has(branchName)) next.delete(branchName);
      else next.add(branchName);
      return next;
    });
  };

  const handleCompareToggle = () => {
    if (comparing) {
      removeFromCompare(college.code);
    } else if (!isFull()) {
      addToCompare(college);
    }
  };

  return (
    <View style={styles.card}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          {college.nirf_rank != null && (
            <View style={styles.nirfBadge}>
              <Text style={styles.nirfText}>NIRF #{college.nirf_rank}</Text>
            </View>
          )}
          {favorited && (
            <View style={styles.savedBadge}>
              <Text style={styles.savedBadgeText}>★ Saved</Text>
            </View>
          )}
        </View>
        <ScoreBadge score={college.score} size="md" />
      </View>

      <Text style={styles.collegeName}>{college.name}</Text>

      {/* Subtitle */}
      <Text style={styles.subtitle} numberOfLines={1}>
        {college.city}, {college.district} | {college.affiliation}
      </Text>

      {/* AU code */}
      <Text style={styles.auCode}>Code: {college.anna_university_code}</Text>

      {/* Quick stats */}
      <View style={styles.statsRow}>
        <StatTile label="Avg LPA" value={avgLpa} />
        <StatTile label="TNEA Fees" value={tneaFees} />
        <StatTile label="Sentiment" value={sentiment} />
        <StatTile label="Placement" value={placementPct} />
      </View>

      {/* Pros / Cons */}
      {hasProsOrCons && (
        <View style={styles.prosConsContainer}>
          {pros.map((pro, idx) => (
            <View key={`pro-${idx}`} style={styles.prosConsRow}>
              <Text style={styles.prosBullet}>+</Text>
              <Text style={styles.prosText} numberOfLines={2}>
                {pro}
              </Text>
            </View>
          ))}
          {cons.map((con, idx) => (
            <View key={`con-${idx}`} style={styles.prosConsRow}>
              <Text style={styles.consBullet}>-</Text>
              <Text style={styles.consText} numberOfLines={2}>
                {con}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, compareActive && styles.actionBtnCompareMode]}
          onPress={() => openForCollege(college)}
          accessibilityLabel="Open College Buddy chat"
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          <Feather
            name={compareActive ? 'message-square' : 'message-circle'}
            size={15}
            color={compareActive ? Colors.warning : Colors.primary}
          />
          <Text style={[styles.actionBtnText, compareActive && styles.actionBtnTextCompare]}>
            Buddy
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, comparing && styles.actionBtnActive]}
          onPress={handleCompareToggle}
          disabled={!comparing && isFull()}
          accessibilityLabel={comparing ? 'Remove from compare' : 'Add to compare'}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          <Feather
            name="columns"
            size={15}
            color={comparing ? Colors.white : Colors.primary}
          />
          <Text style={[styles.actionBtnText, comparing && styles.actionBtnTextActive]}>
            {comparing ? 'Comparing' : 'Compare'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, favorited && styles.actionBtnFav]}
          onPress={handleFavoriteToggle}
          accessibilityLabel={favorited ? 'Remove from favorites' : 'Add to favorites'}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          <Feather
            name="star"
            size={15}
            color={favorited ? Colors.warning : Colors.primary}
          />
          <Text style={[styles.actionBtnText, favorited && styles.actionBtnTextFav]}>
            {favorited ? 'In Favorites' : 'Add to Favorites'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.viewDetailsBtn]}
          onPress={handleViewDetails}
          accessibilityLabel="View college details"
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          <Text style={styles.viewDetailsBtnText}>Details</Text>
          <Feather name="chevron-right" size={15} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Branch-picker modal */}
      <Modal
        visible={showBranchModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowBranchModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Choose branches to save</Text>
            <Text style={styles.modalSubtitle}>{college.name}</Text>

            {/* All Branches toggle */}
            <TouchableOpacity
              style={styles.allBranchesRow}
              onPress={() => {
                if (branchSelection.size === college.courses.length) {
                  setBranchSelection(new Set());
                } else {
                  setBranchSelection(new Set(college.courses.map((c) => c.branch_name)));
                }
              }}
            >
              <View style={[
                styles.checkbox,
                branchSelection.size === college.courses.length && styles.checkboxChecked,
              ]}>
                {branchSelection.size === college.courses.length && (
                  <Feather name="check" size={12} color={Colors.white} />
                )}
              </View>
              <Text style={styles.allBranchesText}>All Branches</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <ScrollView style={styles.branchList} showsVerticalScrollIndicator={false}>
              {college.courses.map((course) => {
                const isChecked = branchSelection.has(course.branch_name);
                return (
                  <TouchableOpacity
                    key={course.branch_code}
                    style={styles.branchRow}
                    onPress={() => toggleBranch(course.branch_name)}
                  >
                    <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                      {isChecked && <Feather name="check" size={12} color={Colors.white} />}
                    </View>
                    <View style={styles.branchInfo}>
                      <Text style={styles.branchName}>{course.branch_name}</Text>
                      <Text style={styles.branchCode}>{course.branch_code}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowBranchModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, branchSelection.size === 0 && styles.saveBtnDisabled]}
                onPress={handleSaveBranches}
                disabled={branchSelection.size === 0}
              >
                <Text style={styles.saveBtnText}>
                  Save {branchSelection.size > 0 ? `(${branchSelection.size})` : ''}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  headerLeft: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
    paddingRight: 8,
  },
  nirfBadge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  nirfText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '700',
  },
  savedBadge: {
    backgroundColor: Colors.warningLight,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  savedBadgeText: {
    fontSize: 11,
    color: Colors.warning,
    fontWeight: '700',
  },
  collegeName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 3,
  },
  auCode: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statTile: {
    flex: 1,
    backgroundColor: Colors.gray50,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  prosConsContainer: {
    marginBottom: 12,
    gap: 4,
  },
  prosConsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  prosBullet: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.success,
    lineHeight: 20,
    width: 14,
  },
  prosText: {
    flex: 1,
    fontSize: 13,
    color: Colors.gray700,
    lineHeight: 20,
  },
  consBullet: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.danger,
    lineHeight: 20,
    width: 14,
  },
  consText: {
    flex: 1,
    fontSize: 13,
    color: Colors.gray700,
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  actionBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  actionBtnFav: {
    borderColor: Colors.warning,
  },
  actionBtnCompareMode: {
    borderColor: Colors.warning,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  actionBtnTextActive: {
    color: Colors.white,
  },
  actionBtnTextFav: {
    color: Colors.warning,
  },
  actionBtnTextCompare: {
    color: Colors.warning,
  },
  viewDetailsBtn: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    marginLeft: 'auto',
  },
  viewDetailsBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: '75%',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  allBranchesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  allBranchesText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginBottom: 4,
  },
  branchList: {
    maxHeight: 280,
  },
  branchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  branchInfo: {
    flex: 1,
  },
  branchName: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500',
  },
  branchCode: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: 'monospace',
    marginTop: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: Colors.gray300,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
});
