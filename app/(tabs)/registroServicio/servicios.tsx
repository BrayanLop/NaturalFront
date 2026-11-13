import { AppText, Button, Icon } from '@/components/ds';
import { EncabezadoPaso } from '@/components/registro/EncabezadoPaso';
import { useAuth } from '@/context/authContext';
import { RADIUS, SPACING, useEstilos, useTheme, type Tema } from '@/theme';
import { formatCurrency } from '@/utils/formatters';
import { logger } from '@/utils/logger';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, View } from 'react-native';
import { api } from '../../api/api';

export default function RegistroServicio() {
  const { usuario } = useAuth();
  const [servicios, setServicios] = useState<any[]>([]);
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const router = useRouter();
  const { persona } = useLocalSearchParams();
  const estilos = useEstilos(crearEstilos);
  const { tema } = useTheme();
  const c = tema.colores;

  useEffect(() => {
    api
      .get('/Servicio/Obtener')
      .then((res) => setServicios(res.data))
      .catch((err) => logger.error('Error al cargar servicios:', err));
  }, []);

  // Los servicios marcados como "No disponible" no se pueden registrar.
  const serviciosDisponibles = useMemo(
    () => (Array.isArray(servicios) ? servicios.filter((s) => s.disponible !== false) : []),
    [servicios]
  );

  const toggleServicio = (id: string) => {
    setSeleccionados((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const continuar = () => {
    if (!persona || seleccionados.length === 0) {
      Alert.alert('Faltan datos', 'Debes seleccionar al menos un servicio');
      return;
    }

    router.push({
      pathname: '/(tabs)/registroServicio/formaPago',
      params: {
        persona: persona as string,
        servicios: JSON.stringify(seleccionados),
      },
    });
  };

  const volverAPersonas = () => {
    router.back();
  };

  const cantidad = seleccionados.length;

  return (
    <View style={estilos.pantalla}>
      <EncabezadoPaso
        title="Seleccionar servicios"
        subtitle={cantidad > 0 ? `${cantidad} seleccionado${cantidad !== 1 ? 's' : ''}` : 'Toca para elegir uno o varios'}
        onBack={volverAPersonas}
      />

      <FlatList
        data={serviciosDisponibles}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={estilos.lista}
        renderItem={({ item }) => {
          const elegido = seleccionados.includes(item.id.toString());
          return (
            <Pressable
              onPress={() => toggleServicio(item.id.toString())}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: elegido }}
              accessibilityLabel={item.nombre}
              style={({ pressed }) => [
                estilos.fila,
                elegido ? estilos.filaElegida : null,
                { opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Icon
                name={elegido ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={elegido ? c.primarioFuerte : c.bordeFuerte}
              />
              <AppText variante="etiqueta" style={estilos.nombre} numberOfLines={2}>
                {item.nombre}
              </AppText>
              {typeof item.precio === 'number' ? (
                <AppText variante="nota" tono={elegido ? 'primario' : 'suave'}>
                  {formatCurrency(item.precio)}
                </AppText>
              ) : null}
            </Pressable>
          );
        }}
      />

      <Button title="Continuar" icon="chevron-forward" onPress={continuar} style={estilos.continuar} />
    </View>
  );
}

const crearEstilos = (t: Tema) => ({
  pantalla: { flex: 1, padding: SPACING.lg, backgroundColor: t.colores.fondo },
  lista: { paddingBottom: SPACING.md },
  fila: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: SPACING.md,
    minHeight: 56,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: t.colores.borde,
    backgroundColor: t.colores.superficie,
  },
  filaElegida: { borderColor: t.colores.primarioFuerte, backgroundColor: t.colores.primarioSuave },
  nombre: { flex: 1, minWidth: 0 },
  continuar: { marginTop: SPACING.sm },
});
