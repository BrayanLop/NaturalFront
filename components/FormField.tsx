import { FONT_SIZE, FONT_WEIGHT, SPACING, useEstilos, type Tema } from '@/theme';
import React, { ReactNode } from 'react';
import { Text, View } from 'react-native';

const crearEstilos = (t: Tema) => ({
  contenedor: { marginBottom: SPACING.lg },
  etiqueta: {
    fontSize: FONT_SIZE.subhead,
    fontWeight: FONT_WEIGHT.semibold,
    color: t.colores.texto,
    marginBottom: SPACING.xs + 2,
  },
  error: { fontSize: FONT_SIZE.footnote, color: t.colores.errorTexto, marginTop: SPACING.xs },
});

interface FormFieldProps {
  label: string;
  error?: string;
  children: ReactNode;
}

/** Envoltorio de etiqueta + error para controles propios (para campos de texto usa `Input` de ds). */
const FormField = React.memo(function FormField({ label, error, children }: FormFieldProps) {
  const estilos = useEstilos(crearEstilos);
  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.etiqueta}>{label}</Text>
      {children}
      {error ? <Text style={estilos.error}>{error}</Text> : null}
    </View>
  );
});

export default FormField;
