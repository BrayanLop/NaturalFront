import { citasPersonalApi, esAgendaNoActivada, mensajeErrorCitas } from '@/app/api/citasApi';
import type { ResumenCambios, ResumenSincronizacion } from '@/app/api/modelos/citas';
import ActivarAgenda from '@/components/citas/ActivarAgenda';
import EmptyState from '@/components/EmptyState';
import PrimaryButton from '@/components/PrimaryButton';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '@/constants/theme';
import { useRole } from '@/hooks/useRole';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

/** Ajustes de la agenda (solo 01/03): activar/renombrar y sincronizar con Natural. */
export default function AjustesAgenda() {
  const { isAdmin } = useRole();
  const [sincronizando, setSincronizando] = useState(false);
  const [resumen, setResumen] = useState<ResumenSincronizacion | null>(null);
  const [errorSync, setErrorSync] = useState('');

  if (!isAdmin) return <EmptyState icon="🔒" message="Solo un administrador puede cambiar estos ajustes." />;

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
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.card}>
        <Text style={styles.titulo}>Agenda de la empresa</Text>
        <ActivarAgenda
          descripcion="Activa la agenda para que los clientes puedan encontrar tu empresa y agendar. Si ya está activa, puedes cambiar el nombre visible."
          textoBoton="Activar / actualizar agenda"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.titulo}>Sincronizar con Natural</Text>
        <Text style={styles.texto}>
          Trae los servicios y el personal de Natural. Repítelo cuando cambien en Natural. No modifica la duración
          ni la disponibilidad que ajustaste aquí.
        </Text>
        <PrimaryButton title="Sincronizar con Natural" onPress={sincronizar} loading={sincronizando} disabled={sincronizando} fullWidth />

        {errorSync ? <Text style={styles.error}>{errorSync}</Text> : null}
        {resumen && (
          <View style={styles.resumen}>
            <Text style={styles.ok}>Sincronización completada</Text>
            <FilaResumen titulo="Servicios" cambios={resumen.servicios} />
            <FilaResumen titulo="Personal" cambios={resumen.personal} />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function FilaResumen({ titulo, cambios }: { titulo: string; cambios: ResumenCambios }) {
  return (
    <View style={styles.filaResumen}>
      <Text style={styles.subtitulo}>{titulo}</Text>
      <Text style={styles.texto}>
        {cambios.creados} nuevos · {cambios.actualizados} actualizados · {cambios.desactivados} desactivados
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.huge, backgroundColor: COLORS.background, flexGrow: 1 },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  titulo: { fontSize: FONT_SIZE.title3, fontWeight: FONT_WEIGHT.bold, color: COLORS.text, marginBottom: SPACING.md },
  subtitulo: { fontSize: FONT_SIZE.body, fontWeight: FONT_WEIGHT.semibold, color: COLORS.text },
  texto: { fontSize: FONT_SIZE.body, color: COLORS.textSecondary, marginBottom: SPACING.md },
  error: { fontSize: FONT_SIZE.body, color: COLORS.error, marginTop: SPACING.md },
  resumen: { marginTop: SPACING.lg, padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: COLORS.primarySurface },
  ok: { fontSize: FONT_SIZE.body, fontWeight: FONT_WEIGHT.semibold, color: COLORS.primaryDark, marginBottom: SPACING.sm },
  filaResumen: { marginTop: SPACING.xs },
});
