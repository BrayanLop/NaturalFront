import { FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING, sombra, useTheme } from '@/theme';
import React, { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from './Icon';

export interface OpcionSelect<T extends string | number = string> {
  value: T;
  label: string;
}

interface SelectProps<T extends string | number = string> {
  label?: string;
  value: T | null | undefined;
  options: OpcionSelect<T>[];
  onChange: (valor: T) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

/**
 * Selector desplegable único (hoja inferior). Reemplaza los `Picker` nativos, cuyo aspecto cambia
 * entre plataformas y no se adapta al tema.
 */
export function Select<T extends string | number = string>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Seleccionar',
  error,
  disabled = false,
  required,
}: SelectProps<T>) {
  const { tema } = useTheme();
  const c = tema.colores;
  const insets = useSafeAreaInsets();
  const [abierto, setAbierto] = useState(false);
  const actual = options.find((o) => o.value === value);

  return (
    <View style={estilos.contenedor}>
      {label ? (
        <Text style={[estilos.etiqueta, { color: c.texto }]}>
          {label}
          {required ? <Text style={{ color: c.error }}> *</Text> : null}
        </Text>
      ) : null}

      <Pressable
        onPress={() => setAbierto(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label ? `${label}: ${actual?.label ?? placeholder}` : placeholder}
        style={[
          estilos.campo,
          {
            backgroundColor: disabled ? c.deshabilitado : c.superficie,
            borderColor: error ? c.error : c.borde,
            borderWidth: error ? 1.5 : 1,
          },
        ]}
      >
        <Text
          numberOfLines={1}
          style={[estilos.valor, { color: actual ? (disabled ? c.textoSuave : c.texto) : c.placeholder }]}
        >
          {actual?.label ?? placeholder}
        </Text>
        <Icon name="chevron-down" size={18} color={c.textoTenue} />
      </Pressable>
      {error ? <Text style={[estilos.mensaje, { color: c.errorTexto }]}>{error}</Text> : null}

      <Modal visible={abierto} transparent animationType="fade" onRequestClose={() => setAbierto(false)}>
        <Pressable style={[estilos.fondo, { backgroundColor: c.overlay }]} onPress={() => setAbierto(false)}>
          <Pressable
            style={[
              estilos.hoja,
              { backgroundColor: c.superficieElevada, paddingBottom: Math.max(insets.bottom, SPACING.lg) },
              sombra(tema, 'lg'),
            ]}
            onPress={() => {}}
          >
            <View style={[estilos.asa, { backgroundColor: c.bordeFuerte }]} />
            {label ? <Text style={[estilos.tituloHoja, { color: c.texto }]}>{label}</Text> : null}
            <FlatList
              data={options}
              keyExtractor={(o) => String(o.value)}
              style={estilos.lista}
              renderItem={({ item }) => {
                const seleccionado = item.value === value;
                return (
                  <Pressable
                    onPress={() => {
                      onChange(item.value);
                      setAbierto(false);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: seleccionado }}
                    style={({ pressed }) => [
                      estilos.opcion,
                      {
                        backgroundColor: seleccionado ? c.primarioSuave : pressed ? c.fondoSuave : 'transparent',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        estilos.textoOpcion,
                        {
                          color: seleccionado ? c.primarioTexto : c.texto,
                          fontWeight: seleccionado ? FONT_WEIGHT.semibold : FONT_WEIGHT.regular,
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                    {seleccionado ? <Icon name="checkmark" size={20} color={c.primarioTexto} /> : null}
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { marginBottom: SPACING.lg },
  etiqueta: { fontSize: FONT_SIZE.subhead, fontWeight: FONT_WEIGHT.semibold, marginBottom: SPACING.xs + 2 },
  campo: {
    minHeight: 48,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  valor: { flex: 1, minWidth: 0, fontSize: FONT_SIZE.callout, marginRight: SPACING.sm },
  mensaje: { fontSize: FONT_SIZE.footnote, marginTop: SPACING.xs },
  fondo: { flex: 1, justifyContent: 'flex-end' },
  hoja: { borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl, maxHeight: '70%', paddingTop: SPACING.sm },
  asa: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginBottom: SPACING.md },
  tituloHoja: {
    fontSize: FONT_SIZE.headline,
    fontWeight: FONT_WEIGHT.semibold,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.sm,
  },
  lista: { flexGrow: 0 },
  opcion: {
    minHeight: 52,
    paddingHorizontal: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textoOpcion: { flex: 1, fontSize: FONT_SIZE.callout, marginRight: SPACING.md },
});
