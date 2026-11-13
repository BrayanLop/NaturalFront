# Guía de diseño de Natural

Reglas para toda pantalla y componente nuevo o migrado. Ver el catálogo en `/catalogo` (solo desarrollo).

## Reglas
1. **Sin colores a mano.** Nada de `#rrggbb` ni `COLORS.*` en pantallas: usa tokens de `@/theme`.
2. **Sin emojis.** Los iconos son **Ionicons** vía `Icon` de `@/components/ds`. Quita también los emojis metidos en textos (`💰 $ 150.000` → icono + texto).
3. **Un componente por función.** Botones = `Button`; campos = `Input`/`Select`/`Toggle`; filtros = `ChipGroup`/`FilterPanel`/`DateField`; estados = `Badge`; listas = `ListRow`; tarjetas = `Card`; confirmaciones = `ConfirmDialog`.
4. **El rojo es solo para eliminar** (`Button variant="danger"` o `"dangerSolid"`). Acciones positivas (guardar, liquidar, confirmar, continuar) van en verde (`primary`).
5. **Responsive desde 360 px.** Sin anchos fijos; usa `flex: 1` + `minWidth: 0`; las filas de chips pasan de línea (`ChipGroup`) o hacen scroll horizontal (`scroll`).
6. **Menos texto.** Títulos cortos; las explicaciones largas van en `SectionHeader ayuda="..."` (icono ⓘ).
7. **Mismo comportamiento.** Es un rediseño visual: no cambies llamadas a la API, rutas ni lógica de negocio.
8. **Táctil ≥ 44 px.** Los componentes `ds` ya lo cumplen; si creas un control propio, respétalo.
9. **Preparado para modo oscuro.** Todos los colores salen del tema (claro/oscuro).

## Patrón de estilos
```tsx
import { useEstilos, SPACING, type Tema } from '@/theme';

const crearEstilos = (t: Tema) => ({
  caja: { backgroundColor: t.colores.superficie, padding: SPACING.lg },
}); // fábrica a nivel de módulo (estable)

function Pantalla() {
  const estilos = useEstilos(crearEstilos);
  return <View style={estilos.caja} />;
}
```
Para colores sueltos: `const { tema } = useTheme(); tema.colores.primarioTexto`.
Tipografía: `FONT_SIZE`, `FONT_WEIGHT`, `RADIUS`, `SPACING` salen también de `@/theme`, o usa `AppText`.

## Tokens de color (`tema.colores`)
`fondo`, `fondoSuave`, `superficie`, `superficieElevada`, `borde`, `bordeSuave`, `bordeFuerte`, `divisor`,
`texto`, `textoSuave`, `textoTenue`, `primario` (marca/iconos/encabezado), `primarioFuerte` (fondo de botón),
`primarioTexto` (texto verde sobre superficie), `primarioSuave`, `sobrePrimario`, `exito|aviso|error|info|neutro` + `…Suave` + `…Texto`,
`deshabilitado`, `textoDeshabilitado`, `placeholder`, `overlay`, `blanco`.

## Vocabulario de iconos (usar siempre estos nombres)
| Concepto | Ionicons | Concepto | Ionicons |
|---|---|---|---|
| persona | `person-outline` | personas | `people-outline` |
| servicio | `briefcase-outline` | configuración | `settings-outline` |
| porcentaje/comisión | `pie-chart-outline` | dinero / precio | `cash-outline` |
| efectivo | `cash-outline` | transferencia | `swap-horizontal-outline` |
| tarjeta | `card-outline` | fecha | `calendar-outline` |
| hora | `time-outline` | editar | `create-outline` |
| eliminar | `trash-outline` | agregar | `add` |
| buscar | `search` | guardar | `checkmark` |
| evidencias | `image-outline` | cámara | `camera-outline` |
| galería | `images-outline` | archivo | `attach-outline` |
| subir | `cloud-upload-outline` | observaciones | `document-text-outline` |
| propina | `gift-outline` | total | `receipt-outline` |
| aprobado | `checkmark-circle-outline` | pendiente | `time-outline` |
| rechazado | `close-circle-outline` | liquidado | `checkmark-done-outline` |
| comprobante | `document-text-outline` | histórico | `archive-outline` |
| ingresos | `trending-up-outline` | egresos | `trending-down-outline` |
| consolidado | `stats-chart-outline` | filtros | `options-outline` |
| volver | `chevron-back` | siguiente | `chevron-forward` |

## Verificación (antes de dar una pantalla por terminada)
- `npx tsc --noEmit` sin errores nuevos respecto a la línea base.
- `node scripts/check-design.js --only=<ruta>` en `0 colores a mano · 0 emojis` para lo migrado.
- Revisar a 360 px de ancho en claro (y en oscuro con `/catalogo?modo=oscuro` para los componentes).
- `components/comprobanteHtml.ts` / `utils/comprobanteHtml.ts` (PDF) se queda siempre claro: no migrar.
