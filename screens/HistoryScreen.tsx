import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { CompletedFast, listFasts } from '../db/fasts';
import { useTheme } from '../theme/useTheme';
import { useActiveFast } from '../contexts/ActiveFastContext';
import FastDetailModal from '../components/FastDetailModal';
import { formatDuration, formatClockTime, formatRelativeTime } from '../utils/time';

export default function HistoryScreen() {
  const { colors } = useTheme();
  const { activeFast } = useActiveFast();
  const [fasts, setFasts] = useState<CompletedFast[]>([]);
  const [selectedFast, setSelectedFast] = useState<CompletedFast | null>(null);

  useEffect(() => {
    listFasts().then(setFasts);
  }, [activeFast]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={fasts}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.textMuted }]}>No fasts yet</Text>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => setSelectedFast(item)}>
            <View style={[styles.row, { borderBottomColor: colors.border }]}>
              <View style={styles.rowTop}>
                <Text style={[styles.date, { color: colors.text }]}>
                  {new Date(item.startAt).toLocaleDateString()}
                </Text>
                <Text style={[styles.relative, { color: colors.textMuted }]}>
                  {formatRelativeTime(item.endAt)}
                </Text>
              </View>
              <Text style={[styles.duration, { color: colors.textMuted }]}>
                {formatDuration(item.startAt, item.endAt)} · {item.scheduleType}
              </Text>
              <Text style={[styles.times, { color: colors.textMuted }]}>
                {formatClockTime(item.startAt)} – {formatClockTime(item.endAt)}
              </Text>
            </View>
          </Pressable>
        )}
      />
      <FastDetailModal fast={selectedFast} onClose={() => setSelectedFast(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  empty: { textAlign: 'center', marginTop: 32, fontSize: 16 },
  row: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: 16, fontWeight: '600' },
  relative: { fontSize: 13 },
  duration: { fontSize: 14, marginTop: 2 },
  times: { fontSize: 13, marginTop: 2 },
});
