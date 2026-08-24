import React from 'react';
import { Modal, View, Pressable, Text, StyleSheet } from 'react-native';
import { CompletedFast } from '../db/fasts';
import { useTheme } from '../theme/useTheme';
import FastSummaryCard from './FastSummaryCard';

type Props = {
  fast: CompletedFast | null;
  onClose: () => void;
};

export default function FastDetailModal({ fast, onClose }: Props) {
  const { colors } = useTheme();

  return (
    <Modal visible={fast !== null} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {fast && (
          <View style={styles.content}>
            <FastSummaryCard fast={fast} colors={colors} />
            <Pressable
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Text style={[styles.closeText, { color: colors.text }]}>Close</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  content: { alignItems: 'center' },
  closeButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    borderWidth: 1,
  },
  closeText: { fontSize: 15, fontWeight: '600' },
});
