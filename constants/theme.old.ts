import { StyleSheet } from 'react-native';

// Colores del sistema
export const COLORS = {
  primary: '#00b894',
  secondary: '#0984e3',
  background: '#f2f2f2',
  surface: '#fff',
  cardBackground: '#dfe6e9',
  border: '#ccc',
  borderLight: '#ced4da',
  borderMedium: '#b2bec3',
  text: '#2d3436',
  textSecondary: '#636e72',
  textLight: '#6c757d',
  placeholder: '#555',
  error: '#d63031',
  success: '#00b894',
  warning: '#fdcb6e',
  info: '#0984e3',
  disabled: '#e9ecef',
  white: '#fff',
  black: '#000',
};

// Espaciados consistentes
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

// Radios de borde
export const RADIUS = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
};

// TamaÃ±os de fuente
export const FONT_SIZE = {
  xs: 11,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
};

// Estilos comunes que se repiten en toda la app
export const commonStyles = StyleSheet.create({
  // Contenedores
  container: {
    flex: 1,
    padding: SPACING.xl,
    backgroundColor: COLORS.background,
  },
  
  scrollContainer: {
    flexGrow: 1,
    padding: SPACING.xl,
    backgroundColor: COLORS.background,
  },

  // Campos de formulario
  fieldContainer: {
    marginBottom: SPACING.lg,
  },

  label: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },

  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    fontSize: FONT_SIZE.md,
  },

  inputError: {
    borderColor: COLORS.error,
  },

  inputDisabled: {
    backgroundColor: COLORS.disabled,
    color: COLORS.textLight,
  },

  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZE.sm,
    marginTop: 4,
  },

  // Botones
  button: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },

  buttonSecondary: {
    backgroundColor: COLORS.secondary,
    padding: 15,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },

  buttonDanger: {
    backgroundColor: COLORS.error,
    padding: 15,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },

  buttonOutline: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.secondary,
  },

  buttonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: FONT_SIZE.lg,
  },

  buttonTextOutline: {
    color: COLORS.secondary,
    fontWeight: 'bold',
    fontSize: FONT_SIZE.sm,
  },

  buttonDisabled: {
    backgroundColor: COLORS.disabled,
  },

  // Tarjetas
  card: {
    backgroundColor: COLORS.cardBackground,
    padding: 14,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
  },

  // Listas vacÃ­as
  emptyText: {
    textAlign: 'center',
    marginTop: 24,
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.md,
  },

  // Badges/Chips
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },

  badgeText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },

  // Filtros
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
    backgroundColor: COLORS.surface,
  },

  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  chipText: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },

  chipTextActive: {
    color: COLORS.white,
  },

  // Centrado
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Filas
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  rowSpaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

// Estilos especÃ­ficos de web
export const webSelectStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 10px',
  borderRadius: RADIUS.sm,
  border: `1px solid ${COLORS.borderLight}`,
  backgroundColor: COLORS.surface,
  fontSize: FONT_SIZE.lg,
  color: COLORS.text,
};
