import { ListRow } from '@/components/ds';
import { EncabezadoPaso } from '@/components/registro/EncabezadoPaso';
import { SPACING, useEstilos, type Tema } from '@/theme';
import { logger } from '@/utils/logger';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import { api } from '../../api/api';

export default function SeleccionarPersona() {
  const [personas, setPersonas] = useState<any[]>([]);
  const router = useRouter();
  const estilos = useEstilos(crearEstilos);

  useEffect(() => {
    api
      .get('/Persona/Obtener')
      .then((res) => setPersonas(res.data))
      .catch((err) => logger.error('Error al cargar personas:', err));
  }, []);

  const seleccionarPersona = (persona: any) => {
    router.push({
      pathname: '/(tabs)/registroServicio/servicios',
      params: { persona: persona.id.toString() },
    });
  };

  const volverAtras = () => {
    router.back();
  };

  return (
    <View style={estilos.pantalla}>
      <EncabezadoPaso title="Seleccionar persona" subtitle="¿Quién realizó el servicio?" onBack={volverAtras} />
      <FlatList
        data={personas}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ListRow
            title={[item.nombre, item.apellido].filter(Boolean).join(' ')}
            icon="person-outline"
            chevron
            onPress={() => seleccionarPersona(item)}
          />
        )}
      />
    </View>
  );
}

const crearEstilos = (t: Tema) => ({
  pantalla: { flex: 1, padding: SPACING.lg, backgroundColor: t.colores.fondo },
});
