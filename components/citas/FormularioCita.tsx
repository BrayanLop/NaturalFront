import FilterChips from '@/components/FilterChips';
import FormField from '@/components/FormField';
import PrimaryButton from '@/components/PrimaryButton';
import SelectorTurno, { rangoTurno, type TurnoElegido } from '@/components/citas/SelectorTurno';
import type { CrearCitaRequest, ServicioCitas, UsuarioCitas } from '@/app/api/modelos/citas';
import { COLORS, commonStyles, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '@/constants/theme';
import { etiquetaDia, formatDuracion, totalesServicios } from '@/utils/citas';
import { formatCurrency } from '@/utils/formatters';
import { showConfirm } from '@/utils/logger';
import { FontAwesome5 } from '@expo/vector-icons';
import type { AxiosInstance } from 'axios';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

/** Resultado de enviar: 'conflicto' (409) recarga las horas libres del día elegido. */
export type ResultadoEnvioCita = 'ok' | 'conflicto' | 'error';

interface FormularioCitaProps {
  /** Cliente HTTP (personal o cliente) con el que se consulta la disponibilidad. */
  api: AxiosInstance;
  /** Servicios que se pueden elegir. */
  servicios: ServicioCitas[];
  /** Empleados activos. */
  empleados: UsuarioCitas[];
  /** Solo para el personal 01/03 al crear: clientes entre los que elegir. Si se omite, no se pide cliente. */
  clientes?: UsuarioCitas[];
  /** Valores iniciales (reprogramar). */
  inicial?: { idEmpleado?: number; idServicios?: number[]; observaciones?: string | null };
  /** Reprogramar sin poder cambiar servicios ni empleado (cliente). */
  bloquearServiciosEmpleado?: boolean;
  textoBoton?: string;
  onSubmit: (datos: CrearCitaRequest) => Promise<ResultadoEnvioCita>;
}

/**
 * Formulario de cita (servicios + empleado + turno libre), compartido por personal y clientes
 * para crear y reprogramar. Los turnos salen de la disponibilidad del backend.
 */
export default function FormularioCita({
  api,
  servicios,
  empleados,
  clientes,
  inicial,
  bloquearServiciosEmpleado = false,
  textoBoton = 'Agendar cita',
  onSubmit,
}: FormularioCitaProps) {
  const [idCliente, setIdCliente] = useState('');
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [idEmpleado, setIdEmpleado] = useState(inicial?.idEmpleado != null ? String(inicial.idEmpleado) : '');
  const [seleccionados, setSeleccionados] = useState<number[]>(inicial?.idServicios ?? []);
  const [turno, setTurno] = useState<TurnoElegido | null>(null);
  const [recarga, setRecarga] = useState(0);
  const [observaciones, setObservaciones] = useState(inicial?.observaciones ?? '');
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});

  const elegidos = useMemo(
    () => servicios.filter((s) => seleccionados.includes(s.idServicio)),
    [servicios, seleccionados]
  );
  const totales = totalesServicios(elegidos);
  const empleado = empleados.find((e) => String(e.id) === idEmpleado);

  const clientesFiltrados = useMemo(() => {
    if (!clientes) return [];
    const q = busquedaCliente.trim().toLowerCase();
    const lista = q ? clientes.filter((c) => c.nombreUsuario.toLowerCase().includes(q)) : clientes;
    return lista.slice(0, 30);
  }, [clientes, busquedaCliente]);

  const alternarServicio = (id: number) =>
    setSeleccionados((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const enviar = async () => {
    const nuevos: Record<string, string> = {};
    if (clientes && !idCliente) nuevos.cliente = 'Elige el cliente.';
    if (!idEmpleado) nuevos.empleado = 'Elige quién atiende la cita.';
    if (seleccionados.length === 0) nuevos.servicios = 'Elige al menos un servicio.';
    if (!turno) nuevos.turno = 'Elige un día y una hora disponibles.';
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0 || !turno) return;

    const resumen =
      `${etiquetaDia(turno.fecha)} · ${rangoTurno(turno)}\n` +
      `Atiende: ${empleado?.nombreUsuario ?? '-'}\n` +
      `Duración: ${formatDuracion(turno.duracion)} · Total: ${formatCurrency(totales.valor)}`;
    if (!(await showConfirm(resumen, 'Confirmar turno'))) return;

    setEnviando(true);
    try {
      const resultado = await onSubmit({
        idCliente: clientes ? Number(idCliente) : 0,
        idEmpleado: Number(idEmpleado),
        fechaCita: turno.fecha,
        horaEstimadaCita: turno.hora,
        observaciones: observaciones.trim() || null,
        idServicios: seleccionados,
      });
      if (resultado === 'conflicto') {
        setTurno(null);
        setRecarga((r) => r + 1);
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      {clientes && (
        <FormField label="Cliente" error={errores.cliente}>
          {clientes.length === 0 ? (
            <Text style={styles.ayuda}>
              Aún no hay clientes registrados. Los clientes crean su cuenta desde la opción
              “¿Eres cliente? Agenda tu cita” de la pantalla de inicio de sesión.
            </Text>
          ) : (
            <>
              <TextInput
                style={[commonStyles.input, { marginBottom: SPACING.sm }]}
                placeholder="Buscar cliente por nombre"
                placeholderTextColor={COLORS.placeholder}
                value={busquedaCliente}
                onChangeText={setBusquedaCliente}
              />
              <FilterChips
                options={clientesFiltrados.map((c) => ({ key: String(c.id), label: c.nombreUsuario }))}
                selected={idCliente}
                onSelect={setIdCliente}
              />
            </>
          )}
        </FormField>
      )}

      <FormField label="Servicios" error={errores.servicios}>
        {bloquearServiciosEmpleado ? (
          elegidos.map((s) => (
            <Text key={s.idServicio} style={styles.servicioNombre}>
              {s.nombreServicio} · {formatDuracion(s.tiempoEstimado)}
            </Text>
          ))
        ) : servicios.length === 0 ? (
          <Text style={styles.ayuda}>No hay servicios disponibles para agendar.</Text>
        ) : (
          servicios.map((s) => {
            const activo = seleccionados.includes(s.idServicio);
            return (
              <Pressable
                key={s.idServicio}
                onPress={() => alternarServicio(s.idServicio)}
                style={[styles.servicio, activo && styles.servicioActivo]}
              >
                <FontAwesome5
                  name={activo ? 'check-square' : 'square'}
                  size={18}
                  color={activo ? COLORS.primary : COLORS.textTertiary}
                  solid={activo}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.servicioNombre}>{s.nombreServicio}</Text>
                  <Text style={styles.servicioDetalle}>
                    {formatDuracion(s.tiempoEstimado)} · {formatCurrency(s.valor)}
                  </Text>
                </View>
              </Pressable>
            );
          })
        )}
      </FormField>

      <FormField label="¿Quién atiende?" error={errores.empleado}>
        {bloquearServiciosEmpleado ? (
          <Text style={styles.servicioNombre}>{empleado?.nombreUsuario ?? '-'}</Text>
        ) : empleados.length === 0 ? (
          <Text style={styles.ayuda}>No hay personal disponible.</Text>
        ) : (
          <FilterChips
            options={empleados.map((e) => ({ key: String(e.id), label: e.nombreUsuario }))}
            selected={idEmpleado}
            onSelect={setIdEmpleado}
          />
        )}
      </FormField>

      <FormField label="Turno" error={errores.turno}>
        <SelectorTurno
          api={api}
          empleadoId={idEmpleado ? Number(idEmpleado) : null}
          idServicios={seleccionados}
          valor={turno}
          onChange={setTurno}
          recarga={recarga}
        />
      </FormField>

      <FormField label="Observaciones (opcional)">
        <TextInput
          style={[commonStyles.input, styles.multilinea]}
          value={observaciones}
          onChangeText={setObservaciones}
          multiline
          maxLength={300}
          placeholder="Algo que debamos saber"
          placeholderTextColor={COLORS.placeholder}
        />
      </FormField>

      <View style={styles.totales}>
        {turno && (
          <View style={styles.totalFila}>
            <Text style={styles.totalLabel}>Turno</Text>
            <Text style={styles.totalValor}>
              {etiquetaDia(turno.fecha)} · {rangoTurno(turno)}
            </Text>
          </View>
        )}
        <View style={styles.totalFila}>
          <Text style={styles.totalLabel}>Duración total</Text>
          <Text style={styles.totalValor}>{formatDuracion(turno?.duracion || totales.duracion)}</Text>
        </View>
        <View style={styles.totalFila}>
          <Text style={styles.totalLabel}>Valor total</Text>
          <Text style={[styles.totalValor, { color: COLORS.primary }]}>{formatCurrency(totales.valor)}</Text>
        </View>
      </View>

      <PrimaryButton title={textoBoton} onPress={enviar} loading={enviando} disabled={enviando} fullWidth />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.huge },
  ayuda: { fontSize: FONT_SIZE.subhead, color: COLORS.textSecondary },
  servicio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.sm,
  },
  servicioActivo: { borderColor: COLORS.primary, backgroundColor: COLORS.primarySurface },
  servicioNombre: { fontSize: FONT_SIZE.body, fontWeight: FONT_WEIGHT.semibold, color: COLORS.text },
  servicioDetalle: { fontSize: FONT_SIZE.footnote, color: COLORS.textSecondary, marginTop: SPACING.xxs },
  multilinea: { height: 80, paddingTop: SPACING.md, textAlignVertical: 'top' },
  totales: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  totalFila: { flexDirection: 'row', justifyContent: 'space-between', gap: SPACING.md },
  totalLabel: { fontSize: FONT_SIZE.body, color: COLORS.textSecondary },
  totalValor: { fontSize: FONT_SIZE.headline, fontWeight: FONT_WEIGHT.bold, color: COLORS.text, flexShrink: 1, textAlign: 'right' },
});
