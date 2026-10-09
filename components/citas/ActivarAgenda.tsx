import FormField from '@/components/FormField';
import PrimaryButton from '@/components/PrimaryButton';
import { citasPersonalApi, mensajeErrorCitas } from '@/app/api/citasApi';
import type { EmpresaCitas } from '@/app/api/modelos/citas';
import { COLORS, commonStyles, FONT_SIZE, SPACING } from '@/constants/theme';
import { useAuth } from '@/context/authContext';
import { showError, showSuccess } from '@/utils/logger';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

interface ActivarAgendaProps {
  /** Texto explicativo encima del formulario. */
  descripcion?: string;
  textoBoton?: string;
  onActivada?: (empresa: EmpresaCitas) => void;
}

/**
 * "Activar agenda" (POST /Empresas, solo 01/03). El código de empresa lo toma el backend del
 * token de Natural; aquí solo se envía el nombre visible (obligatorio la primera vez).
 * Repetirlo es seguro: reactiva y, si cambia, renombra.
 */
export default function ActivarAgenda({ descripcion, textoBoton = 'Activar agenda', onActivada }: ActivarAgendaProps) {
  const { usuario } = useAuth();
  const [nombre, setNombre] = useState(usuario?.nombreEmpresa ?? '');
  const [enviando, setEnviando] = useState(false);

  const activar = async () => {
    if (!nombre.trim()) {
      showError('Escribe el nombre con el que los clientes verán la empresa.');
      return;
    }
    setEnviando(true);
    try {
      const { data } = await citasPersonalApi.post<EmpresaCitas>('/Empresas', { nombre: nombre.trim() });
      showSuccess(`La agenda de “${data.nombre}” está activa.`);
      onActivada?.(data);
    } catch (e) {
      showError(mensajeErrorCitas(e, 'No se pudo activar la agenda.'));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <View>
      {descripcion ? <Text style={styles.descripcion}>{descripcion}</Text> : null}
      <FormField label="Nombre visible para los clientes">
        <TextInput
          style={commonStyles.input}
          value={nombre}
          onChangeText={setNombre}
          placeholder="Nombre de la empresa"
          placeholderTextColor={COLORS.placeholder}
          maxLength={100}
        />
      </FormField>
      <PrimaryButton title={textoBoton} onPress={activar} loading={enviando} disabled={enviando} fullWidth />
    </View>
  );
}

const styles = StyleSheet.create({
  descripcion: { fontSize: FONT_SIZE.body, color: COLORS.textSecondary, marginBottom: SPACING.lg },
});
