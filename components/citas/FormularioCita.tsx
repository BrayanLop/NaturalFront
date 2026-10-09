import FilterChips from '@/components/FilterChips';
import FormField from '@/components/FormField';
import PrimaryButton from '@/components/PrimaryButton';
import SimpleDatePicker from '@/components/SimpleDatePicker';
import type { CrearCitaRequest, ServicioCitas, UsuarioCitas } from '@/app/api/modelos/citas';
import { COLORS, commonStyles, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '@/constants/theme';
import { formatDuracion, normalizarHora, totalesServicios } from '@/utils/citas';
import { formatCurrency, formatDate, toDateInputValue } from '@/utils/formatters';
import { FontAwesome5 } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

interface FormularioCitaProps {
  /** Servicios agendables. */
  servicios: ServicioCitas[];
  /** Empleados activos. */
  empleados: UsuarioCitas[];
  /** Solo para el personal 01/03: clientes entre los que elegir. Si se omite, la cita es del usuario actual. */
  clientes?: UsuarioCitas[];
  enviando: boolean;
  textoBoton?: string;
  onSubmit: (datos: CrearCitaRequest) => void;
}

/** Formulario de nueva cita (servicios + empleado + fecha/hora), compartido por personal y clientes. */
export default function FormularioCita({
  servicios,
  empleados,
  clientes,
  enviando,
  textoBoton = 'Agendar cita',
  onSubmit,
}: FormularioCitaProps) {
  const [idCliente, setIdCliente] = useState('');
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [idEmpleado, setIdEmpleado] = useState('');
  const [seleccionados, setSeleccionados] = useState<number[]>([]);
  const [fecha, setFecha] = useState(toDateInputValue(new Date()));
  const [hora, setHora] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});

  const elegidos = useMemo(
    () => servicios.filter((s) => seleccionados.includes(s.idServicio)),
    [servicios, seleccionados]
  );
  const totales = totalesServicios(elegidos);

  const clientesFiltrados = useMemo(() => {
    if (!clientes) return [];
    const q = busquedaCliente.trim().toLowerCase();
    const lista = q ? clientes.filter((c) => c.nombreUsuario.toLowerCase().includes(q)) : clientes;
    return lista.slice(0, 30);
  }, [clientes, busquedaCliente]);

  const alternarServicio = (id: number) =>
    setSeleccionados((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const enviar = () => {
    const nuevos: Record<string, string> = {};
    if (clientes && !idCliente) nuevos.cliente = 'Elige el cliente.';
    if (!idEmpleado) nuevos.empleado = 'Elige quién atiende la cita.';
    if (seleccionados.length === 0) nuevos.servicios = 'Elige al menos un servicio.';
    const horaNormalizada = normalizarHora(hora);
    if (!horaNormalizada) nuevos.hora = 'Escribe la hora en formato 24 h, por ejemplo 14:30.';
    if (fecha < toDateInputValue(new Date())) nuevos.fecha = 'La fecha no puede ser anterior a hoy.';
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0 || !horaNormalizada) return;

    onSubmit({
      idCliente: clientes ? Number(idCliente) : 0,
      idEmpleado: Number(idEmpleado),
      fechaCita: `${fecha}T00:00:00`,
      horaEstimadaCita: horaNormalizada,
      observaciones: observaciones.trim() || null,
      idServicios: seleccionados,
    });
  };

  return (
    <View style={{ flex: 1 }}>
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
          {servicios.length === 0 ? (
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
          {empleados.length === 0 ? (
            <Text style={styles.ayuda}>No hay personal disponible.</Text>
          ) : (
            <FilterChips
              options={empleados.map((e) => ({ key: String(e.id), label: e.nombreUsuario }))}
              selected={idEmpleado}
              onSelect={setIdEmpleado}
            />
          )}
        </FormField>

        <FormField label="Fecha" error={errores.fecha}>
          <Pressable style={[commonStyles.input, styles.fecha]} onPress={() => setPickerVisible(true)}>
            <Text style={styles.fechaTexto}>{formatDate(fecha)}</Text>
            <FontAwesome5 name="calendar-alt" size={16} color={COLORS.primary} />
          </Pressable>
        </FormField>

        <FormField label="Hora de inicio (24 h)" error={errores.hora}>
          <TextInput
            style={commonStyles.input}
            placeholder="Ej: 14:30"
            placeholderTextColor={COLORS.placeholder}
            value={hora}
            onChangeText={setHora}
            keyboardType="numbers-and-punctuation"
            maxLength={5}
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
          <View style={styles.totalFila}>
            <Text style={styles.totalLabel}>Duración total</Text>
            <Text style={styles.totalValor}>{formatDuracion(totales.duracion)}</Text>
          </View>
          <View style={styles.totalFila}>
            <Text style={styles.totalLabel}>Valor total</Text>
            <Text style={[styles.totalValor, { color: COLORS.primary }]}>{formatCurrency(totales.valor)}</Text>
          </View>
        </View>

        <PrimaryButton title={textoBoton} onPress={enviar} loading={enviando} disabled={enviando} fullWidth />
      </ScrollView>

      <SimpleDatePicker
        visible={pickerVisible}
        value={fecha}
        onChange={setFecha}
        onClose={() => setPickerVisible(false)}
        title="Fecha de la cita"
      />
    </View>
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
  fecha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fechaTexto: { fontSize: FONT_SIZE.body, color: COLORS.text },
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
  totalFila: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: FONT_SIZE.body, color: COLORS.textSecondary },
  totalValor: { fontSize: FONT_SIZE.headline, fontWeight: FONT_WEIGHT.bold, color: COLORS.text },
});
