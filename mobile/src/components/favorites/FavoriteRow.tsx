import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { ScoreBadge } from '@/components/ui/ScoreBadge';
import type { CollegeDetail } from '@/types';

interface FavoriteRowProps {
  college: CollegeDetail;
  index: number;
  total: number;
  onRemove: (code: string) => void;
  onNavigate: (college: CollegeDetail) => void;
  onToggleCompare: (college: CollegeDetail) => void;
  isInCompare: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onUpdateCourses: (code: string, selectedCourses: string[] | undefined) => void;
}

export function FavoriteRow({
  college,
  index,
  total,
  onRemove,
  onNavigate,
  onToggleCompare,
  isInCompare,
  onMoveUp,
  onMoveDown,
  onUpdateCourses,
}: FavoriteRowProps) {
  const isEven = index % 2 === 0;
  const [showEditModal, setShowEditModal] = useState(false);
  const allBranches = college.courses?.map((c) => c.branch_name) ?? [];
  const [branchSelection, setBranchSelection] = useState<Set<string>>(
    () => new Set(college.selectedCourses ?? allBranches)
  );

  const openEdit = () => {
    setBranchSelection(new Set(college.selectedCourses ?? allBranches));
    setShowEditModal(true);
  };

  const handleSave = () => {
    const allSelected = branchSelection.size === allBranches.length;
    onUpdateCourses(college.code, allSelected ? undefined : Array.from(branchSelection));
    setShowEditModal(false);
  };

  const toggleBranch = (name: string) => {
    setBranchSelection((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.row, { backgroundColor: isEven ? Colors.gray50 : Colors.white }]}
        onPress={() => onNavigate(college)}
        activeOpacity={0.7}
      >
        {/* Reorder arrows */}
        <View style={styles.reorderCol}>
          <TouchableOpacity
            onPress={onMoveUp}
            disabled={index === 0}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            accessibilityLabel="Move up"
          >
            <Feather name="chevron-up" size={16} color={index === 0 ? Colors.gray200 : Colors.gray400} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onMoveDown}
            disabled={index === total - 1}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            accessibilityLabel="Move down"
          >
            <Feather name="chevron-down" size={16} color={index === total - 1 ? Colors.gray200 : Colors.gray400} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={1}>{college.name}</Text>
          <Text style={styles.meta} numberOfLines={1}>
            {college.district} · {college.affiliation}
          </Text>

          {/* Selected courses */}
          <TouchableOpacity style={styles.coursesRow} onPress={(e) => { e.stopPropagation?.(); openEdit(); }} activeOpacity={0.7}>
            {college.selectedCourses && college.selectedCourses.length > 0 ? (
              <>
                {college.selectedCourses.slice(0, 2).map((branch) => (
                  <View key={branch} style={styles.branchBadge}>
                    <Text style={styles.branchBadgeText} numberOfLines={1}>{branch}</Text>
                  </View>
                ))}
                {college.selectedCourses.length > 2 && (
                  <View style={styles.branchBadge}>
                    <Text style={styles.branchBadgeText}>+{college.selectedCourses.length - 2}</Text>
                  </View>
                )}
              </>
            ) : (
              <Text style={styles.allBranchesText}>All branches</Text>
            )}
            <Feather name="edit-2" size={11} color={Colors.primary} style={styles.editIcon} />
          </TouchableOpacity>

          <View style={styles.rankRow}>
            {college.nirf_rank != null && (
              <Text style={styles.nirfText}>NIRF #{college.nirf_rank}</Text>
            )}
            <ScoreBadge score={college.score} size="sm" />
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => onToggleCompare(college)}
            style={[styles.actionButton, isInCompare && styles.actionButtonActive]}
            accessibilityLabel={isInCompare ? 'Remove from compare' : 'Add to compare'}
          >
            <Feather name="columns" size={18} color={isInCompare ? Colors.primary : Colors.gray400} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onRemove(college.code)}
            style={styles.actionButton}
            accessibilityLabel="Remove from favorites"
          >
            <Feather name="trash-2" size={18} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Branch edit modal */}
      <Modal visible={showEditModal} animationType="slide" transparent onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Edit branches</Text>
            <Text style={styles.modalSubtitle}>{college.name}</Text>

            <TouchableOpacity
              style={styles.allBranchesRow}
              onPress={() => {
                if (branchSelection.size === allBranches.length) {
                  setBranchSelection(new Set());
                } else {
                  setBranchSelection(new Set(allBranches));
                }
              }}
            >
              <View style={[styles.checkbox, branchSelection.size === allBranches.length && styles.checkboxChecked]}>
                {branchSelection.size === allBranches.length && <Feather name="check" size={12} color={Colors.white} />}
              </View>
              <Text style={styles.allBranchesLabel}>All Branches</Text>
            </TouchableOpacity>
            <View style={styles.divider} />

            <ScrollView style={styles.branchList} showsVerticalScrollIndicator={false}>
              {allBranches.map((name) => {
                const isChecked = branchSelection.has(name);
                return (
                  <TouchableOpacity key={name} style={styles.branchRow} onPress={() => toggleBranch(name)}>
                    <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                      {isChecked && <Feather name="check" size={12} color={Colors.white} />}
                    </View>
                    <Text style={styles.branchName}>{name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEditModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, branchSelection.size === 0 && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={branchSelection.size === 0}
              >
                <Text style={styles.saveBtnText}>Save ({branchSelection.size})</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  reorderCol: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    marginRight: 8,
    width: 20,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 2,
  },
  meta: {
    fontSize: 12,
    color: Colors.gray500,
    marginBottom: 4,
  },
  coursesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  branchBadge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    maxWidth: 150,
  },
  branchBadgeText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '600',
  },
  allBranchesText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  editIcon: {
    marginLeft: 2,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nirfText: {
    fontSize: 12,
    color: Colors.gray600,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
  },
  actionButtonActive: {
    backgroundColor: Colors.primaryLight,
  },
  // Modal
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
  allBranchesLabel: {
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
  branchName: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
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
