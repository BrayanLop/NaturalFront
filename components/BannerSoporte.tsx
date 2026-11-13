import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '@/constants/theme';
import { useAuth } from '@/context/authContext';
import { FontAwesome5 } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Banner fijo mientras el superadmin está dentro de una empresa. Siempre deja salir. */
export default function BannerSoporte() {
  const { usuario, salirDeSoporte } = useAuth();
  const insets = useSafeAreaInsets();
  const soporte = usuario?.soporte;
  if (!soporte) return null;

  const hora = new Date(soporte.expiraEn).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={[styles.banner, { paddingBottom: SPACING.sm + insets.bottom }]}>
      <FontAwesome5 name="user-shield" size={16} color={COLORS.white} />
      <View style={styles.texto}>
        <Text style={styles.titulo} numberOfLines={1}>
          Modo soporte · {soporte.nombreEmpresa}
        </Text>
        <Text style={styles.detalle}>Vence a las {hora}</Text>
      </View>
      <Pressable style={({ pressed }) => [styles.salir, pressed && { opacity: 0.8 }]} onPress={salirDeSoporte}>
        <Text style={styles.salirTexto}>Salir</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: '#b9770e',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  texto: { flex: 1 },
  titulo: { color: COLORS.white, fontSize: FONT_SIZE.body, fontWeight: FONT_WEIGHT.semibold },
  detalle: { color: COLORS.white, fontSize: FONT_SIZE.xs, opacity: 0.9 },
  salir: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.lg },
  salirTexto: { color: '#b9770e', fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.body },
});
