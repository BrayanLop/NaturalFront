import { FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING, useTheme } from '@/theme';
import React, { forwardRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import { Icon, type IconName } from './Icon';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: IconName;
  /** Elemento a la derecha (por ejemplo, un botón de mostrar contraseña). */
  right?: React.ReactNode;
  required?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Campo de texto único. Etiqueta arriba, borde con foco, error y ayuda debajo.
 * El campo multilínea reserva su propio espacio, por lo que no se solapa con la etiqueta siguiente.
 */
export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, helper, leftIcon, right, required, containerStyle, editable = true, multiline, onFocus, onBlur, ...resto },
  ref
) {
  const { tema } = useTheme();
  const c = tema.colores;
  const [enfocado, setEnfocado] = useState(false);

  const colorBorde = error ? c.error : enfocado ? c.primarioFuerte : c.borde;

  return (
    <View style={[estilos.contenedor, containerStyle]}>
      {label ? (
        <Text style={[estilos.etiqueta, { color: c.texto }]}>
          {label}
          {required ? <Text style={{ color: c.error }}> *</Text> : null}
        </Text>
      ) : null}

      <View
        style={[
          estilos.campo,
          {
            backgroundColor: editable ? c.superficie : c.deshabilitado,
            borderColor: colorBorde,
            borderWidth: enfocado || error ? 1.5 : 1,
            alignItems: multiline ? 'flex-start' : 'center',
            minHeight: multiline ? 96 : 48,
          },
        ]}
      >
        {leftIcon ? (
          <View style={[estilos.iconoIzq, multiline && { marginTop: SPACING.md }]}>
            <Icon name={leftIcon} size={18} color={c.textoTenue} />
          </View>
        ) : null}
        <TextInput
          ref={ref}
          {...resto}
          editable={editable}
          multiline={multiline}
          placeholderTextColor={c.placeholder}
          onFocus={(e) => {
            setEnfocado(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setEnfocado(false);
            onBlur?.(e);
          }}
          style={[
            estilos.texto,
            { color: editable ? c.texto : c.textoSuave },
            multiline && estilos.multilinea,
          ]}
        />
        {right ? <View style={estilos.derecha}>{right}</View> : null}
      </View>

      {error ? (
        <Text style={[estilos.mensaje, { color: c.errorTexto }]}>{error}</Text>
      ) : helper ? (
        <Text style={[estilos.mensaje, { color: c.textoSuave }]}>{helper}</Text>
      ) : null}
    </View>
  );
});

const estilos = StyleSheet.create({
  contenedor: { marginBottom: SPACING.lg },
  etiqueta: { fontSize: FONT_SIZE.subhead, fontWeight: FONT_WEIGHT.semibold, marginBottom: SPACING.xs + 2 },
  campo: { flexDirection: 'row', borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md },
  iconoIzq: { marginRight: SPACING.sm },
  texto: { flex: 1, minWidth: 0, fontSize: FONT_SIZE.callout, paddingVertical: SPACING.md },
  multilinea: { textAlignVertical: 'top', minHeight: 84 },
  derecha: { marginLeft: SPACING.sm },
  mensaje: { fontSize: FONT_SIZE.footnote, marginTop: SPACING.xs },
});
