import { AppText, Icon, type IconName } from '@/components/ds';
import { FONT_SIZE, RADIUS, SPACING, useEstilos, useTheme, type Tema } from '@/theme';
import { useState } from 'react';
import { View } from 'react-native';
import { MaskedTextInput } from 'react-native-mask-text';

interface CampoMonedaProps {
  /** Valor sin formato (solo dígitos), igual que el `unmasked` de la máscara. */
  value: string;
  onChangeValue: (sinFormato: string) => void;
  placeholder?: string;
  helper?: string;
  leftIcon?: IconName;
}

/**
 * Campo de dinero con máscara de pesos ($1.000). Mismo aspecto que `Input` del sistema de diseño,
 * pero usa `MaskedTextInput` para conservar exactamente el formateo y el valor sin formato.
 */
export function CampoMoneda({ value, onChangeValue, placeholder, helper, leftIcon }: CampoMonedaProps) {
  const estilos = useEstilos(crearEstilos);
  const { tema } = useTheme();
  const c = tema.colores;
  const [enfocado, setEnfocado] = useState(false);

  return (
    <View>
      <View style={[estilos.campo, enfocado ? estilos.campoEnfocado : null]}>
        {leftIcon ? <Icon name={leftIcon} size={18} color={c.textoTenue} /> : null}
        <MaskedTextInput
          type="currency"
          options={{ prefix: '$', decimalSeparator: ',', groupSeparator: '.', precision: 0 }}
          value={value}
          onChangeText={(_, unmasked) => onChangeValue(unmasked)}
          onFocus={() => setEnfocado(true)}
          onBlur={() => setEnfocado(false)}
          keyboardType="numeric"
          placeholder={placeholder}
          placeholderTextColor={c.placeholder}
          style={estilos.texto}
        />
      </View>
      {helper ? (
        <AppText variante="nota" tono="suave" style={estilos.ayuda}>
          {helper}
        </AppText>
      ) : null}
    </View>
  );
}

const crearEstilos = (t: Tema) => ({
  campo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: SPACING.sm,
    minHeight: 48,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: t.colores.borde,
    backgroundColor: t.colores.superficie,
  },
  campoEnfocado: { borderWidth: 1.5, borderColor: t.colores.primarioFuerte },
  texto: {
    flex: 1,
    minWidth: 0,
    fontSize: FONT_SIZE.callout,
    paddingVertical: SPACING.md,
    color: t.colores.texto,
  },
  ayuda: { marginTop: SPACING.xs },
});
