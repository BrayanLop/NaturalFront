import { Button, Icon } from '@/components/ds';
import { useAuth } from '@/context/authContext';
import { FONT_SIZE, FONT_WEIGHT, SPACING, useEstilos, useTheme, type Tema } from '@/theme';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const crearEstilos = (t: Tema) => ({
  banner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: SPACING.md,
    backgroundColor: t.colores.avisoSuave,
    borderTopWidth: 3,
    borderTopColor: t.colores.aviso,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  texto: { flex: 1, minWidth: 0 },
  titulo: { color: t.colores.avisoTexto, fontSize: FONT_SIZE.body, fontWeight: FONT_WEIGHT.semibold },
  detalle: { color: t.colores.avisoTexto, fontSize: FONT_SIZE.footnote },
});

/** Banner fijo mientras el superadmin está dentro de una empresa. Siempre deja salir. */
export default function BannerSoporte() {
  const { usuario, salirDeSoporte } = useAuth();
  const insets = useSafeAreaInsets();
  const { tema } = useTheme();
  const estilos = useEstilos(crearEstilos);
  const soporte = usuario?.soporte;
  if (!soporte) return null;

  const hora = new Date(soporte.expiraEn).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={[estilos.banner, { paddingBottom: SPACING.sm + insets.bottom }]}>
      <Icon name="shield-checkmark-outline" size={20} color={tema.colores.avisoTexto} />
      <View style={estilos.texto}>
        <Text style={estilos.titulo} numberOfLines={1}>
          Modo soporte · {soporte.nombreEmpresa}
        </Text>
        <Text style={estilos.detalle}>Vence a las {hora}</Text>
      </View>
      <Button title="Salir" size="sm" fullWidth={false} onPress={salirDeSoporte} />
    </View>
  );
}
