import { StyleSheet } from 'react-native';

/**
 * Sistema de Diseño Profesional - NaturalFront
 * 
 * Este archivo define todos los tokens de diseño de la aplicación.
 * Inspirado en Material Design 3 y Apple Human Interface Guidelines.
 */

// =============================================================================
// PALETA DE COLORES - Basada en verde esmeralda con acentos complementarios
// =============================================================================

export const COLORS = {
  // Colores primarios
  primary: '#00b894',
  primaryLight: '#55efc4',
  primaryDark: '#00856a',
  primarySurface: 'rgba(0, 184, 148, 0.08)',
  primaryBorder: 'rgba(0, 184, 148, 0.3)',

  // Colores secundarios (azul)
  secondary: '#0984e3',
  secondaryLight: '#74b9ff',
  secondaryDark: '#0652a3',
  secondarySurface: 'rgba(9, 132, 227, 0.08)',

  // Colores de fondo
  background: '#f8f9fa',
  backgroundSecondary: '#f1f3f5',
  surface: '#ffffff',
  surfaceElevated: '#ffffff',
  
  // Colores para tarjetas
  cardBackground: '#ffffff',
  cardBackgroundHover: '#f8f9fa',
  
  // Bordes
  border: '#e9ecef',
  borderLight: '#f1f3f5',
  borderMedium: '#ced4da',
  borderDark: '#adb5bd',
  divider: 'rgba(0, 0, 0, 0.06)',

  // Texto
  text: '#212529',
  textSecondary: '#6c757d',
  textTertiary: '#adb5bd',
  textLight: '#868e96',
  textInverse: '#ffffff',

  // Estados
  error: '#e74c3c',
  errorLight: '#fee2e2',
  errorDark: '#c0392b',
  success: '#00b894',
  successLight: '#d4edda',
  successDark: '#00856a',
  warning: '#f39c12',
  warningLight: '#fff3cd',
  warningDark: '#c87f0a',
  info: '#3498db',
  infoLight: '#d1ecf1',
  infoDark: '#217dbb',

  // Utilidades
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  disabled: '#e9ecef',
  disabledText: '#adb5bd',
  placeholder: '#868e96',
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',

  // Gradientes (para usar con LinearGradient)
  gradientPrimary: ['#00b894', '#00856a'],
  gradientSecondary: ['#0984e3', '#0652a3'],
  gradientSurface: ['#ffffff', '#f8f9fa'],
};

// =============================================================================
// ESPACIADOS - Sistema de 4pt grid
// =============================================================================

export const SPACING = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  massive: 48,
};

// =============================================================================
// RADIOS DE BORDE
// =============================================================================

export const RADIUS = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  round: 100,
  full: 9999,
};

// =============================================================================
// TIPOGRAFÍA
// =============================================================================

export const FONT_SIZE = {
  caption: 11,
  footnote: 12,
  xs: 11,
  sm: 12,
  subhead: 13,
  body: 14,
  md: 14,
  callout: 15,
  headline: 16,
  lg: 16,
  title3: 18,
  xl: 18,
  title2: 20,
  xxl: 20,
  title1: 24,
  largeTitle: 28,
  display: 32,
};

export const FONT_WEIGHT = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
};

export const LINE_HEIGHT = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
};

// =============================================================================
// SOMBRAS - Elevaciones para profundidad visual
// =============================================================================

export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  // Sombra especial para elementos primarios
  primary: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
};

// =============================================================================
// ANIMACIONES - Duraciones y easings
// =============================================================================

export const ANIMATION = {
  duration: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 500,
  },
};

// =============================================================================
// LAYOUT
// =============================================================================

export const LAYOUT = {
  screenPadding: SPACING.xl,
  cardPadding: SPACING.lg,
  listItemSpacing: SPACING.md,
  sectionSpacing: SPACING.xxl,
  inputHeight: 48,
  buttonHeight: 52,
  iconSize: {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 28,
    xxl: 32,
  },
  avatarSize: {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 56,
    xl: 80,
  },
};

// =============================================================================
// ESTILOS COMUNES REUTILIZABLES
// =============================================================================

