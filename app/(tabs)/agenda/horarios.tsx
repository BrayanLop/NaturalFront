import {
  citasPersonalApi,
  crearBloqueo,
  eliminarBloqueo,
  guardarHorarioEmpleado,
  listarBloqueos,
  mensajeErrorCitas,
  obtenerHorarioEmpleado,
} from '@/app/api/citasApi';
import { citasConfigurado, MENSAJE_CITAS_NO_CONFIGURADO } from '@/app/api/citasConfig';
import type { BloqueoAgenda, FranjaHorario, HorarioEmpleado } from '@/app/api/modelos/citas';
import { Icon } from '@/components/ds';
import EmptyState from '@/components/EmptyState';
import FilterChips from '@/components/FilterChips';
import FormField from '@/components/FormField';
import LoadingView from '@/components/LoadingView';
import PrimaryButton from '@/components/PrimaryButton';
import SimpleDatePicker from '@/components/SimpleDatePicker';
import { FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING, useEstilos, type Tema, useTheme } from '@/theme';
import { useAuth } from '@/context/authContext';
import { useAgendaPersonal } from '@/hooks/useAgendaPersonal';
import { useRole } from '@/hooks/useRole';
import { formatHora, hoyNegocio, normalizarHora, NOMBRES_DIA, partesIso, sumarDias, validarFranjas } from '@/utils/citas';
import { formatDate } from '@/utils/formatters';
import { showConfirm, showError, showSuccess } from '@/utils/logger';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

/** Lunes primero; `dia` sigue el contrato del backend (0 = domingo). */
const ORDEN_DIAS = [1, 2, 3, 4, 5, 6, 0];
const DIAS_BLOQUEOS = 60;

type AbrirFecha = (valor: string, titulo: string, onChange: (fecha: string) => void) => void;

/**
 * Horario semanal y bloqueos de agenda del personal. 01/03 eligen el empleado; 02 solo ve y
 * edita el suyo. Todas las horas son locales del negocio.
 */
export default function HorariosPersonal() {
  const estilos = useEstilos(crearEstilos);
  const { isDemo } = useAuth();
  const { isAdmin } = useRole();
  const agenda = useAgendaPersonal();
  const [seleccion, setSeleccion] = useState<number | null>(null);
  const [picker, setPicker] = useState<{ valor: string; titulo: string; onChange: (f: string) => void } | null>(null);

  const abrirFecha: AbrirFecha = useCallback((valor, titulo, onChange) => setPicker({ valor, titulo, onChange }), []);

  if (!citasConfigurado) return <EmptyState message="Agenda no disponible" subtitle={MENSAJE_CITAS_NO_CONFIGURADO} />;
  if (isDemo) return <EmptyState message="No disponible en modo demo" />;
  if (agenda.estado === 'cargando') return <LoadingView message="Cargando..." fullScreen />;
  if (agenda.estado !== 'ok') {
    return (
      <EmptyState
       
        message="No se pudo cargar la agenda"
        subtitle={agenda.estado === 'noActivada' ? 'La agenda de la empresa no está activada.' : agenda.error}
        actionLabel="Reintentar"
        onAction={agenda.cargar}
      />
    );
  }

  const activos = agenda.empleados.filter((e) => e.activo);
  const idEmpleado = isAdmin ? seleccion ?? agenda.miUsuarioId ?? activos[0]?.id ?? null : agenda.miUsuarioId;

  if (idEmpleado == null) {
    return (
      <EmptyState
       
        message={isAdmin ? 'No hay personal en la agenda' : 'Tu usuario no está en la agenda'}
        subtitle="Un administrador debe sincronizar el personal con Natural desde Ajustes."
      />
    );
  }

  return (
    <View style={estilos.container}>
      <ScrollView contentContainerStyle={estilos.scroll} keyboardShouldPersistTaps="handled">
        {isAdmin && (
          <FilterChips
            label="Empleado"
            options={activos.map((e) => ({ key: String(e.id), label: e.nombreUsuario }))}
            selected={String(idEmpleado)}
            onSelect={(k) => setSeleccion(Number(k))}
          />
        )}
        <EditorHorario key={`h${idEmpleado}`} usuarioId={idEmpleado} />
        <SeccionBloqueos key={`b${idEmpleado}`} usuarioId={idEmpleado} abrirFecha={abrirFecha} />
      </ScrollView>

      <SimpleDatePicker
        visible={picker !== null}
        value={picker?.valor ?? hoyNegocio()}
        title={picker?.titulo}
        onChange={(f) => picker?.onChange(f)}
        onClose={() => setPicker(null)}
      />
    </View>
  );
}

