import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CompletedFast } from '../db/fasts';
import { ThemeColors } from '../theme/colors';

function formatDuration(startAt: string, endAt: string): string {
  const ms = new Date(endAt).getTime() - new Date(startAt).getTime();
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  return `${hours}h ${minutes}m`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString()} · ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function metGoal(fast: CompletedFast): boolean {
  const ms = new Date(fast.endAt).getTime() - new Date(fast.startAt).getTime();
  return ms / 3_600_000 >= fast.goalHours;
}

type Props = {
  fast: CompletedFast;
  colors: ThemeColors;
};

export default function FastSummaryCard({ fast, colors }: Props) {
  const goalMet = metGoal(fast);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.duration, { color: colors.text }]}>
        {formatDuration(fast.startAt, fast.endAt)}
      </Text>
      <Text style={[styles.goalLine, { color: goalMet ? colors.accent : colors.textMuted }]}>
        {goalMet ? 'Goal reached' : 'Ended early'} · goal {fast.goalHours}h ({fast.scheduleType})
      </Text>
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.textMuted }]}>Started</Text>
        <Text style={[styles.value, { color: colors.text }]}>{formatDateTime(fast.startAt)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.textMuted }]}>Ended</Text>
        <Text style={[styles.value, { color: colors.text }]}>{formatDateTime(fast.endAt)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 1, padding: 20, width: 280 },
  duration: { fontSize: 36, fontWeight: '700', textAlign: 'center' },
  goalLine: { fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 6 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  label: { fontSize: 13 },
  value: { fontSize: 13, fontWeight: '600' },
});
