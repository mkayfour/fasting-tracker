import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput } from 'react-native';
import { useActiveFast } from '../contexts/ActiveFastContext';
import { useTheme } from '../theme/useTheme';
import { CompletedFast } from '../db/fasts';
import CelebrationModal from '../components/CelebrationModal';

function formatElapsed(startAt: string): string {
  const ms = Date.now() - new Date(startAt).getTime();
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, '0')).join(':');
}

const PRESETS: { hours: number; scheduleType: string }[] = [
  { hours: 16, scheduleType: '16:8' },
  { hours: 18, scheduleType: '18:6' },
  { hours: 20, scheduleType: '20:4' },
  { hours: 24, scheduleType: 'OMAD' },
];

export default function TimerScreen() {
  const { activeFast, loading, start, stop } = useActiveFast();
  const { colors } = useTheme();
  const [, forceTick] = useState(0);
  const [selectedHours, setSelectedHours] = useState<number>(PRESETS[0].hours);
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
    const preset = PRESETS.find((p) => p.hours === selectedHours) ?? PRESETS[0];
    start(preset.hours, preset.scheduleType);
  }

  const customIsValid = Number.isFinite(parseFloat(customHours)) && parseFloat(customHours) > 0;
  const startDisabled = customSelected && !customIsValid;

  async function handleStop() {
    const ended = await stop();
    if (ended) {
      setCompletedFast(ended);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.elapsed, { color: colors.text }]}>
        {activeFast ? formatElapsed(activeFast.startAt) : '00:00:00'}
      </Text>
      <Text style={[styles.status, { color: colors.textMuted }]}>
        {activeFast ? `Fasting — goal ${activeFast.goalHours}h (${activeFast.scheduleType})` : 'Not fasting'}
      </Text>

      {!activeFast && (
        <View style={styles.presetsRow}>
          {PRESETS.map((preset) => {
            const isSelected = !customSelected && selectedHours === preset.hours;
            return (
              <Pressable
                key={preset.scheduleType}
                onPress={() => {
                  setCustomSelected(false);
                  setSelectedHours(preset.hours);
                }}
                style={[
                  styles.chip,
                  {
                    borderColor: isSelected ? colors.accent : colors.border,
                    backgroundColor: isSelected ? colors.accent : colors.surface,
                  },
                ]}
              >
                <Text style={[styles.chipText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                  {preset.hours}h
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            onPress={() => setCustomSelected(true)}
            style={[
              styles.chip,
              {
                borderColor: customSelected ? colors.accent : colors.border,
                backgroundColor: customSelected ? colors.accent : colors.surface,
              },
            ]}
          >
            <Text style={[styles.chipText, { color: customSelected ? '#FFFFFF' : colors.text }]}>
              Custom
            </Text>
          </Pressable>
        </View>
      )}

      {!activeFast && customSelected && (
        <TextInput
          value={customHours}
          onChangeText={setCustomHours}
          placeholder="Hours"
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
          style={[
            styles.customInput,
            { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
          ]}
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
  presetsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 16 },
  chip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 14, fontWeight: '600' },
  customInput: {
    marginTop: 12,
    width: 120,
    textAlign: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  button: { paddingVertical: 14, paddingHorizontal: 32, borderRadius: 8 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
