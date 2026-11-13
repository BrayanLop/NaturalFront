import { AppText, Badge, Button, Card, Divider, EmptyState, Icon, LoadingState, type IconName } from '@/components/ds';
import { useAuth } from '@/context/authContext';
import { useRole } from '@/hooks/useRole';
import { SPACING, useEstilos, useTheme, type Tema } from '@/theme';
import { generarHtmlComprobante, nombreArchivoComprobante } from '@/utils/comprobanteHtml';
import { formatCurrency, formatDate, formatFormaPago } from '@/utils/formatters';
import { logger, showError } from '@/utils/logger';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import { useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { api } from '../../../api/api';
import { ComprobanteLiquidacion } from '../../../api/modelos/contabilidad';

const fecha = (valor?: string | null) => (valor ? formatDate(valor) : '—');

export default function ComprobanteScreen() {
  const { id } = useLocalSearchParams();
  const idLiquidacion = Array.isArray(id) ? id[0] : id;
  const { usuario } = useAuth();
  const { isTrabajador } = useRole();
  const estilos = useEstilos(crearEstilos);
  const { tema } = useTheme();

  const [comprobante, setComprobante] = useState<ComprobanteLiquidacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [compartiendo, setCompartiendo] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      if (!idLiquidacion) {
        setError('Comprobante no encontrado');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<ComprobanteLiquidacion>(`Contabilidad/Comprobante/${idLiquidacion}`);
        if (res.status >= 400 || !res.data || typeof res.data !== 'object') {
          throw { response: res };
        }
        setComprobante(res.data);
      } catch (e: any) {
        logger.error('Error cargando comprobante:', e);
        const data = e?.response?.data;
        setError(typeof data === 'string' && data ? data : data?.message || 'No se pudo cargar el comprobante.');
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [idLiquidacion]);

  const [abriendo, setAbriendo] = useState(false);

  // Abre la vista previa de impresión (web: diálogo del navegador, móvil: vista previa nativa),
  // desde donde también se puede guardar como PDF.
  const verPdf = async () => {
    if (!comprobante) return;
    setAbriendo(true);
    try {
      const html = generarHtmlComprobante(comprobante);
      if (Platform.OS === 'web') {
        // En web expo-print imprime la página actual; se abre el comprobante en otra pestaña.
        // El <title> del HTML es el nombre sugerido al "Guardar como PDF".
        const ventana = window.open('', '_blank');
        if (!ventana) {
          showError('El navegador bloqueó la ventana del comprobante. Permite las ventanas emergentes e inténtalo de nuevo.');
          return;
        }
        ventana.document.write(html);
        ventana.document.close();
        ventana.focus();
        ventana.print();
      } else {
        await Print.printAsync({ html });
      }
    } catch (e) {
      logger.error('Error abriendo la vista previa del comprobante:', e);
      showError('No se pudo abrir la vista previa del comprobante.');
    } finally {
      setAbriendo(false);
    }
  };

  // Genera el archivo PDF y abre el menú de compartir del dispositivo (solo móvil)
  const compartirPdf = async () => {
    if (!comprobante) return;
    setCompartiendo(true);
    try {
      const { uri: uriTemporal } = await Print.printToFileAsync({ html: generarHtmlComprobante(comprobante) });

      // expo-print genera un nombre aleatorio: se renombra a Liquidacion_<Persona>_<fecha>.pdf
      const nombreArchivo = nombreArchivoComprobante(comprobante);
      const uri = `${FileSystem.cacheDirectory}${nombreArchivo}.pdf`;
      await FileSystem.deleteAsync(uri, { idempotent: true });
      await FileSystem.moveAsync({ from: uriTemporal, to: uri });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          UTI: 'com.adobe.pdf',
          dialogTitle: nombreArchivo,
        });
      } else {
        showError('Compartir no está disponible en este dispositivo. Usa "Ver / imprimir" para guardarlo como PDF.');
      }
    } catch (e) {
      logger.error('Error generando PDF del comprobante:', e);
      showError('No se pudo generar el PDF del comprobante.');
    } finally {
      setCompartiendo(false);
    }
  };

  const esWeb = Platform.OS === 'web';

  if (loading) return <LoadingState message="Cargando comprobante..." />;

  if (error || !comprobante) {
    return (
      <View style={estilos.contenedor}>
        <EmptyState icon="document-text-outline" title={error || 'Comprobante no encontrado'} />
      </View>
    );
  }

  // El trabajador solo puede ver sus propios comprobantes
  if (isTrabajador && usuario && comprobante.persona?.id !== usuario.id) {
    return (
      <View style={estilos.contenedor}>
        <EmptyState icon="lock-closed-outline" title="No tienes permisos para ver este comprobante" />
      </View>
    );
  }

  const c = comprobante;

  return (
    <ScrollView style={estilos.contenedor} contentContainerStyle={estilos.scroll} showsVerticalScrollIndicator={false}>
      {/* Encabezado compacto */}
      <Card>
        <View style={estilos.cabeceraFila}>
          <View style={estilos.empresaTextos}>
            <AppText variante="subtitulo" numberOfLines={2}>
              {c.empresa?.nombre || 'Empresa'}
            </AppText>
            <AppText variante="nota" tono="suave">
              NIT {c.empresa?.nit || '—'}
            </AppText>
          </View>
          <Badge label={`N.º ${c.idLiquidacion}`} tone="primary" dot={false} />
        </View>
        <Divider style={estilos.separador} />
        <View style={estilos.grid}>
          <Dato label="Barbero" valor={c.persona?.nombreCompleto ?? '—'} />
          <Dato label="Cédula" valor={c.persona?.cedula || '—'} />
          <Dato label="Fecha de liquidación" valor={fecha(c.fechaLiquidacion)} />
          <Dato label="Periodo" valor={`${fecha(c.periodoDesde)} – ${fecha(c.periodoHasta)}`} />
        </View>
        <View style={estilos.acciones}>
          <View style={estilos.accion}>
            <Button
              title={abriendo ? 'Abriendo...' : esWeb ? 'Ver / imprimir PDF' : 'Ver / imprimir'}
              onPress={verPdf}
              loading={abriendo}
              disabled={compartiendo}
              variant="secondary"
              size="sm"
              icon="eye-outline"
            />
          </View>
          {!esWeb && (
            <View style={estilos.accion}>
              <Button
                title={compartiendo ? 'Generando...' : 'Compartir PDF'}
                onPress={compartirPdf}
                loading={compartiendo}
                disabled={abriendo}
                size="sm"
                icon="share-outline"
              />
            </View>
          )}
        </View>
        {esWeb && (
          <AppText variante="nota" tono="suave" style={estilos.ayuda}>
            En el diálogo de impresión elige “Guardar como PDF” para descargarlo.
          </AppText>
        )}
      </Card>

      {/* Detalle por servicio */}
      <Card>
        <AppText variante="subtitulo" style={estilos.tituloTarjeta}>
          Detalle por servicio
        </AppText>
        {c.servicios.length === 0 ? (
          <AppText tono="suave">Sin servicios</AppText>
        ) : (
          c.servicios.map((s, i) => (
            <View key={`${s.nombre}-${i}`} style={estilos.itemFila}>
              <View style={estilos.itemTextos}>
                <AppText variante="etiqueta">{s.nombre}</AppText>
                <AppText variante="nota" tono="suave">
                  {s.cantidad} × · Facturado {formatCurrency(s.valorFacturado)}
                </AppText>
              </View>
              <AppText variante="etiqueta" tono="exito">
                {formatCurrency(s.comision)}
              </AppText>
            </View>
          ))
        )}
      </Card>

      {/* Deducciones */}
      <Card>
        <AppText variante="subtitulo" style={estilos.tituloTarjeta}>
          Deducciones
        </AppText>
        {c.deducciones.length === 0 ? (
          <AppText tono="suave">Sin deducciones</AppText>
        ) : (
          c.deducciones.map((d, i) => (
            <View key={`${d.motivo}-${i}`} style={estilos.itemFila}>
              <View style={estilos.itemTextos}>
                <AppText variante="etiqueta">{d.motivo}</AppText>
                <AppText variante="nota" tono="suave">
                  {fecha(d.fecha)} · {formatFormaPago(d.formaPago)}
                </AppText>
              </View>
              <AppText variante="etiqueta" tono="error">
                - {formatCurrency(d.valor)}
              </AppText>
            </View>
          ))
        )}
      </Card>

      {/* Totales destacados */}
      <Card variant="tinted">
        <Fila label="Total servicios" valor={String(c.cantidadServicios)} />
        <Fila label="Total generado (facturado)" valor={formatCurrency(c.totalFacturado)} />
        <Fila label="Comisión del barbero" valor={formatCurrency(c.totalComision)} />
        <Fila label="Total deducciones" valor={`- ${formatCurrency(c.totalDeducciones)}`} tonoValor="error" />
        <Divider style={estilos.separador} />
        <View style={estilos.netoFila}>
          <AppText variante="etiqueta" tono="primario" style={estilos.netoEtiqueta}>
            NETO PAGADO
          </AppText>
          <AppText variante="titulo" tono="primario" numberOfLines={1} adjustsFontSizeToFit style={estilos.netoValor}>
            {formatCurrency(c.netoPagado)}
          </AppText>
        </View>
        <Divider style={estilos.separador} />
        <AppText variante="etiqueta" style={estilos.subtituloTotales}>
          Pagos por método
        </AppText>
        {c.pagos.length === 0 ? (
          <AppText variante="nota" tono="suave">
            Sin método de pago registrado
          </AppText>
        ) : (
          c.pagos.map((p, i) => (
            <Fila
              key={`${p.formaPago}-${i}`}
              icono={p.formaPago === 'E' ? 'cash-outline' : p.formaPago === 'T' ? 'swap-horizontal-outline' : undefined}
              label={p.formaPago === 'E' ? 'Efectivo' : p.formaPago === 'T' ? 'Transferencia' : formatFormaPago(p.formaPago)}
              valor={formatCurrency(p.valor)}
            />
          ))
        )}
        {(c.totalPropinas ?? 0) > 0 && (
          <>
            <Divider style={estilos.separador} />
            <View style={estilos.propinaTitulo}>
              <Icon name="gift-outline" size={16} color={tema.colores.primarioTexto} />
              <AppText variante="etiqueta" style={estilos.propinaTexto}>
                Propinas (no incluidas en el neto)
              </AppText>
            </View>
            <Fila label="Total propinas" valor={formatCurrency(c.totalPropinas ?? 0)} />
            <Fila label="Entregadas" valor={formatCurrency(c.propinasEntregadas ?? 0)} />
            <Fila label="Pendientes de entregar" valor={formatCurrency(c.propinasPendientes ?? 0)} />
          </>
        )}
        {c.esReconstruido && (
          <AppText variante="nota" tono="suave" style={estilos.nota}>
            Liquidación anterior: valores reconstruidos, sin método de pago registrado
          </AppText>
        )}
      </Card>
    </ScrollView>
  );
}

