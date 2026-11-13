import { Button } from '@/components/ds';
import { FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING, sombra, useEstilos, useTheme, type Tema } from '@/theme';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

interface SimpleDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  visible: boolean;
  onClose: () => void;
  title?: string;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

const crearEstilos = (t: Tema) => ({
  overlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: t.colores.overlay,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: SPACING.lg,
    zIndex: 999,
  },
  modal: {
    backgroundColor: t.colores.superficieElevada,
    borderRadius: RADIUS.xxl,
    borderWidth: 1,
    borderColor: t.colores.borde,
    padding: SPACING.lg,
    width: '100%' as const,
    maxWidth: 420,
    maxHeight: '90%' as const,
  },
  title: {
    fontSize: FONT_SIZE.headline,
    fontWeight: FONT_WEIGHT.semibold,
    color: t.colores.texto,
    textAlign: 'center' as const,
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZE.subhead,
    fontWeight: FONT_WEIGHT.semibold,
    color: t.colores.textoSuave,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  grupo: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: SPACING.xs + 2 },
  item: {
    minWidth: 40,
    minHeight: 40,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: t.colores.fondoSuave,
    borderWidth: 1,
    borderColor: t.colores.borde,
  },
  itemSel: { backgroundColor: t.colores.primarioFuerte, borderColor: t.colores.primarioFuerte },
  texto: { fontSize: FONT_SIZE.subhead, color: t.colores.texto },
  textoSel: { fontSize: FONT_SIZE.subhead, color: t.colores.sobrePrimario, fontWeight: FONT_WEIGHT.bold },
  acciones: { flexDirection: 'row' as const, gap: SPACING.md, marginTop: SPACING.lg },
  boton: { flex: 1, minWidth: 0 },
});

export default function SimpleDatePicker({ value, onChange, visible, onClose, title }: SimpleDatePickerProps) {
  const estilos = useEstilos(crearEstilos);
  const { tema } = useTheme();
  // Estados iniciales nulos para evitar desfase
  const [year, setYear] = React.useState<number | null>(null);
  const [month, setMonth] = React.useState<number | null>(null);
  const [day, setDay] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (value && visible) {
      const [y, m, d] = value.split('-').map(Number);
      setYear(y);
      setMonth(m - 1);
      setDay(d);
    }
  }, [value, visible]);

  // Si el estado aún no está listo, no renderizar los pickers
  if (!visible || year === null || month === null || day === null) return null;

  const daysInMonth = getDaysInMonth(year, month);

  const handleConfirm = () => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(dateStr);
    onClose();
  };

  const chip = (key: string | number, etiqueta: string | number, sel: boolean, onPress: () => void) => (
    <Pressable
      key={key}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: sel }}
      style={[estilos.item, sel && estilos.itemSel]}
    >
      <Text style={sel ? estilos.textoSel : estilos.texto}>{etiqueta}</Text>
    </Pressable>
  );

  return (
    <View style={[estilos.overlay]}>
      <View style={[estilos.modal, sombra(tema, 'lg')]}>
        <Text style={estilos.title}>{title || 'Selecciona la fecha'}</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={estilos.label}>Año</Text>
          <View style={estilos.grupo}>
            {[...Array(5)].map((_, i) => {
              const y = new Date().getFullYear() - 2 + i;
              return chip(y, y, year === y, () => setYear(y));
            })}
          </View>
          <Text style={estilos.label}>Mes</Text>
          <View style={estilos.grupo}>
            {[...Array(12)].map((_, i) => chip(i, i + 1, month === i, () => setMonth(i)))}
          </View>
          <Text style={estilos.label}>Día</Text>
          <View style={estilos.grupo}>
            {[...Array(daysInMonth)].map((_, i) => chip(i + 1, i + 1, day === i + 1, () => setDay(i + 1)))}
          </View>
        </ScrollView>
        <View style={estilos.acciones}>
          <Button title="Cancelar" variant="secondary" onPress={onClose} style={estilos.boton} />
          <Button title="Aceptar" onPress={handleConfirm} style={estilos.boton} />
        </View>
      </View>
    </View>
  );
}
