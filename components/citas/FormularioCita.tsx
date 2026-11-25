import FilterChips from '@/components/FilterChips';
import FormField from '@/components/FormField';
import { Button, Icon, Input } from '@/components/ds';
import SelectorTurno, { rangoTurno, type TurnoElegido } from '@/components/citas/SelectorTurno';
import type { CrearCitaRequest, ServicioCitas, UsuarioCitas } from '@/app/api/modelos/citas';
import { FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING, useEstilos, type Tema, useTheme } from '@/theme';
import { etiquetaDia, formatDuracion, totalesServicios } from '@/utils/citas';
import { formatCurrency } from '@/utils/formatters';
import { showConfirm } from '@/utils/logger';
import type { AxiosInstance } from 'axios';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

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
  const estilos = useEstilos(crearEstilos);
  const { tema } = useTheme();
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
    <ScrollView contentContainerStyle={estilos.scroll} keyboardShouldPersistTaps="handled">
      {clientes && (
        <FormField label="Cliente" error={errores.cliente}>
          {clientes.length === 0 ? (
            <Text style={estilos.ayuda}>
              Aún no hay clientes registrados. Los clientes crean su cuenta desde la opción
              “¿Eres cliente? Agenda tu cita” de la pantalla de inicio de sesión.
            </Text>
          ) : (
            <>
              <Input
                leftIcon="search"
                placeholder="Buscar cliente por nombre"
                value={busquedaCliente}
                onChangeText={setBusquedaCliente}
                containerStyle={{ marginBottom: SPACING.sm }}
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
            <Text key={s.idServicio} style={estilos.servicioNombre}>
              {s.nombreServicio} · {formatDuracion(s.tiempoEstimado)}
            </Text>
          ))
        ) : servicios.length === 0 ? (
          <Text style={estilos.ayuda}>No hay servicios disponibles para agendar.</Text>
        ) : (
          servicios.map((s) => {
            const activo = seleccionados.includes(s.idServicio);
            return (
              <Pressable
                key={s.idServicio}
                onPress={() => alternarServicio(s.idServicio)}
                style={[estilos.servicio, activo && estilos.servicioActivo]}
              >
                <Icon
                  name={activo ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={activo ? tema.colores.primario : tema.colores.textoTenue}
                />
                <View style={{ flex: 1 }}>
                  <Text style={estilos.servicioNombre}>{s.nombreServicio}</Text>
                  <Text style={estilos.servicioDetalle}>
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
          <Text style={estilos.servicioNombre}>{empleado?.nombreUsuario ?? '-'}</Text>
        ) : empleados.length === 0 ? (
          <Text style={estilos.ayuda}>No hay personal disponible.</Text>
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
        <Input
          value={observaciones}
          onChangeText={setObservaciones}
          multiline
          maxLength={300}
          placeholder="Algo que debamos saber"
          containerStyle={{ marginBottom: 0 }}
        />
      </FormField>

      <View style={estilos.totales}>
        {turno && (
          <View style={estilos.totalFila}>
            <Text style={estilos.totalLabel}>Turno</Text>
            <Text style={estilos.totalValor}>
              {etiquetaDia(turno.fecha)} · {rangoTurno(turno)}
            </Text>
          </View>
        )}
        <View style={estilos.totalFila}>
          <Text style={estilos.totalLabel}>Duración total</Text>
          <Text style={estilos.totalValor}>{formatDuracion(turno?.duracion || totales.duracion)}</Text>
        </View>
        <View style={estilos.totalFila}>
          <Text style={estilos.totalLabel}>Valor total</Text>
          <Text style={[estilos.totalValor, { color: tema.colores.primario }]}>{formatCurrency(totales.valor)}</Text>
        </View>
      </View>

      <Button title={textoBoton} onPress={enviar} loading={enviando} disabled={enviando} fullWidth />
    </ScrollView>
  );
}

const crearEstilos = (t: Tema) => StyleSheet.create({
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.huge },
  ayuda: { fontSize: FONT_SIZE.subhead, color: t.colores.textoSuave },
  servicio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: t.colores.borde,
    borderRadius: RADIUS.md,
    backgroundColor: t.colores.superficie,
    marginBottom: SPACING.sm,
  },
  servicioActivo: { borderColor: t.colores.primario, backgroundColor: t.colores.primarioSuave },
  servicioNombre: { fontSize: FONT_SIZE.body, fontWeight: FONT_WEIGHT.semibold, color: t.colores.texto },
  servicioDetalle: { fontSize: FONT_SIZE.footnote, color: t.colores.textoSuave, marginTop: SPACING.xxs },
  totales: {
    backgroundColor: t.colores.superficie,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: t.colores.borde,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  totalFila: { flexDirection: 'row', justifyContent: 'space-between', gap: SPACING.md },
  totalLabel: { fontSize: FONT_SIZE.body, color: t.colores.textoSuave },
  totalValor: { fontSize: FONT_SIZE.headline, fontWeight: FONT_WEIGHT.bold, color: t.colores.texto, flexShrink: 1, textAlign: 'right' },
});
