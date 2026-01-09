import { commonStyles, SPACING } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface FilterOption {
  key: string;
  label: string;
}

interface FilterChipsProps {
  options: FilterOption[];
  selected: string;
  onSelect: (key: string) => void;
  label?: string;
}

export default function FilterChips({ options, selected, onSelect, label }: FilterChipsProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={commonStyles.label}>{label}</Text>}
      <View style={styles.chipsRow}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              commonStyles.chip,
              selected === option.key && commonStyles.chipActive,
            ]}
            onPress={() => onSelect(option.key)}
          >
            <Text
              style={[
                commonStyles.chipText,
                selected === option.key && commonStyles.chipTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
});