export const commonStyles = StyleSheet.create({
  // ===== CONTENEDORES =====
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  containerPadded: {
    flex: 1,
    padding: LAYOUT.screenPadding,
    backgroundColor: COLORS.background,
  },
  
  scrollContainer: {
    flexGrow: 1,
    padding: LAYOUT.screenPadding,
    backgroundColor: COLORS.background,
  },
  
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ===== CARDS =====
  card: {
    backgroundColor: COLORS.cardBackground,
    padding: LAYOUT.cardPadding,
    borderRadius: RADIUS.lg,
    ...SHADOWS.sm,
  },

  cardElevated: {
    backgroundColor: COLORS.cardBackground,
    padding: LAYOUT.cardPadding,
    borderRadius: RADIUS.lg,
    ...SHADOWS.md,
  },

  cardOutline: {
    backgroundColor: COLORS.cardBackground,
    padding: LAYOUT.cardPadding,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  cardPressed: {
    backgroundColor: COLORS.cardBackgroundHover,
  },

  // ===== CAMPOS DE FORMULARIO =====
  fieldContainer: {
    marginBottom: SPACING.lg,
  },

  label: {
    fontSize: FONT_SIZE.subhead,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    letterSpacing: 0.3,
  },

  input: {
    height: LAYOUT.inputHeight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.surface,
    fontSize: FONT_SIZE.body,
    color: COLORS.text,
  },

  inputFocused: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },

  inputError: {
    borderColor: COLORS.error,
    borderWidth: 1,
    backgroundColor: COLORS.errorLight,
  },

  inputDisabled: {
    backgroundColor: COLORS.disabled,
    color: COLORS.disabledText,
  },
  
  inputMultiline: {
    height: 'auto' as any,
    minHeight: 100,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    textAlignVertical: 'top',
  },

  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZE.footnote,
    marginTop: SPACING.xs,
    fontWeight: FONT_WEIGHT.medium,
  },

  helperText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.footnote,
    marginTop: SPACING.xs,
  },

  // ===== BOTONES =====
  button: {
    height: LAYOUT.buttonHeight,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    ...SHADOWS.sm,
  },

  buttonPrimary: {
    height: LAYOUT.buttonHeight,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    ...SHADOWS.primary,
  },

  buttonSecondary: {
    height: LAYOUT.buttonHeight,
    backgroundColor: COLORS.secondary,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    ...SHADOWS.sm,
  },

  buttonDanger: {
    height: LAYOUT.buttonHeight,
    backgroundColor: COLORS.error,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    ...SHADOWS.sm,
  },

  buttonOutline: {
    height: LAYOUT.buttonHeight,
    backgroundColor: COLORS.transparent,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },

  buttonGhost: {
    height: LAYOUT.buttonHeight,
    backgroundColor: COLORS.transparent,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },

  buttonSmall: {
    height: 36,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
  },

  buttonText: {
    color: COLORS.textInverse,
    fontWeight: FONT_WEIGHT.semibold,
    fontSize: FONT_SIZE.headline,
    letterSpacing: 0.5,
  },

  buttonTextOutline: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.semibold,
    fontSize: FONT_SIZE.headline,
  },

  buttonTextGhost: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.semibold,
    fontSize: FONT_SIZE.body,
  },

  buttonDisabled: {
    backgroundColor: COLORS.disabled,
    ...SHADOWS.none,
  },

  buttonDisabledText: {
    color: COLORS.disabledText,
  },

  // ===== TEXTOS =====
  title: {
    fontSize: FONT_SIZE.title1,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
    letterSpacing: -0.5,
  },

  subtitle: {
    fontSize: FONT_SIZE.title3,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
  },

  headline: {
    fontSize: FONT_SIZE.headline,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
  },

  body: {
    fontSize: FONT_SIZE.body,
    color: COLORS.text,
    lineHeight: FONT_SIZE.body * LINE_HEIGHT.normal,
  },

  bodySecondary: {
    fontSize: FONT_SIZE.body,
    color: COLORS.textSecondary,
    lineHeight: FONT_SIZE.body * LINE_HEIGHT.normal,
  },

  caption: {
    fontSize: FONT_SIZE.caption,
    color: COLORS.textSecondary,
  },

  // ===== LISTAS =====
  listContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  listContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.huge,
  },

  listSeparator: {
    height: SPACING.md,
  },

  emptyText: {
    textAlign: 'center',
    marginTop: SPACING.xxxl,
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.body,
  },

  // ===== BADGES Y CHIPS =====
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
  },

  badgeSuccess: {
    backgroundColor: COLORS.successLight,
  },

  badgeError: {
    backgroundColor: COLORS.errorLight,
  },

  badgeWarning: {
    backgroundColor: COLORS.warningLight,
  },

  badgeInfo: {
    backgroundColor: COLORS.infoLight,
  },

  badgeText: {
    fontSize: FONT_SIZE.caption,
    fontWeight: FONT_WEIGHT.semibold,
  },

  chip: {
    height: 32,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },

  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  chipText: {
    color: COLORS.text,
    fontSize: FONT_SIZE.subhead,
    fontWeight: FONT_WEIGHT.medium,
  },

  chipTextActive: {
    color: COLORS.textInverse,
  },

  // ===== LAYOUT HELPERS =====
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  rowSpaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },

  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  flexFill: {
    flex: 1,
  },

  // ===== SECCIONES =====
  section: {
    marginBottom: SPACING.xxl,
  },

  sectionHeader: {
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },

  sectionTitle: {
    fontSize: FONT_SIZE.subhead,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ===== DIVIDERS =====
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: SPACING.md,
  },

  dividerInset: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: SPACING.md,
    marginLeft: SPACING.lg,
  },

  // ===== FLOATING ACTION BUTTON =====
  fab: {
    position: 'absolute',
    right: SPACING.xl,
    bottom: SPACING.xl,
    width: 56,
    height: 56,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.lg,
  },

  fabSmall: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },

  // ===== HEADERS =====
  screenHeader: {
    paddingHorizontal: LAYOUT.screenPadding,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },

  screenTitle: {
    fontSize: FONT_SIZE.largeTitle,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
    letterSpacing: -0.5,
  },

  screenSubtitle: {
    fontSize: FONT_SIZE.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
});

// =============================================================================
// ESTILOS WEB
// =============================================================================

export const webSelectStyle: React.CSSProperties = {
  width: '100%',
  height: LAYOUT.inputHeight,
  padding: '0 16px',
  borderRadius: RADIUS.md,
  border: `1px solid ${COLORS.border}`,
  backgroundColor: COLORS.surface,
  fontSize: FONT_SIZE.body,
  color: COLORS.text,
  outline: 'none',
  cursor: 'pointer',
};

// =============================================================================
// HELPERS DE ESTILO
// =============================================================================

export const createShadow = (elevation: keyof typeof SHADOWS) => SHADOWS[elevation];

// Función para obtener color con opacidad
export const withOpacity = (color: string, opacity: number): string => {
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
};
