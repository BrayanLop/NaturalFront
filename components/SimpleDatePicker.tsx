import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

// Solución: Asegurarse que el valor inicial del picker siempre se toma del prop value, y que el estado se actualiza correctamente al abrir el modal.
// Además, evitar que el estado se reinicie por defecto en 0 si value no está presente.
export default function SimpleDatePicker({ value, onChange, visible, onClose, title }: SimpleDatePickerProps) {
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

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <Text style={styles.title}>{title || 'Selecciona la fecha'}</Text>
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Año</Text>
            <View style={styles.pickerRow}>
              {[...Array(5)].map((_, i) => {
                const y = new Date().getFullYear() - 2 + i;
                return (
                  <TouchableOpacity key={y} style={[styles.pickerItem, year === y && styles.selected]} onPress={() => setYear(y)}>
                    <Text style={year === y ? styles.selectedText : styles.pickerText}>{y}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Mes</Text>
            <View style={styles.pickerRow}>
              {[...Array(12)].map((_, i) => (
                <TouchableOpacity key={i} style={[styles.pickerItem, month === i && styles.selected]} onPress={() => setMonth(i)}>
                  <Text style={month === i ? styles.selectedText : styles.pickerText}>{i + 1}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Día</Text>
            <View style={styles.pickerRow}>
              {[...Array(daysInMonth)].map((_, i) => (
                <TouchableOpacity key={i + 1} style={[styles.pickerItem, day === i + 1 && styles.selected]} onPress={() => setDay(i + 1)}>
                  <Text style={day === i + 1 ? styles.selectedText : styles.pickerText}>{i + 1}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={onClose}><Text style={styles.buttonText}>Cancelar</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.confirm]} onPress={handleConfirm}><Text style={styles.buttonText}>Aceptar</Text></TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '90%',
    maxWidth: 400,
    elevation: 5,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  col: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  pickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  pickerItem: {
    padding: 6,
    margin: 2,
    borderRadius: 6,
    backgroundColor: '#f2f2f2',
  },
  selected: {
    backgroundColor: '#00b894',
  },
  pickerText: {
    fontSize: 14,
    color: '#636e72',
  },
  selectedText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#636e72',
    marginLeft: 8,
  },
  confirm: {
    backgroundColor: '#00b894',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
