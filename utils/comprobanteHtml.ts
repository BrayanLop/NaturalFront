import { ComprobanteLiquidacion } from '@/app/api/modelos/contabilidad';
import { formatCurrency, formatDate, formatFormaPago } from '@/utils/formatters';

// Escapa texto para insertarlo de forma segura en el HTML
function esc(valor: unknown): string {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const fecha = (valor?: string | null) => (valor ? formatDate(valor) : '—');

/** Genera el HTML imprimible (PDF) del comprobante de liquidación. */
export function generarHtmlComprobante(c: ComprobanteLiquidacion): string {
  const filasServicios = c.servicios.length
    ? c.servicios
        .map(
          (s) => `<tr>
            <td>${esc(s.nombre)}</td>
            <td class="num">${esc(s.cantidad)}</td>
            <td class="num">${esc(formatCurrency(s.valorFacturado))}</td>
            <td class="num">${esc(formatCurrency(s.comision))}</td>
          </tr>`
        )
        .join('')
    : '<tr><td colspan="4" class="vacio">Sin servicios</td></tr>';

  const filasDeducciones = c.deducciones.length
    ? c.deducciones
        .map(
          (d) => `<tr>
            <td>${esc(fecha(d.fecha))}</td>
            <td>${esc(d.motivo)}</td>
            <td>${esc(formatFormaPago(d.formaPago))}</td>
            <td class="num">${esc(formatCurrency(d.valor))}</td>
          </tr>`
        )
        .join('')
    : '<tr><td colspan="4" class="vacio">Sin deducciones</td></tr>';

  const filasPagos = c.pagos.length
    ? c.pagos
        .map(
          (p) => `<tr><td>${esc(formatFormaPago(p.formaPago))}</td><td class="num">${esc(formatCurrency(p.valor))}</td></tr>`
        )
        .join('')
    : '<tr><td colspan="2" class="vacio">Sin método de pago registrado</td></tr>';

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Comprobante de liquidación #${esc(c.idLiquidacion)}</title>
<style>
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #212529; margin: 24px; font-size: 13px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  h2 { font-size: 15px; margin: 20px 0 8px; border-bottom: 1px solid #ced4da; padding-bottom: 4px; }
  .muted { color: #6c757d; }
  .encabezado { display: flex; justify-content: space-between; gap: 16px; border-bottom: 2px solid #00b894; padding-bottom: 8px; margin-bottom: 8px; }
  .datos td { border: none; padding: 3px 8px 3px 0; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 6px 8px; border-bottom: 1px solid #e9ecef; text-align: left; }
  th { background: #f1f3f5; font-weight: 600; }
  .num { text-align: right; }
  .vacio { text-align: center; color: #6c757d; font-style: italic; }
  .totales { margin-top: 20px; border: 2px solid #00b894; border-radius: 8px; padding: 12px; }
  .totales td { border: none; padding: 4px 0; }
  .neto td { font-size: 17px; font-weight: 800; color: #00856a; border-top: 1px solid #00b894; padding-top: 8px; }
  .nota { margin-top: 12px; font-size: 11px; color: #6c757d; font-style: italic; }
</style>
</head>
<body>
  <div class="encabezado">
    <div>
      <h1>${esc(c.empresa?.nombre)} <span class="muted" style="font-size:13px;font-weight:400">· NIT ${esc(c.empresa?.nit || '—')}</span></h1>
    </div>
    <div style="text-align:right">
      <strong>Comprobante de liquidación</strong><br />
      <span class="muted">N.º ${esc(c.idLiquidacion)}</span>
    </div>
  </div>

  <table class="datos">
    <tr><td class="muted">Barbero</td><td>${esc(c.persona?.nombreCompleto)}</td><td class="muted">Cédula</td><td>${esc(c.persona?.cedula || '—')}</td></tr>
    <tr><td class="muted">Fecha de liquidación</td><td>${esc(fecha(c.fechaLiquidacion))}</td><td class="muted">Periodo</td><td>${esc(fecha(c.periodoDesde))} – ${esc(fecha(c.periodoHasta))}</td></tr>
  </table>

  <h2>Detalle por servicio</h2>
  <table>
    <tr><th>Servicio</th><th class="num">Cantidad</th><th class="num">Facturado</th><th class="num">Comisión</th></tr>
    ${filasServicios}
  </table>

  <h2>Deducciones</h2>
  <table>
    <tr><th>Fecha</th><th>Motivo</th><th>Método</th><th class="num">Valor</th></tr>
    ${filasDeducciones}
  </table>

  <div class="totales">
    <table>
      <tr><td>Total servicios</td><td class="num">${esc(c.cantidadServicios)}</td></tr>
      <tr><td>Total generado (facturado)</td><td class="num">${esc(formatCurrency(c.totalFacturado))}</td></tr>
      <tr><td>Comisión del barbero</td><td class="num">${esc(formatCurrency(c.totalComision))}</td></tr>
      <tr><td>Total deducciones</td><td class="num">- ${esc(formatCurrency(c.totalDeducciones))}</td></tr>
      <tr class="neto"><td>NETO PAGADO</td><td class="num">${esc(formatCurrency(c.netoPagado))}</td></tr>
    </table>
  </div>

  <h2>Pagos por método</h2>
  <table>${filasPagos}</table>

  ${c.esReconstruido ? '<p class="nota">Liquidación anterior: valores reconstruidos, sin método de pago registrado.</p>' : ''}
</body>
</html>`;
}