// ---------------- Horario semanal ----------------

interface FranjaEditable {
  clave: number;
  dia: number;
  inicio: string;
  fin: string;
}

function EditorHorario({ usuarioId }: { usuarioId: number }) {
  const estilos = useEstilos(crearEstilos);
  const { tema } = useTheme();
  const [franjas, setFranjas] = useState<FranjaEditable[] | null>(null);
  const [errorCarga, setErrorCarga] = useState('');
  const [errores, setErrores] = useState<Record<number, string>>({});
  const [guardando, setGuardando] = useState(false);
  const contador = useRef(0);

  const aplicar = useCallback((horario: HorarioEmpleado) => {
    setFranjas(
      horario.franjas.map((f) => ({ clave: ++contador.current, dia: f.dia, inicio: formatHora(f.horaInicio), fin: formatHora(f.horaFin) }))
    );
  }, []);

  const cargar = useCallback(async () => {
    setErrorCarga('');
    try {
      aplicar(await obtenerHorarioEmpleado(citasPersonalApi, usuarioId));
    } catch (e) {
      setFranjas([]);
      setErrorCarga(mensajeErrorCitas(e, 'No se pudo cargar el horario.'));
    }
  }, [usuarioId, aplicar]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const agregar = (dia: number) =>
    setFranjas((prev) => [...(prev ?? []), { clave: ++contador.current, dia, inicio: '', fin: '' }]);
  const quitar = (clave: number) => setFranjas((prev) => (prev ?? []).filter((f) => f.clave !== clave));
  const editar = (clave: number, campo: 'inicio' | 'fin', valor: string) =>
    setFranjas((prev) => (prev ?? []).map((f) => (f.clave === clave ? { ...f, [campo]: valor } : f)));

  const guardar = async () => {
    if (!franjas) return;
    const nuevosErrores: Record<number, string> = {};
    const validas: FranjaHorario[] = [];
    for (const f of franjas) {
      const horaInicio = normalizarHora(f.inicio);
      const horaFin = normalizarHora(f.fin);
      if (!horaInicio || !horaFin) {
        nuevosErrores[f.dia] = 'Escribe las horas en formato 24 h, por ejemplo 08:00 y 12:30.';
        continue;
      }
      validas.push({ dia: f.dia, horaInicio, horaFin });
    }
    const todos = { ...validarFranjas(validas), ...nuevosErrores };
    setErrores(todos);
    if (Object.keys(todos).length > 0) return;

    setGuardando(true);
    try {
      aplicar(await guardarHorarioEmpleado(usuarioId, validas));
      showSuccess('Horario guardado.');
    } catch (e) {
      showError(mensajeErrorCitas(e, 'No se pudo guardar el horario.'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <View style={estilos.card}>
      <Text style={estilos.titulo}>Horario semanal</Text>
      <Text style={estilos.ayuda}>
        Horas en formato 24 h (hora del negocio). Un día sin franjas significa que no atiende. Los cambios no
        afectan las citas ya agendadas.
      </Text>

      {franjas === null ? (
        <ActivityIndicator color={tema.colores.primario} style={{ marginVertical: SPACING.lg }} />
      ) : errorCarga ? (
        <>
          <Text style={estilos.error}>{errorCarga}</Text>
          <PrimaryButton title="Reintentar" variant="ghost" size="small" fullWidth={false} onPress={cargar} />
        </>
      ) : (
        <>
          {ORDEN_DIAS.map((dia) => {
            const delDia = franjas.filter((f) => f.dia === dia);
            return (
              <View key={dia} style={estilos.dia}>
                <View style={estilos.diaEncabezado}>
                  <Text style={estilos.diaNombre}>{NOMBRES_DIA[dia]}</Text>
                  <Pressable onPress={() => agregar(dia)} hitSlop={8}>
                    <Text style={estilos.enlace}>+ Agregar franja</Text>
                  </Pressable>
                </View>
                {delDia.length === 0 ? (
                  <Text style={estilos.ayuda}>No atiende</Text>
                ) : (
                  delDia.map((f) => (
                    <View key={f.clave} style={estilos.franja}>
                      <TextInput
                        style={[estilos.campo, estilos.hora]}
                        value={f.inicio}
                        onChangeText={(v) => editar(f.clave, 'inicio', v)}
                        placeholder="08:00"
                        placeholderTextColor={tema.colores.placeholder}
                        keyboardType="numbers-and-punctuation"
                        maxLength={5}
                      />
                      <Text style={estilos.ayuda}>a</Text>
                      <TextInput
                        style={[estilos.campo, estilos.hora]}
                        value={f.fin}
                        onChangeText={(v) => editar(f.clave, 'fin', v)}
                        placeholder="12:00"
                        placeholderTextColor={tema.colores.placeholder}
                        keyboardType="numbers-and-punctuation"
                        maxLength={5}
                      />
                      <Pressable onPress={() => quitar(f.clave)} hitSlop={8} accessibilityLabel="Quitar franja">
                        <Icon name="trash-outline" size={20} color={tema.colores.error} />
                      </Pressable>
                    </View>
                  ))
                )}
                {errores[dia] ? <Text style={estilos.error}>{errores[dia]}</Text> : null}
              </View>
            );
          })}
          <PrimaryButton title="Guardar horario" onPress={guardar} loading={guardando} disabled={guardando} fullWidth />
        </>
      )}
    </View>
  );
}

// ---------------- Bloqueos ----------------

function SeccionBloqueos({ usuarioId, abrirFecha }: { usuarioId: number; abrirFecha: AbrirFecha }) {
  const estilos = useEstilos(crearEstilos);
  const { tema } = useTheme();
  const [bloqueos, setBloqueos] = useState<BloqueoAgenda[] | null>(null);
  const [errorCarga, setErrorCarga] = useState('');
  const [formVisible, setFormVisible] = useState(false);
  const [fechaInicio, setFechaInicio] = useState(hoyNegocio());
  const [horaInicio, setHoraInicio] = useState('');
  const [fechaFin, setFechaFin] = useState(hoyNegocio());
  const [horaFin, setHoraFin] = useState('');
  const [motivo, setMotivo] = useState('');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    setErrorCarga('');
    try {
      const hoy = hoyNegocio();
      const lista = await listarBloqueos(usuarioId, hoy, sumarDias(hoy, DIAS_BLOQUEOS));
      setBloqueos([...lista].sort((a, b) => a.inicio.localeCompare(b.inicio)));
    } catch (e) {
      setBloqueos([]);
      setErrorCarga(mensajeErrorCitas(e, 'No se pudieron cargar los bloqueos.'));
    }
  }, [usuarioId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const crear = async () => {
    const nuevos: Record<string, string> = {};
    const hi = normalizarHora(horaInicio);
    const hf = normalizarHora(horaFin);
    if (!hi) nuevos.inicio = 'Hora de inicio en formato 24 h, por ejemplo 08:00.';
    if (!hf) nuevos.fin = 'Hora de fin en formato 24 h, por ejemplo 12:00.';
    if (fechaInicio < hoyNegocio()) nuevos.inicio = 'La fecha de inicio no puede ser anterior a hoy.';
    const inicio = `${fechaInicio}T${hi ?? ''}`;
    const fin = `${fechaFin}T${hf ?? ''}`;
    if (hi && hf && fin <= inicio) nuevos.fin = 'El fin debe ser posterior al inicio.';
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    setGuardando(true);
    try {
      // Sin offset: el backend lo interpreta en hora local del negocio.
      await crearBloqueo(usuarioId, { inicio, fin, motivo: motivo.trim() || null });
      showSuccess('Bloqueo creado.');
      setFormVisible(false);
      setHoraInicio('');
      setHoraFin('');
      setMotivo('');
      await cargar();
    } catch (e) {
      // 409: se cruza con citas activas (el detail dice cuántas).
      showError(mensajeErrorCitas(e, 'No se pudo crear el bloqueo.'), 'No se pudo bloquear');
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (b: BloqueoAgenda) => {
    if (!(await showConfirm(`¿Eliminar el bloqueo ${describirBloqueo(b)}?`, 'Eliminar bloqueo'))) return;
    setEliminando(b.idBloqueo);
    try {
      await eliminarBloqueo(usuarioId, b.idBloqueo);
      await cargar();
    } catch (e) {
      showError(mensajeErrorCitas(e, 'No se pudo eliminar el bloqueo.'));
    } finally {
      setEliminando(null);
    }
  };

  return (
    <View style={estilos.card}>
      <Text style={estilos.titulo}>Bloqueos de agenda</Text>
      <Text style={estilos.ayuda}>Espacios en los que no se pueden agendar citas (próximos {DIAS_BLOQUEOS} días).</Text>

      {bloqueos === null ? (
        <ActivityIndicator color={tema.colores.primario} style={{ marginVertical: SPACING.lg }} />
      ) : errorCarga ? (
        <>
          <Text style={estilos.error}>{errorCarga}</Text>
          <PrimaryButton title="Reintentar" variant="ghost" size="small" fullWidth={false} onPress={cargar} />
        </>
      ) : bloqueos.length === 0 ? (
        <Text style={[estilos.ayuda, { marginVertical: SPACING.md }]}>No hay bloqueos próximos.</Text>
      ) : (
        bloqueos.map((b) => (
          <View key={b.idBloqueo} style={estilos.bloqueo}>
            <View style={{ flex: 1 }}>
              <Text style={estilos.bloqueoTexto}>{describirBloqueo(b)}</Text>
              {b.motivo ? <Text style={estilos.ayuda}>{b.motivo}</Text> : null}
            </View>
            {eliminando === b.idBloqueo ? (
              <ActivityIndicator size="small" color={tema.colores.error} />
            ) : (
              <Pressable onPress={() => eliminar(b)} hitSlop={8} accessibilityLabel="Eliminar bloqueo" disabled={eliminando !== null}>
                <Icon name="trash-outline" size={20} color={tema.colores.error} />
              </Pressable>
            )}
          </View>
        ))
      )}

      {formVisible ? (
        <View style={estilos.formulario}>
          <FormField label="Desde" error={errores.inicio}>
            <View style={estilos.franja}>
              <Pressable
                style={[estilos.campo, estilos.fecha]}
                onPress={() =>
                  abrirFecha(fechaInicio, 'Fecha de inicio', (f) => {
                    setFechaInicio(f);
                    if (fechaFin < f) setFechaFin(f);
                  })
                }
              >
                <Text style={estilos.fechaTexto}>{formatDate(fechaInicio)}</Text>
                <Icon name="calendar-outline" size={18} color={tema.colores.primario} />
              </Pressable>
              <TextInput
                style={[estilos.campo, estilos.hora]}
                value={horaInicio}
                onChangeText={setHoraInicio}
                placeholder="08:00"
                placeholderTextColor={tema.colores.placeholder}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />
            </View>
          </FormField>
          <FormField label="Hasta" error={errores.fin}>
            <View style={estilos.franja}>
              <Pressable style={[estilos.campo, estilos.fecha]} onPress={() => abrirFecha(fechaFin, 'Fecha de fin', setFechaFin)}>
                <Text style={estilos.fechaTexto}>{formatDate(fechaFin)}</Text>
                <Icon name="calendar-outline" size={18} color={tema.colores.primario} />
              </Pressable>
              <TextInput
                style={[estilos.campo, estilos.hora]}
                value={horaFin}
                onChangeText={setHoraFin}
                placeholder="12:00"
                placeholderTextColor={tema.colores.placeholder}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />
            </View>
          </FormField>
          <FormField label="Motivo (opcional)">
            <TextInput
              style={estilos.campo}
              value={motivo}
              onChangeText={setMotivo}
              maxLength={200}
              placeholder="Ej: vacaciones, capacitación"
              placeholderTextColor={tema.colores.placeholder}
            />
          </FormField>
          <View style={estilos.botones}>
            <View style={{ flex: 1 }}>
              <PrimaryButton title="Cancelar" variant="ghost" onPress={() => setFormVisible(false)} disabled={guardando} />
            </View>
            <View style={{ flex: 1 }}>
              <PrimaryButton title="Bloquear" onPress={crear} loading={guardando} disabled={guardando} />
            </View>
          </View>
        </View>
      ) : (
        <PrimaryButton title="Nuevo bloqueo" variant="outline" onPress={() => setFormVisible(true)} fullWidth />
      )}
    </View>
  );
}

/** "20/10/2026 09:00 - 12:00" o "20/10/2026 09:00 - 22/10/2026 18:00" (hora del negocio, sin convertir). */
function describirBloqueo(b: BloqueoAgenda): string {
  const i = partesIso(b.inicio);
  const f = partesIso(b.fin);
  const fin = f.fecha === i.fecha ? f.hora : `${formatDate(f.fecha)} ${f.hora}`;
  return `${formatDate(i.fecha)} ${i.hora} - ${fin}`;
}

const crearEstilos = (t: Tema) => StyleSheet.create({
  campo: { minHeight: 48, borderWidth: 1, borderColor: t.colores.borde, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md, backgroundColor: t.colores.superficie, color: t.colores.texto, fontSize: FONT_SIZE.callout },
  container: { flex: 1, backgroundColor: t.colores.fondo },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.huge },
  card: {
    backgroundColor: t.colores.superficie,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: t.colores.borde,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  titulo: { fontSize: FONT_SIZE.title3, fontWeight: FONT_WEIGHT.bold, color: t.colores.texto, marginBottom: SPACING.sm },
  ayuda: { fontSize: FONT_SIZE.subhead, color: t.colores.textoSuave },
  error: { fontSize: FONT_SIZE.subhead, color: t.colores.error, marginTop: SPACING.xs },
  enlace: { fontSize: FONT_SIZE.subhead, color: t.colores.primario, fontWeight: FONT_WEIGHT.semibold },
  dia: { paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: t.colores.divisor },
  diaEncabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  diaNombre: { fontSize: FONT_SIZE.body, fontWeight: FONT_WEIGHT.semibold, color: t.colores.texto },
  franja: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  hora: { width: 80, textAlign: 'center', paddingHorizontal: SPACING.sm },
  bloqueo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: t.colores.divisor,
  },
  bloqueoTexto: { fontSize: FONT_SIZE.body, fontWeight: FONT_WEIGHT.medium, color: t.colores.texto },
  formulario: { marginTop: SPACING.lg },
  fecha: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fechaTexto: { fontSize: FONT_SIZE.body, color: t.colores.texto },
  botones: { flexDirection: 'row', gap: SPACING.md },
});
