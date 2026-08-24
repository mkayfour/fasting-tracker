import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CompletedFast, listFasts } from '../db/fasts';
import { useTheme } from '../theme/useTheme';
import { useActiveFast } from '../contexts/ActiveFastContext';

function formatDuration(startAt: string, endAt: string): string {
  const ms = new Date(endAt).getTime() - new Date(startAt).getTime();
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  return `${hours}h ${minutes}m`;
}

export default function HistoryScreen() {
  const { colors } = useTheme();
  const { activeFast } = useActiveFast();
  const insets = useSafeAreaInsets();
  const [fasts, setFasts] = useState<CompletedFast[]>([]);

  useEffect(() => {
    listFasts().then(setFasts);
  }, [activeFast]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top + 16 },
      ]}
    >
      <FlatList
        data={fasts}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.textMuted }]}>No fasts yet</Text>
        }
        renderItem={({ item }) => (
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <Text style={[styles.date, { color: colors.text }]}>
              {new Date(item.startAt).toLocaleDateString()}
            </Text>
            <Text style={[styles.duration, { color: colors.textMuted }]}>
              {formatDuration(item.startAt, item.endAt)} · {item.scheduleType}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  empty: { textAlign: 'center', marginTop: 32, fontSize: 16 },
  row: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  date: { fontSize: 16, fontWeight: '600' },
  duration: { fontSize: 14, marginTop: 2 },
});
