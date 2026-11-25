import { citasPersonalApi, mensajeErrorCitas } from '@/app/api/citasApi';
import type { EmpresaCitas } from '@/app/api/modelos/citas';
import { Button, Input } from '@/components/ds';
import { useAuth } from '@/context/authContext';
import { FONT_SIZE, SPACING, useEstilos, type Tema } from '@/theme';
import { showError, showSuccess } from '@/utils/logger';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ActivarAgendaProps {
  /** Texto explicativo encima del formulario. */
  descripcion?: string;
  textoBoton?: string;
  onActivada?: (empresa: EmpresaCitas) => void;
}

const crearEstilos = (t: Tema) =>
  StyleSheet.create({
    descripcion: { fontSize: FONT_SIZE.callout, color: t.colores.textoSuave, marginBottom: SPACING.lg },
  });

/**
 * "Activar agenda" (POST /Empresas, solo 01/03). El código de empresa lo toma el backend del
 * token de Natural; aquí solo se envía el nombre visible (obligatorio la primera vez).
 * Repetirlo es seguro: reactiva y, si cambia, renombra.
 */
export default function ActivarAgenda({ descripcion, textoBoton = 'Activar agenda', onActivada }: ActivarAgendaProps) {
  const estilos = useEstilos(crearEstilos);
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
      {descripcion ? <Text style={estilos.descripcion}>{descripcion}</Text> : null}
      <Input
        label="Nombre visible para los clientes"
        value={nombre}
        onChangeText={setNombre}
        placeholder="Nombre de la empresa"
        maxLength={100}
      />
      <Button title={textoBoton} onPress={activar} loading={enviando} disabled={enviando} fullWidth />
    </View>
  );
}
