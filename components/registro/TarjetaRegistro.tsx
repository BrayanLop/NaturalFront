import { AppText, Badge, Button, Card, Chip, Divider, Icon, IconButton, type IconName } from '@/components/ds';
import { ALTURA_TACTIL, SPACING, useEstilos, useTheme, type Tema } from '@/theme';
import { ESTADO_LABEL, estadoServicio } from '@/utils/estadoServicio';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { memo, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import type { RegistroServicio } from '@/app/api/modelos/registroServicio';
import { TONO_ESTADO } from './tipos';

interface TarjetaRegistroProps {
  item: RegistroServicio;
  puedeEditar: boolean;
  confirmando: boolean;
  rechazando: boolean;
  marcandoPropina: boolean;
  editandoFormaPago: boolean;
  actualizandoFormaPago: boolean;
  onAprobar: (registro: RegistroServicio) => void;
  onRechazar: (registro: RegistroServicio) => void;
  onMarcarPropina: (registro: RegistroServicio) => void;
  onEditarFormaPago: (registro: RegistroServicio | null) => void;
  onActualizarFormaPago: (registro: RegistroServicio, formaPago: 'T' | 'E') => void;
  onVerEvidencias: (registro: RegistroServicio) => void;
  onSubirEvidencia: (registro: RegistroServicio) => void;
}

const NOMBRE_FORMA_PAGO = (formaPago?: string) =>
  formaPago === 'T' ? 'Transferencia' : formaPago === 'E' ? 'Efectivo' : 'No especificada';

const ICONO_FORMA_PAGO = (formaPago?: string): IconName =>
  formaPago === 'T' ? 'swap-horizontal-outline' : formaPago === 'E' ? 'cash-outline' : 'card-outline';

/** Tarjeta de un registro de servicio: datos, estado, forma de pago editable y acciones. */
export const TarjetaRegistro = memo(function TarjetaRegistro({
  item,
  puedeEditar,
  confirmando,
  rechazando,
  marcandoPropina,
  editandoFormaPago,
  actualizandoFormaPago,
  onAprobar,
  onRechazar,
  onMarcarPropina,
  onEditarFormaPago,
  onActualizarFormaPago,
  onVerEvidencias,
  onSubirEvidencia,
}: TarjetaRegistroProps) {
  const estilos = useEstilos(crearEstilos);
  const { tema } = useTheme();
  const c = tema.colores;

  const estado = estadoServicio(item);
  const propina = item.propina ?? 0;
  const comision = item.comision ?? 0;
  const formaPagoEditable = puedeEditar && !item.liquidado;
  const cantidadEvidencias = item.evidencias?.length ?? 0;
  const puedeSubirEvidencia = item.formaPago === 'T' && !item.liquidado;
  const pendienteDeRevision = puedeEditar && !item.confirmado && !item.liquidado && !item.rechazado;
  const ocupado = confirmando || rechazando;

  return (
    <Card style={estilos.card}>
      <View style={estilos.cabecera}>
        <AppText variante="subtitulo" style={estilos.nombre} numberOfLines={2}>
          {item.nombrePersona ?? 'N/A'}
        </AppText>
        <Badge label={ESTADO_LABEL[estado]} tone={TONO_ESTADO[estado]} />
      </View>

      <View style={estilos.detalles}>
        <Dato icon="briefcase-outline">{item.nombreServicio ?? 'N/A'}</Dato>
        <Dato icon="calendar-outline">{item.fechaServicio ? formatDate(item.fechaServicio) : 'Sin fecha'}</Dato>

        {propina > 0 ? (
          <Dato icon="gift-outline" color={c.exitoTexto}>
            <AppText variante="etiqueta" tono="exito">
              Propina: {formatCurrency(propina)}
            </AppText>
            <Badge
              label={item.propinaPagada ? 'Entregada' : 'Pendiente'}
              tone={item.propinaPagada ? 'success' : 'warning'}
              size="sm"
            />
          </Dato>
        ) : null}
        {propina > 0 && puedeEditar ? (
          <Button
            title={item.propinaPagada ? 'Marcar como pendiente' : 'Marcar propina entregada'}
            icon={item.propinaPagada ? 'arrow-undo-outline' : 'gift-outline'}
            variant="ghost"
            size="sm"
            fullWidth={false}
            loading={marcandoPropina}
            onPress={() => onMarcarPropina(item)}
            style={estilos.accionPropina}
          />
        ) : null}

        {comision > 0 ? (
          <Dato icon="pie-chart-outline">
            Comisión: {formatCurrency(comision)}
            {item.porcentajeTrabajador ? ` (${item.porcentajeTrabajador}%)` : ''}
          </Dato>
        ) : null}
        {item.observaciones ? <Dato icon="document-text-outline">{item.observaciones}</Dato> : null}
        {item.rechazado && item.motivoRechazo ? (
          <Dato icon="close-circle-outline" color={c.errorTexto}>
            <AppText variante="nota" tono="error" style={estilos.textoDato}>
              Motivo: {item.motivoRechazo}
            </AppText>
          </Dato>
        ) : null}

        {formaPagoEditable && editandoFormaPago ? (
          <View style={estilos.editarFormaPago}>
            <AppText variante="nota" tono="suave">
              Forma de pago
            </AppText>
            <View style={estilos.opcionesFormaPago}>
              <Chip
                label="Efectivo"
                icon="cash-outline"
                selected={item.formaPago === 'E'}
                onPress={() => !actualizandoFormaPago && onActualizarFormaPago(item, 'E')}
              />
              <Chip
                label="Transferencia"
                icon="swap-horizontal-outline"
                selected={item.formaPago === 'T'}
                onPress={() => !actualizandoFormaPago && onActualizarFormaPago(item, 'T')}
              />
              <IconButton
                icon="close"
                variant="ghost"
                size="sm"
                accessibilityLabel="Cancelar edición de forma de pago"
                onPress={() => onEditarFormaPago(null)}
              />
            </View>
          </View>
        ) : formaPagoEditable ? (
          <Pressable
            onPress={() => onEditarFormaPago(item)}
            accessibilityRole="button"
            accessibilityLabel={`Forma de pago: ${NOMBRE_FORMA_PAGO(item.formaPago)}. Editar`}
            style={({ pressed }) => [estilos.formaPagoEditable, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Icon name={ICONO_FORMA_PAGO(item.formaPago)} size={16} color={c.textoSuave} />
            <AppText variante="nota" tono="suave" style={estilos.textoDato}>
              {NOMBRE_FORMA_PAGO(item.formaPago)}
            </AppText>
            <Icon name="create-outline" size={16} color={c.primarioTexto} />
          </Pressable>
        ) : (
          <Dato icon={ICONO_FORMA_PAGO(item.formaPago)}>{NOMBRE_FORMA_PAGO(item.formaPago)}</Dato>
        )}
      </View>

      {cantidadEvidencias > 0 || puedeSubirEvidencia || pendienteDeRevision ? (
        <>
          <Divider style={estilos.divisor} />
          <View style={estilos.acciones}>
            <View style={estilos.accionesEvidencia}>
              {cantidadEvidencias > 0 ? (
                <Chip label={`Evidencias (${cantidadEvidencias})`} icon="image-outline" onPress={() => onVerEvidencias(item)} />
              ) : null}
              {/* Subir evidencia: solo si la forma de pago es Transferencia */}
              {puedeSubirEvidencia ? (
                <Button
                  title="Subir evidencia"
                  icon="cloud-upload-outline"
                  variant="ghost"
                  size="sm"
                  fullWidth={false}
                  onPress={() => onSubirEvidencia(item)}
                />
              ) : null}
            </View>

            {pendienteDeRevision ? (
              <View style={estilos.accionesRevision}>
                <Button
                  title="Rechazar"
                  icon="close-circle-outline"
                  variant="secondary"
                  size="sm"
                  fullWidth={false}
                  disabled={ocupado}
                  onPress={() => onRechazar(item)}
                />
                <Button
                  title="Aprobar"
                  icon="checkmark"
                  size="sm"
                  fullWidth={false}
                  loading={confirmando}
                  disabled={ocupado}
                  onPress={() => onAprobar(item)}
                />
              </View>
            ) : null}
          </View>
        </>
      ) : null}
    </Card>
  );
});

/** Fila informativa (icono + texto). No es un control. */
function Dato({ icon, color, children }: { icon: IconName; color?: string; children: ReactNode }) {
  const estilos = useEstilos(crearEstilos);
  const { tema } = useTheme();
  const esTexto = (n: ReactNode) => typeof n === 'string' || typeof n === 'number';
  const textoPlano = Array.isArray(children) ? children.every(esTexto) : esTexto(children);
  return (
    <View style={estilos.dato}>
      <View style={estilos.datoIcono}>
        <Icon name={icon} size={16} color={color ?? tema.colores.textoSuave} />
      </View>
      {textoPlano ? (
        <AppText variante="nota" tono="suave" style={estilos.textoDato}>
          {children}
        </AppText>
      ) : (
        <View style={estilos.datoContenido}>{children}</View>
      )}
    </View>
  );
}

const crearEstilos = (_t: Tema) => ({
  card: { marginBottom: SPACING.md },
  cabecera: { flexDirection: 'row' as const, alignItems: 'flex-start' as const, gap: SPACING.sm, marginBottom: SPACING.sm },
  nombre: { flex: 1, minWidth: 0 },
  detalles: { gap: SPACING.xs + 2 },
  dato: { flexDirection: 'row' as const, alignItems: 'flex-start' as const, gap: SPACING.sm },
  datoIcono: { paddingTop: 1 },
  datoContenido: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    alignItems: 'center' as const,
    gap: SPACING.sm,
  },
  textoDato: { flex: 1, minWidth: 0 },
  accionPropina: { marginLeft: SPACING.lg },
  formaPagoEditable: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: SPACING.sm,
    minHeight: ALTURA_TACTIL,
    alignSelf: 'stretch' as const,
  },
  editarFormaPago: { gap: SPACING.xs, paddingVertical: SPACING.xs },
  opcionesFormaPago: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, alignItems: 'center' as const, gap: SPACING.sm },
  divisor: { marginVertical: SPACING.md },
  acciones: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    gap: SPACING.sm,
  },
  accionesEvidencia: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: SPACING.sm },
  accionesRevision: { flexDirection: 'row' as const, gap: SPACING.sm, marginLeft: 'auto' as const },
});
