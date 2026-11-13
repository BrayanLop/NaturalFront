import { Button, ChipGroup, DateField, FilterPanel, type OpcionChip } from '@/components/ds';
import { SPACING } from '@/theme';
import { StyleSheet, View } from 'react-native';
import type { Persona } from '@/app/api/modelos/persona';
import type { CampoFecha, EstadoFiltro, FormaPagoFiltro } from './tipos';

const OPCIONES_ESTADO: OpcionChip[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'noConfirmados', label: 'Pendientes' },
  { key: 'confirmados', label: 'Aprobados' },
  { key: 'rechazados', label: 'Rechazados' },
  { key: 'liquidados', label: 'Liquidados' },
  { key: 'noLiquidados', label: 'No liquidados' },
];

const OPCIONES_FORMA_PAGO: OpcionChip[] = [
  { key: 'todos', label: 'Todas', icon: 'list-outline' },
  { key: 'E', label: 'Efectivo', icon: 'cash-outline' },
  { key: 'T', label: 'Transferencia', icon: 'swap-horizontal-outline' },
];

/** Cantidad de personas que se muestran como fichas en el filtro (igual que antes del rediseño). */
const MAX_PERSONAS_FILTRO = 6;

interface FiltrosRegistrosProps {
  fechaInicio: string;
  fechaFin: string;
  /** Fecha por defecto de ambos campos (hoy); sirve para contar los filtros activos. */
  fechaPorDefecto: string;
  onElegirFecha: (campo: CampoFecha) => void;
  onBuscar: () => void;
  buscando: boolean;
  /** Solo los administradores filtran por persona. */
  mostrarPersona: boolean;
  personas: Persona[];
  personaFiltro: string;
  onPersonaFiltro: (personaId: string) => void;
  estadoFiltro: EstadoFiltro;
  onEstadoFiltro: (estado: EstadoFiltro) => void;
  formaPagoFiltro: FormaPagoFiltro;
  onFormaPagoFiltro: (formaPago: FormaPagoFiltro) => void;
}

/**
 * Filtros de la lista de registros en una sola columna a ancho completo:
 * fechas (Desde/Hasta) + Buscar, y fichas de persona, estado y forma de pago.
 */
export function FiltrosRegistros({
  fechaInicio,
  fechaFin,
  fechaPorDefecto,
  onElegirFecha,
  onBuscar,
  buscando,
  mostrarPersona,
  personas,
  personaFiltro,
  onPersonaFiltro,
  estadoFiltro,
  onEstadoFiltro,
  formaPagoFiltro,
  onFormaPagoFiltro,
}: FiltrosRegistrosProps) {
  const activos = [
    fechaInicio !== fechaPorDefecto,
    fechaFin !== fechaPorDefecto,
    mostrarPersona && personaFiltro !== '',
    estadoFiltro !== 'todos',
    formaPagoFiltro !== 'todos',
  ].filter(Boolean).length;

  // "Todas" usa la clave vacía, que es el valor de "sin filtro de persona".
  const opcionesPersona: OpcionChip[] = [
    { key: '', label: 'Todas' },
    ...personas.slice(0, MAX_PERSONAS_FILTRO).map((p) => ({ key: String(p.id), label: p.nombre })),
  ];

  return (
    <View style={estilos.contenedor}>
      <FilterPanel title="Filtros" activeCount={activos}>
        <View style={estilos.fechas}>
          <DateField label="Desde" value={fechaInicio} onPress={() => onElegirFecha('inicio')} />
          <DateField label="Hasta" value={fechaFin} onPress={() => onElegirFecha('fin')} />
        </View>
        <Button title="Buscar" icon="search" onPress={onBuscar} loading={buscando} style={estilos.buscar} />

        {mostrarPersona ? (
          <ChipGroup label="Persona" scroll options={opcionesPersona} value={personaFiltro} onChange={onPersonaFiltro} />
        ) : null}
        <ChipGroup
          label="Estado"
          options={OPCIONES_ESTADO}
          value={estadoFiltro}
          onChange={(key) => onEstadoFiltro(key as EstadoFiltro)}
        />
        <ChipGroup
          label="Forma de pago"
          options={OPCIONES_FORMA_PAGO}
          value={formaPagoFiltro}
          onChange={(key) => onFormaPagoFiltro(key as FormaPagoFiltro)}
        />
      </FilterPanel>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { marginBottom: SPACING.lg },
  fechas: { flexDirection: 'row', gap: SPACING.md },
  buscar: { marginTop: SPACING.md, marginBottom: SPACING.lg },
});
