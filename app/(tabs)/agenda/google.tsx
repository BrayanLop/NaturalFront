import { citasPersonalApi, mensajeErrorCitas } from '@/app/api/citasApi';
import type { EstadoGoogle } from '@/app/api/modelos/citas';
import { Badge, Button, Card, ConfirmDialog, EmptyState, LoadingState } from '@/components/ds';
import { useAuth } from '@/context/authContext';
import { useAgendaPersonal } from '@/hooks/useAgendaPersonal';
import { FONT_SIZE, FONT_WEIGHT, SPACING, useEstilos, type Tema } from '@/theme';
import { formatDateTime } from '@/utils/formatters';
import { showError, showSuccess } from '@/utils/logger';
import * as WebBrowser from 'expo-web-browser';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Linking, Platform, ScrollView, StyleSheet, Text } from 'react-native';

/** A dónde devuelve el backend al usuario tras el permiso (Google__RetornoApp). */
const RETORNO = 'natural://agenda/google';

const crearEstilos = (t: Tema) =>
  StyleSheet.create({
    scroll: { padding: SPACING.lg, paddingBottom: SPACING.huge, flexGrow: 1, backgroundColor: t.colores.fondo },
    titulo: { fontSize: FONT_SIZE.title3, fontWeight: FONT_WEIGHT.bold, color: t.colores.texto, marginBottom: SPACING.sm },
    texto: { fontSize: FONT_SIZE.callout, color: t.colores.textoSuave, marginBottom: SPACING.md, lineHeight: 21 },
    fila: { marginBottom: SPACING.md },
    detalle: { fontSize: FONT_SIZE.subhead, color: t.colores.textoSuave, marginTop: SPACING.xs },
    error: { fontSize: FONT_SIZE.subhead, color: t.colores.errorTexto, marginTop: SPACING.sm },
    separador: { height: SPACING.md },
  });

/**
 * Conexión del empleado con SU Google Calendar. Las citas que se agenden con él aparecen en su
 * calendario y los eventos en que esté ocupado bloquean esas horas para los clientes.
 * El permiso lo da cada persona con su cuenta de Google: nadie puede conectar el de otro.
 */
export default function GoogleCalendar() {
  const estilos = useEstilos(crearEstilos);
  const { isDemo } = useAuth();
  const agenda = useAgendaPersonal();
  const params = useLocalSearchParams<{ estado?: string; mensaje?: string }>();
  const [estado, setEstado] = useState<EstadoGoogle | null>(null);
  const [error, setError] = useState('');
  const [trabajando, setTrabajando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const { data } = await citasPersonalApi.get<EstadoGoogle>('/Google/Estado');
      setEstado(data);
      setError('');
    } catch (e) {
      setError(mensajeErrorCitas(e, 'No se pudo consultar la conexión con Google.'));
    }
  }, []);

  // Al volver del navegador (por la URL de retorno) se avisa del resultado y se recarga.
  useFocusEffect(
    useCallback(() => {
      if (params.estado === 'ok') showSuccess('Tu Google Calendar quedó conectado.');
      else if (params.estado === 'error') showError(params.mensaje || 'No se pudo conectar con Google.');
      cargar();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cargar, params.estado, params.mensaje])
  );

  const conectar = async () => {
    setTrabajando(true);
    try {
      const { data } = await citasPersonalApi.post<{ url: string }>('/Google/Conexion');
      if (Platform.OS === 'web') {
        await Linking.openURL(data.url);
        return;
      }
      const resultado = await WebBrowser.openAuthSessionAsync(data.url, RETORNO);
      if (resultado.type === 'success') {
        const url = new URL(resultado.url.replace('natural://', 'https://natural.invalid/'));
        if (url.searchParams.get('estado') === 'ok') showSuccess('Tu Google Calendar quedó conectado.');
        else showError(url.searchParams.get('mensaje') || 'No se pudo conectar con Google.');
      }
      await cargar();
    } catch (e) {
      showError(mensajeErrorCitas(e, 'No se pudo iniciar la conexión con Google.'));
    } finally {
      setTrabajando(false);
    }
  };

  const desconectar = async () => {
    setConfirmando(false);
    setTrabajando(true);
    try {
      await citasPersonalApi.delete('/Google/Conexion');
      showSuccess('Se desconectó tu Google Calendar.');
      await cargar();
    } catch (e) {
      showError(mensajeErrorCitas(e, 'No se pudo desconectar.'));
    } finally {
      setTrabajando(false);
    }
  };

  if (isDemo) return <EmptyState icon="calendar-outline" title="No disponible en modo demo" />;
  if (agenda.estado === 'cargando' || (!estado && !error)) return <LoadingState message="Consultando..." />;
  if (agenda.estado === 'noActivada') {
    return <EmptyState icon="calendar-outline" title="La agenda no está activada" subtitle="Pide a un administrador que la active." />;
  }
  if (error && !estado) {
    return <EmptyState icon="alert-circle-outline" title="No se pudo consultar" subtitle={error} actionLabel="Reintentar" onAction={cargar} />;
  }
  if (!estado?.habilitado) {
    return (
      <EmptyState
        icon="calendar-outline"
        title="Aún no disponible"
        subtitle="La conexión con Google Calendar no está activada en este servidor."
      />
    );
  }

  const revocada = estado.estado === 'Revocada';

  return (
    <ScrollView contentContainerStyle={estilos.scroll}>
      <Card>
        <Text style={estilos.titulo}>Google Calendar</Text>
        <Text style={estilos.texto}>
          Las citas que te agenden aparecerán en tu Google Calendar, y los eventos en que estés ocupado bloquearán esas horas para los
          clientes. De tus eventos solo se usa la hora; no se guardan sus títulos.
        </Text>

        {estado.conectada ? (
          <>
            <Badge label="Conectado" tone="success" />
            <Text style={estilos.detalle}>{estado.email || 'Cuenta de Google'}</Text>
            {estado.ultimaSincronizacionUtc ? (
              <Text style={estilos.detalle}>Última lectura: {formatDateTime(estado.ultimaSincronizacionUtc)}</Text>
            ) : null}
            {estado.error ? <Text style={estilos.error}>Hubo un problema reciente y se está reintentando solo.</Text> : null}
            <Text style={estilos.separador} />
            <Button title="Desconectar" variant="danger" onPress={() => setConfirmando(true)} disabled={trabajando} />
          </>
        ) : (
          <>
            {revocada ? (
              <>
                <Badge label="Hay que reconectar" tone="warning" />
                <Text style={estilos.detalle}>
                  Google ya no permite el acceso (lo retiraste o venció). Tu agenda sigue funcionando, pero no se sincroniza.
                </Text>
                <Text style={estilos.separador} />
              </>
            ) : null}
            <Button
              title={revocada ? 'Reconectar Google Calendar' : 'Conectar Google Calendar'}
              icon="logo-google"
              onPress={conectar}
              loading={trabajando}
              disabled={trabajando}
            />
          </>
        )}
      </Card>

      <ConfirmDialog
        visible={confirmando}
        title="¿Desconectar tu calendario?"
        message="Dejarán de sincronizarse tus citas y tus eventos ocupados. Los eventos que ya están en tu calendario se conservan."
        confirmLabel="Desconectar"
        destructive
        onConfirm={desconectar}
        onCancel={() => setConfirmando(false)}
      />
    </ScrollView>
  );
}
