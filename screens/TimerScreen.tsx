import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useActiveFast } from '../contexts/ActiveFastContext';
import { useTheme } from '../theme/useTheme';

function formatElapsed(startAt: string): string {
  const ms = Date.now() - new Date(startAt).getTime();
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, '0')).join(':');
}

export default function TimerScreen() {
  const { activeFast, loading, start, stop } = useActiveFast();
  const { colors } = useTheme();
  const [, forceTick] = useState(0);

  useEffect(() => {
    if (!activeFast) return;
    const interval = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(interval);
  }, [activeFast]);

  if (loading) {
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.elapsed, { color: colors.text }]}>
        {activeFast ? formatElapsed(activeFast.startAt) : '00:00:00'}
      </Text>
      <Text style={[styles.status, { color: colors.textMuted }]}>
        {activeFast ? `Fasting — goal ${activeFast.goalHours}h (${activeFast.scheduleType})` : 'Not fasting'}
      </Text>
      <Pressable
        onPress={() => (activeFast ? stop() : start(16, '16:8'))}
        style={[styles.button, { backgroundColor: colors.accent }]}
      >
        <Text style={styles.buttonText}>{activeFast ? 'End Fast' : 'Start Fast'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  elapsed: { fontSize: 48, fontVariant: ['tabular-nums'], fontWeight: '600' },
  status: { fontSize: 16, marginTop: 8, marginBottom: 32 },
  button: { paddingVertical: 14, paddingHorizontal: 32, borderRadius: 8 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
