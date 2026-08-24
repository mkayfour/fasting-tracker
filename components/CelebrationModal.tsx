import React, { useRef, useState } from 'react';
import { Modal, View, Pressable, Text, StyleSheet } from 'react-native';
import ViewShot, { ViewShotRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { CompletedFast } from '../db/fasts';
import { useTheme } from '../theme/useTheme';
import FastSummaryCard from './FastSummaryCard';

type Props = {
  fast: CompletedFast | null;
  onClose: () => void;
};

export default function CelebrationModal({ fast, onClose }: Props) {
  const { colors } = useTheme();
  const shotRef = useRef<ViewShotRef>(null);
  const [sharing, setSharing] = useState(false);

  async function handleShare() {
    if (!shotRef.current?.capture) return;
    setSharing(true);
    try {
      const uri = await shotRef.current.capture();
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png' });
      }
    } finally {
      setSharing(false);
    }
  }

  return (
    <Modal visible={fast !== null} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {fast && (
          <View style={styles.content}>
            <Text style={[styles.title, { color: '#FFFFFF' }]}>Fast complete 🎉</Text>
            <ViewShot ref={shotRef} options={{ format: 'png', quality: 1 }}>
              <FastSummaryCard fast={fast} colors={colors} />
            </ViewShot>
            <Pressable
              onPress={handleShare}
              disabled={sharing}
              style={[styles.shareButton, { backgroundColor: colors.accent, opacity: sharing ? 0.6 : 1 }]}
            >
              <Text style={styles.shareText}>{sharing ? 'Preparing…' : 'Share'}</Text>
            </Pressable>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  content: { alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  shareButton: { marginTop: 20, paddingVertical: 12, paddingHorizontal: 40, borderRadius: 8 },
  shareText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  closeButton: { marginTop: 14, paddingVertical: 8 },
  closeText: { color: '#FFFFFF', fontSize: 14, opacity: 0.8 },
});
