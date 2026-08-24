import React, { useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet, TextInput } from 'react-native';
import { useTheme } from '../theme/useTheme';

export type DurationOption = { hours: number; scheduleType: string; label: string };

export const DURATION_PRESETS: DurationOption[] = [
  { hours: 16, scheduleType: '16:8', label: '16 hours (16:8)' },
  { hours: 18, scheduleType: '18:6', label: '18 hours (18:6)' },
  { hours: 20, scheduleType: '20:4', label: '20 hours (20:4)' },
  { hours: 24, scheduleType: 'OMAD', label: '24 hours (OMAD)' },
];

type Props = {
  selected: DurationOption | null;
  customHours: string;
  onSelectPreset: (option: DurationOption) => void;
  onSelectCustom: () => void;
  onChangeCustomHours: (value: string) => void;
  isCustom: boolean;
};

export default function DurationDropdown({
  selected,
  customHours,
  onSelectPreset,
  onSelectCustom,
  onChangeCustomHours,
  isCustom,
}: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  const displayLabel = isCustom
    ? customHours
      ? `${customHours} hours (custom)`
      : 'Custom hours'
    : (selected?.label ?? 'Select duration');

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.trigger, { borderColor: colors.border, backgroundColor: colors.surface }]}
      >
        <Text style={[styles.triggerText, { color: colors.text }]}>{displayLabel}</Text>
        <Text style={[styles.chevron, { color: colors.textMuted }]}>▾</Text>
      </Pressable>

      {isCustom && (
        <TextInput
          value={customHours}
          onChangeText={onChangeCustomHours}
          placeholder="Hours"
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
          style={[
            styles.customInput,
            { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
          ]}
        />
      )}

      <Modal visible={open} animationType="fade" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {DURATION_PRESETS.map((option) => (
              <Pressable
                key={option.scheduleType}
                onPress={() => {
                  onSelectPreset(option);
                  setOpen(false);
                }}
                style={[styles.option, { borderBottomColor: colors.border }]}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: !isCustom && selected?.scheduleType === option.scheduleType ? colors.accent : colors.text },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => {
                onSelectCustom();
                setOpen(false);
              }}
              style={styles.option}
            >
              <Text style={[styles.optionText, { color: isCustom ? colors.accent : colors.text }]}>
                Custom…
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 16,
    minWidth: 220,
  },
  triggerText: { fontSize: 15, fontWeight: '600' },
  chevron: { fontSize: 14, marginLeft: 8 },
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
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  sheet: { borderRadius: 12, borderWidth: 1, width: 260, overflow: 'hidden' },
  option: { paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: StyleSheet.hairlineWidth },
  optionText: { fontSize: 15, fontWeight: '600' },
});