function Dato({ label, valor }: { label: string; valor: string }) {
  const estilos = useEstilos(crearEstilos);
  return (
    <View style={estilos.dato}>
      <AppText variante="nota" tono="suave">
        {label}
      </AppText>
      <AppText variante="etiqueta">{valor}</AppText>
    </View>
  );
}

function Fila({
  label,
  valor,
  tonoValor,
  icono,
}: {
  label: string;
  valor: string;
  tonoValor?: 'error';
  icono?: IconName;
}) {
  const estilos = useEstilos(crearEstilos);
  const { tema } = useTheme();
  return (
    <View style={estilos.fila}>
      <View style={estilos.filaEtiqueta}>
        {icono ? <Icon name={icono} size={16} color={tema.colores.textoSuave} /> : null}
        <AppText tono="suave" style={icono ? estilos.filaTextoIcono : undefined}>
          {label}
        </AppText>
      </View>
      <AppText variante="etiqueta" tono={tonoValor ?? 'normal'} style={estilos.filaValor}>
        {valor}
      </AppText>
    </View>
  );
}

const crearEstilos = (t: Tema) => ({
  contenedor: { flex: 1, backgroundColor: t.colores.fondo },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.huge },
  cabeceraFila: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    justifyContent: 'space-between' as const,
  },
  empresaTextos: { flex: 1, minWidth: 0, marginRight: SPACING.md },
  separador: { marginVertical: SPACING.md },
  grid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, columnGap: SPACING.md, rowGap: SPACING.md },
  dato: { flexGrow: 1, flexBasis: '45%' as const, minWidth: 0 },
  acciones: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: SPACING.sm, marginTop: SPACING.lg },
  accion: { flexGrow: 1, flexBasis: '45%' as const, minWidth: 140 },
  ayuda: { marginTop: SPACING.sm },
  tituloTarjeta: { marginBottom: SPACING.sm },
  itemFila: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: t.colores.divisor,
  },
  itemTextos: { flex: 1, minWidth: 0, marginRight: SPACING.sm },
  fila: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: SPACING.xs,
  },
  filaEtiqueta: { flexDirection: 'row' as const, alignItems: 'center' as const, flexShrink: 1, marginRight: SPACING.md },
  filaTextoIcono: { marginLeft: SPACING.sm },
  filaValor: { textAlign: 'right' as const },
  netoFila: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const },
  netoEtiqueta: { marginRight: SPACING.md },
  netoValor: { flexShrink: 1, textAlign: 'right' as const },
  subtituloTotales: { marginBottom: SPACING.xs },
  propinaTitulo: { flexDirection: 'row' as const, alignItems: 'center' as const, marginBottom: SPACING.xs },
  propinaTexto: { marginLeft: SPACING.sm, flex: 1 },
  nota: { marginTop: SPACING.md },
});
