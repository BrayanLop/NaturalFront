import { Button, Input, ToggleRow } from '@/components/ds';
import KeyboardAware from '@/components/KeyboardAware';
import CampoPrecio from '@/components/servicios/CampoPrecio';
import { SPACING, useEstilos, type Tema } from '@/theme';
import { logger, showError, showSuccess } from '@/utils/logger';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView } from 'react-native';
import { api } from '../../api/api';

const crearEstilos = (t: Tema) => ({
  contenedor: { padding: SPACING.lg, backgroundColor: t.colores.fondo, flexGrow: 1 },
});

export default function CrearServicio() {
  const router = useRouter();
  const estilos = useEstilos(crearEstilos);

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [disponible, setDisponible] = useState(true);
  const [loading, setLoading] = useState(false);

  const guardar = async () => {
    if (!nombre || !precio) {
      showError('Nombre y precio son requeridos', 'Campos obligatorios');
      return;
    }

    setLoading(true);
    try {
      await api.post('/Servicio/Crear', {
        nombre,
        descripcion,
        precio: parseInt(precio),
        disponible,
        fechaCreacion: new Date().toISOString(),
      });

      showSuccess('Servicio creado correctamente');
      router.back();
    } catch (error) {
      logger.error('Error al crear servicio:', error);
      showError('No se pudo crear el servicio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAware>
      <ScrollView contentContainerStyle={estilos.contenedor} keyboardShouldPersistTaps="handled">
        <Input label="Nombre" value={nombre} onChangeText={setNombre} placeholder="Nombre del servicio" />
        <Input
          label="Descripción"
          value={descripcion}
          onChangeText={setDescripcion}
          placeholder="Descripción detallada (opcional)"
          multiline
        />
        <CampoPrecio label="Precio" value={precio} onChangeText={setPrecio} placeholder="Ej: $15.000" />
        <ToggleRow
          label="Estado del servicio"
          description={disponible ? 'Visible al registrar' : 'Oculto temporalmente'}
          value={disponible}
          onValueChange={setDisponible}
        />
        <Button title="Guardar" onPress={guardar} loading={loading} />
      </ScrollView>
    </KeyboardAware>
  );
}
