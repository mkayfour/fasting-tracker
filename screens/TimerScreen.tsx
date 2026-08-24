import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useActiveFast } from '../contexts/ActiveFastContext';
import { useTheme } from '../theme/useTheme';
import { CompletedFast } from '../db/fasts';
import CelebrationModal from '../components/CelebrationModal';
import DurationDropdown, { DurationOption, DURATION_PRESETS } from '../components/DurationDropdown';

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
  const [selectedPreset, setSelectedPreset] = useState<DurationOption>(DURATION_PRESETS[0]);
  const [customHours, setCustomHours] = useState('');
  const [customSelected, setCustomSelected] = useState(false);
  const [completedFast, setCompletedFast] = useState<CompletedFast | null>(null);

  useEffect(() => {
    if (!activeFast) return;
    const interval = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(interval);
  }, [activeFast]);

  if (loading) {
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  function handleStart() {
    if (customSelected) {
      const parsed = parseFloat(customHours);
      if (!Number.isFinite(parsed) || parsed <= 0) return;
      start(parsed, 'custom');
      return;
    }
    start(selectedPreset.hours, selectedPreset.scheduleType);
  }

  async function handleStop() {
    const ended = await stop();
    if (ended) {
      setCompletedFast(ended);
    }
  }

  const customIsValid = Number.isFinite(parseFloat(customHours)) && parseFloat(customHours) > 0;
  const startDisabled = customSelected && !customIsValid;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.elapsed, { color: colors.text }]}>
        {activeFast ? formatElapsed(activeFast.startAt) : '00:00:00'}
      </Text>
      <Text style={[styles.status, { color: colors.textMuted }]}>
        {activeFast ? `Fasting — goal ${activeFast.goalHours}h (${activeFast.scheduleType})` : 'Not fasting'}
      </Text>

      {!activeFast && (
        <DurationDropdown
          selected={selectedPreset}
          customHours={customHours}
          isCustom={customSelected}
          onSelectPreset={(option) => {
            setCustomSelected(false);
            setSelectedPreset(option);
          }}
          onSelectCustom={() => setCustomSelected(true)}
          onChangeCustomHours={setCustomHours}
        />
      )}

      <Pressable
        onPress={() => (activeFast ? handleStop() : handleStart())}
        disabled={startDisabled}
        style={[
          styles.button,
          { backgroundColor: colors.accent, opacity: startDisabled ? 0.5 : 1, marginTop: activeFast ? 32 : 24 },
        ]}
      >
        <Text style={styles.buttonText}>{activeFast ? 'End Fast' : 'Start Fast'}</Text>
      </Pressable>

      <CelebrationModal fast={completedFast} onClose={() => setCompletedFast(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  elapsed: { fontSize: 48, fontVariant: ['tabular-nums'], fontWeight: '600' },
  status: { fontSize: 16, marginTop: 8, marginBottom: 8 },
  button: { paddingVertical: 14, paddingHorizontal: 32, borderRadius: 8 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
