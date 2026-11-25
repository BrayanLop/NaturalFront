import { citasPersonalApi, esAgendaNoActivada, mensajeErrorCitas } from '@/app/api/citasApi';
import type { ResumenCambios, ResumenSincronizacion } from '@/app/api/modelos/citas';
import ActivarAgenda from '@/components/citas/ActivarAgenda';
import EmptyState from '@/components/EmptyState';
import PrimaryButton from '@/components/PrimaryButton';
import { FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING, useEstilos, type Tema } from '@/theme';
import { useRole } from '@/hooks/useRole';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

/** Ajustes de la agenda (solo 01/03): activar/renombrar y sincronizar con Natural. */
export default function AjustesAgenda() {
  const estilos = useEstilos(crearEstilos);
  const { isAdmin } = useRole();
  const router = useRouter();
  const [sincronizando, setSincronizando] = useState(false);
  const [resumen, setResumen] = useState<ResumenSincronizacion | null>(null);
  const [errorSync, setErrorSync] = useState('');

  if (!isAdmin) return <EmptyState message="Solo un administrador puede cambiar estos ajustes." />;

  const sincronizar = async () => {
    setSincronizando(true);
    setErrorSync('');
    setResumen(null);
    try {
      const { data } = await citasPersonalApi.post<ResumenSincronizacion>('/Sincronizacion/Natural');
      setResumen(data);
    } catch (e: any) {
      const status = e?.response?.status;
      if (esAgendaNoActivada(e)) {
        setErrorSync('Primero activa la agenda de la empresa.');
      } else if (status === 403) {
        setErrorSync(`Natural rechazó la sincronización. Cierra sesión y vuelve a entrar. ${mensajeErrorCitas(e, '')}`.trim());
      } else if (status === 502) {
        setErrorSync('Natural no respondió a tiempo. No se modificó nada; intenta de nuevo más tarde.');
      } else {
        setErrorSync(mensajeErrorCitas(e, 'No se pudo sincronizar.'));
      }
    } finally {
      setSincronizando(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={estilos.scroll}>
      <View style={estilos.card}>
        <Text style={estilos.titulo}>Agenda de la empresa</Text>
        <ActivarAgenda
          descripcion="Activa la agenda para que los clientes puedan encontrar tu empresa y agendar. Si ya está activa, puedes cambiar el nombre visible."
          textoBoton="Activar / actualizar agenda"
        />
      </View>

      <View style={estilos.card}>
        <Text style={estilos.titulo}>Horarios del personal</Text>
        <Text style={estilos.texto}>
          Define los días y horas en que atiende cada persona y bloquea los espacios en que no estará disponible.
        </Text>
        <PrimaryButton title="Horarios y bloqueos" variant="outline" onPress={() => router.push('/agenda/horarios')} fullWidth />
      </View>

      <View style={estilos.card}>
        <Text style={estilos.titulo}>Sincronizar con Natural</Text>
        <Text style={estilos.texto}>
          Trae los servicios y el personal de Natural. Repítelo cuando cambien en Natural. No modifica la duración
          ni la disponibilidad que ajustaste aquí.
        </Text>
        <PrimaryButton title="Sincronizar con Natural" onPress={sincronizar} loading={sincronizando} disabled={sincronizando} fullWidth />

        {errorSync ? <Text style={estilos.error}>{errorSync}</Text> : null}
        {resumen && (
          <View style={estilos.resumen}>
            <Text style={estilos.ok}>Sincronización completada</Text>
            <FilaResumen titulo="Servicios" cambios={resumen.servicios} />
            <FilaResumen titulo="Personal" cambios={resumen.personal} />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function FilaResumen({ titulo, cambios }: { titulo: string; cambios: ResumenCambios }) {
  const estilos = useEstilos(crearEstilos);
  return (
    <View style={estilos.filaResumen}>
      <Text style={estilos.subtitulo}>{titulo}</Text>
      <Text style={estilos.texto}>
        {cambios.creados} nuevos · {cambios.actualizados} actualizados · {cambios.desactivados} desactivados
      </Text>
    </View>
  );
}

const crearEstilos = (t: Tema) => StyleSheet.create({
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.huge, backgroundColor: t.colores.fondo, flexGrow: 1 },
  card: {
    backgroundColor: t.colores.superficie,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: t.colores.borde,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  titulo: { fontSize: FONT_SIZE.title3, fontWeight: FONT_WEIGHT.bold, color: t.colores.texto, marginBottom: SPACING.md },
  subtitulo: { fontSize: FONT_SIZE.body, fontWeight: FONT_WEIGHT.semibold, color: t.colores.texto },
  texto: { fontSize: FONT_SIZE.body, color: t.colores.textoSuave, marginBottom: SPACING.md },
  error: { fontSize: FONT_SIZE.body, color: t.colores.error, marginTop: SPACING.md },
  resumen: { marginTop: SPACING.lg, padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: t.colores.primarioSuave },
  ok: { fontSize: FONT_SIZE.body, fontWeight: FONT_WEIGHT.semibold, color: t.colores.primarioFuerte, marginBottom: SPACING.sm },
  filaResumen: { marginTop: SPACING.xs },
});
