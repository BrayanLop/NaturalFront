import {
  AppText,
  Badge,
  Button,
  Card,
  Chip,
  ChipGroup,
  ConfirmDialog,
  DateField,
  Divider,
  FilterPanel,
  IconButton,
  Input,
  ListRow,
  PageHeader,
  SectionHeader,
  Select,
  StatCard,
  ToggleRow,
} from '@/components/ds';
import { SPACING, ThemeOverride, useTheme, type ModoTema } from '@/theme';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

/**
 * Catálogo de componentes del sistema de diseño (solo en desarrollo).
 * Muestra cada pieza en tema claro y oscuro, para revisarlas juntas y a 360 px de ancho.
 * Ruta: /catalogo
 */
function Muestra({ modo }: { modo: ModoTema }) {
  const { tema } = useTheme();
  const c = tema.colores;
  const [chip, setChip] = useState('todas');
  const [estado, setEstado] = useState('todos');
  const [persona, setPersona] = useState<string | null>(null);
  const [activo, setActivo] = useState(true);
  const [dialogo, setDialogo] = useState<null | 'normal' | 'destructivo'>(null);

  return (
    <View style={{ backgroundColor: c.fondo, padding: SPACING.lg, paddingBottom: SPACING.huge }}>
      <AppText variante="titulo">Catálogo · {modo === 'claro' ? 'tema claro' : 'tema oscuro'}</AppText>
      <AppText tono="suave" style={{ marginBottom: SPACING.lg }}>
        Todas las piezas leen los mismos tokens.
      </AppText>

      <SectionHeader title="Botones" icon="finger-print-outline" />
      <Button title="Guardar cambios" onPress={() => {}} />
      <View style={{ height: SPACING.sm }} />
      <Button title="Buscar" icon="search" onPress={() => {}} />
      <View style={{ height: SPACING.sm }} />
      <Button title="Cancelar" variant="secondary" onPress={() => {}} />
      <View style={{ height: SPACING.sm }} />
      <Button title="Ver más" variant="ghost" onPress={() => {}} />
      <View style={{ height: SPACING.sm }} />
      <Button title="Eliminar servicio" variant="danger" icon="trash-outline" onPress={() => {}} />
      <View style={{ height: SPACING.sm }} />
      <Button title="Sí, eliminar" variant="dangerSolid" onPress={() => {}} />
      <View style={{ height: SPACING.sm }} />
      <Button title="Cargando" loading onPress={() => {}} />
      <View style={{ height: SPACING.sm }} />
      <Button title="Deshabilitado" disabled onPress={() => {}} />
      <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md, alignItems: 'center' }}>
        <Button title="Pequeño" size="sm" fullWidth={false} onPress={() => {}} />
        <IconButton icon="add" variant="solid" accessibilityLabel="Agregar" onPress={() => {}} />
        <IconButton icon="create-outline" variant="soft" accessibilityLabel="Editar" onPress={() => {}} />
        <IconButton icon="trash-outline" variant="danger" accessibilityLabel="Eliminar" onPress={() => {}} />
      </View>

      <SectionHeader title="Campos" icon="create-outline" style={{ marginTop: SPACING.xl }} />
      <Input label="Nombre" placeholder="Ej. Corte de cabello" leftIcon="person-outline" />
      <Input label="Celular" value="3024315253" onChangeText={() => {}} keyboardType="phone-pad" />
      <Input label="Correo" value="correo@invalido" onChangeText={() => {}} error="Escribe un correo válido" />
      <Input label="Porcentaje trabajador" value="40" editable={false} helper="Se calcula automáticamente" />
      <Input label="Descripción" placeholder="Descripción detallada (opcional)" multiline />
      <Input label="Precio" value="$6.000" onChangeText={() => {}} />
      <Select
        label="Servicio"
        placeholder="Seleccionar servicio"
        value={persona}
        onChange={setPersona}
        options={[
          { value: 'a', label: 'Mantenimiento básico' },
          { value: 'b', label: 'Corte de cabello' },
          { value: 'c', label: 'Manicure' },
        ]}
      />
      <ToggleRow
        label="Estado del servicio"
        description={activo ? 'Visible al registrar' : 'Oculto temporalmente'}
        value={activo}
        onValueChange={setActivo}
      />

      <SectionHeader
        title="Filtros"
        icon="options-outline"
        ayuda="Los chips se ajustan al ancho disponible; si hay muchas opciones, pasan a la línea siguiente."
        style={{ marginTop: SPACING.lg }}
      />
      <ChipGroup
        label="Estado"
        value={estado}
        onChange={setEstado}
        options={[
          { key: 'todos', label: 'Todos' },
          { key: 'pendientes', label: 'Pendientes' },
          { key: 'aprobados', label: 'Aprobados' },
          { key: 'rechazados', label: 'Rechazados' },
          { key: 'liquidados', label: 'Liquidados' },
          { key: 'noliquidados', label: 'No liquidados' },
        ]}
      />
      <ChipGroup
        label="Forma de pago"
        value={chip}
        onChange={setChip}
        options={[
          { key: 'todas', label: 'Todas', icon: 'list-outline' },
          { key: 'efectivo', label: 'Efectivo', icon: 'cash-outline' },
          { key: 'transferencia', label: 'Transferencia', icon: 'swap-horizontal-outline' },
        ]}
      />
      <FilterPanel title="Filtros" activeCount={2}>
        <View style={{ flexDirection: 'row', gap: SPACING.md }}>
          <DateField label="Desde" value="2026-11-13" onPress={() => {}} />
          <DateField label="Hasta" value="2026-11-13" onPress={() => {}} />
        </View>
        <View style={{ height: SPACING.md }} />
        <Button title="Buscar" icon="search" onPress={() => {}} />
      </FilterPanel>
      <Chip label="Ficha suelta" onPress={() => {}} />

      <SectionHeader title="Estados" icon="pricetag-outline" style={{ marginTop: SPACING.xl }} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
        <Badge label="Disponible" tone="success" />
        <Badge label="Pendiente" tone="warning" />
        <Badge label="Rechazado" tone="error" />
        <Badge label="Liquidado" tone="info" />
        <Badge label="No disponible" tone="neutral" />
        <Badge label="3 activos" tone="primary" dot={false} />
      </View>

      <SectionHeader title="Tarjetas y listas" icon="albums-outline" style={{ marginTop: SPACING.xl }} />
      <PageHeader
        title="Servicios"
        subtitle="11 servicios · 7 disponibles"
        action={{ icon: 'add', onPress: () => {}, label: 'Agregar servicio' }}
      />
      <ListRow
        title="Mantenimiento básico"
        subtitle="$ 150.000"
        icon="construct-outline"
        badge={<Badge label="Disponible" tone="success" size="sm" />}
        chevron
        onPress={() => {}}
      />
      <ListRow
        title="Cejas"
        subtitle="$ 6.000"
        icon="sparkles-outline"
        badge={<Badge label="No disponible" tone="neutral" size="sm" />}
        chevron
        onPress={() => {}}
      />
      <Card>
        <AppText variante="subtitulo">Tarjeta</AppText>
        <AppText tono="suave">Superficie con borde y sombra fina.</AppText>
        <Divider style={{ marginVertical: SPACING.md }} />
        <AppText variante="nota" tono="tenue">
          Texto de nota
        </AppText>
      </Card>
      <Card variant="tinted">
        <AppText variante="etiqueta" tono="primario">
          Total a pagar
        </AppText>
        <AppText variante="numero" tono="primario">
          $ 66.000
        </AppText>
      </Card>

      <SectionHeader title="Indicadores" icon="stats-chart-outline" style={{ marginTop: SPACING.xl }} />
      <View style={{ flexDirection: 'row', gap: SPACING.md }}>
        <StatCard style={{ flex: 1 }} label="Ingresos" value="$ 72.000" icon="arrow-up" tone="success" />
        <StatCard style={{ flex: 1 }} label="Gastos" value="$ 0" icon="arrow-down" tone="error" />
      </View>
      <View style={{ height: SPACING.md }} />
      <StatCard variant="solid" icon="wallet-outline" label="Utilidad neta" value="$ 36.000" hint="Ingresos menos gastos" />

      <SectionHeader title="Diálogos" icon="chatbox-ellipses-outline" style={{ marginTop: SPACING.xl }} />
      <Button title="Confirmar acción" variant="secondary" onPress={() => setDialogo('normal')} />
      <View style={{ height: SPACING.sm }} />
      <Button title="Eliminar elemento" variant="danger" icon="trash-outline" onPress={() => setDialogo('destructivo')} />
      <ConfirmDialog
        visible={dialogo === 'normal'}
        title="¿Liquidar pago?"
        message="Se registrará el pago de $ 36.000."
        confirmLabel="Liquidar"
        onConfirm={() => setDialogo(null)}
        onCancel={() => setDialogo(null)}
      />
      <ConfirmDialog
        visible={dialogo === 'destructivo'}
        title="¿Eliminar servicio?"
        message="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        onConfirm={() => setDialogo(null)}
        onCancel={() => setDialogo(null)}
      />
    </View>
  );
}

export default function Catalogo() {
  // `?modo=claro` o `?modo=oscuro` muestra solo uno (útil para capturas).
  const { modo } = useLocalSearchParams<{ modo?: string }>();
  if (!__DEV__) return null;
  return (
    <ScrollView>
      {modo !== 'oscuro' ? (
        <ThemeOverride modo="claro">
          <Muestra modo="claro" />
        </ThemeOverride>
      ) : null}
      {modo !== 'claro' ? (
        <ThemeOverride modo="oscuro">
          <Muestra modo="oscuro" />
        </ThemeOverride>
      ) : null}
    </ScrollView>
  );
}
