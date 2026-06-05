import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';

/**
 * Envuelve el contenido de una pantalla con formulario para que, al abrir el
 * teclado, la vista se desplace hacia arriba y el campo enfocado quede visible
 * (en lugar de quedar tapado por el teclado).
 *
 * Uso: envolver el contenido raíz (idealmente uno que contenga un ScrollView).
 */
export default function KeyboardAware({
  children,
  offset,
}: {
  children: ReactNode;
  /** Ajuste extra (px) por encima del teclado. Útil si hay header. */
  offset?: number;
}) {
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={offset ?? (Platform.OS === 'ios' ? 90 : 0)}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
