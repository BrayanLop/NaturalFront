import { Icon } from '@/components/ds';
import { FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING, useTheme } from '@/theme';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaskedTextInput } from 'react-native-mask-text';

interface CampoPrecioProps {
  label: string;
  /** Valor sin máscara (solo dígitos). */
  value: string;
  onChangeText: (sinMascara: string) => void;
  error?: string;
  placeholder?: string;
}

/**
 * Campo de precio con máscara de moneda. Mismo aspecto que `Input` de ds
 * (el `Input` no admite el componente con máscara).
 */
export default function CampoPrecio({ label, value, onChangeText, error, placeholder }: CampoPrecioProps) {
  const { tema } = useTheme();
  const c = tema.colores;
  const [enfocado, setEnfocado] = useState(false);
  const colorBorde = error ? c.error : enfocado ? c.primarioFuerte : c.borde;

  return (
    <View style={estilos.contenedor}>
      <Text style={[estilos.etiqueta, { color: c.texto }]}>{label}</Text>
      <View
        style={[
          estilos.campo,
          { backgroundColor: c.superficie, borderColor: colorBorde, borderWidth: enfocado || error ? 1.5 : 1 },
        ]}
      >
        <View style={estilos.icono}>
          <Icon name="cash-outline" size={18} color={c.textoTenue} />
        </View>
        <MaskedTextInput
          type="currency"
          options={{ prefix: '$', decimalSeparator: ',', groupSeparator: '.', precision: 0 }}
          value={value}
          onChangeText={(_, sinMascara) => onChangeText(sinMascara)}
          onFocus={() => setEnfocado(true)}
          onBlur={() => setEnfocado(false)}
          keyboardType="numeric"
          placeholder={placeholder}
          placeholderTextColor={c.placeholder}
          style={[estilos.texto, { color: c.texto }]}
        />
      </View>
      {error ? <Text style={[estilos.mensaje, { color: c.errorTexto }]}>{error}</Text> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { marginBottom: SPACING.lg },
  etiqueta: { fontSize: FONT_SIZE.subhead, fontWeight: FONT_WEIGHT.semibold, marginBottom: SPACING.xs + 2 },
  campo: { flexDirection: 'row', alignItems: 'center', minHeight: 48, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md },
  icono: { marginRight: SPACING.sm },
  texto: { flex: 1, minWidth: 0, fontSize: FONT_SIZE.callout, paddingVertical: SPACING.md },
  mensaje: { fontSize: FONT_SIZE.footnote, marginTop: SPACING.xs },
});
