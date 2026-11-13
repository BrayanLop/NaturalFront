#!/usr/bin/env node
/**
 * Guardia del sistema de diseño.
 *
 * Busca, en `app/`, `components/` y `utils/`:
 *   - colores hexadecimales escritos a mano (deben salir de `theme/tokens.ts`);
 *   - emojis (los iconos son Ionicons).
 *
 * Funciona como "trinquete": `scripts/design-baseline.json` guarda cuántas infracciones tiene cada
 * archivo hoy. El chequeo FALLA si algún archivo tiene MÁS que su base (o si aparece un archivo nuevo
 * con infracciones). Al migrar una pantalla el número baja y se actualiza la base con `--update`.
 *
 * Uso:
 *   node scripts/check-design.js            # verifica (código de salida 1 si hay regresión)
 *   node scripts/check-design.js --update   # reescribe la base con los valores actuales
 *   node scripts/check-design.js --report   # muestra los 15 archivos con más infracciones
 */
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const CARPETAS = ['app', 'components', 'utils'];
const EXTENSIONES = new Set(['.ts', '.tsx']);
// El comprobante se imprime/PDF: siempre es claro y lleva sus propios colores.
const EXCLUIDOS = new Set(['utils/comprobanteHtml.ts']);
const BASE = path.join(__dirname, 'design-baseline.json');

const RE_HEX = /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g;
const RE_EMOJI = /\p{Extended_Pictographic}/gu;

function archivos(dir) {
  const salida = [];
  for (const nombre of fs.readdirSync(dir, { withFileTypes: true })) {
    const ruta = path.join(dir, nombre.name);
    if (nombre.isDirectory()) {
      if (nombre.name === 'node_modules') continue;
      salida.push(...archivos(ruta));
    } else if (EXTENSIONES.has(path.extname(nombre.name))) {
      salida.push(ruta);
    }
  }
  return salida;
}

function contar() {
  const resultado = {};
  for (const carpeta of CARPETAS) {
    const dir = path.join(RAIZ, carpeta);
    if (!fs.existsSync(dir)) continue;
    for (const archivo of archivos(dir)) {
      const rel = path.relative(RAIZ, archivo).split(path.sep).join('/');
      if (EXCLUIDOS.has(rel)) continue;
      const texto = fs.readFileSync(archivo, 'utf8');
      const hex = (texto.match(RE_HEX) || []).length;
      const emoji = (texto.match(RE_EMOJI) || []).length;
      if (hex + emoji > 0) resultado[rel] = { hex, emoji };
    }
  }
  return resultado;
}

const actual = contar();
const total = (obj) =>
  Object.values(obj).reduce((a, v) => ({ hex: a.hex + v.hex, emoji: a.emoji + v.emoji }), { hex: 0, emoji: 0 });

if (process.argv.includes('--update')) {
  fs.writeFileSync(BASE, JSON.stringify(actual, null, 2) + '\n');
  const t = total(actual);
  console.log(`Base actualizada: ${Object.keys(actual).length} archivos, ${t.hex} colores a mano, ${t.emoji} emojis.`);
  process.exit(0);
}

if (process.argv.includes('--report')) {
  const t = total(actual);
  console.log(`Total: ${Object.keys(actual).length} archivos, ${t.hex} colores a mano, ${t.emoji} emojis.\n`);
  Object.entries(actual)
    .sort((a, b) => b[1].hex + b[1].emoji - (a[1].hex + a[1].emoji))
    .slice(0, 15)
    .forEach(([f, v]) => console.log(`${String(v.hex).padStart(4)} hex  ${String(v.emoji).padStart(3)} emoji  ${f}`));
  process.exit(0);
}

const base = fs.existsSync(BASE) ? JSON.parse(fs.readFileSync(BASE, 'utf8')) : {};
const regresiones = [];
for (const [archivo, v] of Object.entries(actual)) {
  const b = base[archivo] || { hex: 0, emoji: 0 };
  if (v.hex > b.hex) regresiones.push(`${archivo}: ${v.hex - b.hex} color(es) a mano nuevo(s) (base ${b.hex}, ahora ${v.hex})`);
  if (v.emoji > b.emoji) regresiones.push(`${archivo}: ${v.emoji - b.emoji} emoji(s) nuevo(s) (base ${b.emoji}, ahora ${v.emoji})`);
}

const t = total(actual);
const tb = total(base);
if (regresiones.length) {
  console.error('check-design: FALLA. Usa tokens de `@/theme` e iconos de `@/components/ds`:\n');
  regresiones.forEach((r) => console.error('  - ' + r));
  process.exit(1);
}
console.log(
  `check-design: OK. Colores a mano ${t.hex} (base ${tb.hex}) · emojis ${t.emoji} (base ${tb.emoji}). ` +
    (t.hex < tb.hex || t.emoji < tb.emoji ? 'Hay mejoras: corre con --update para fijar la nueva base.' : '')
);
