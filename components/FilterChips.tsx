import { ChipGroup } from '@/components/ds';
import React from 'react';

/**
 * Compatibilidad: conserva la API anterior pero dibuja el `ChipGroup` del sistema de diseño
 * (las fichas pasan de línea y nunca se salen del borde).
 */
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
  return <ChipGroup label={label} options={options} value={selected} onChange={onSelect} />;
}
