import { commonStyles } from '@/constants/theme';
import React, { ReactNode } from 'react';
import { Text, View } from 'react-native';

interface FormFieldProps {
  label: string;
  error?: string;
  children: ReactNode;
}

const FormField = React.memo(function FormField({ label, error, children }: FormFieldProps) {
  return (
    <View style={commonStyles.fieldContainer}>
      <Text style={commonStyles.label}>{label}</Text>
      {children}
      {error && <Text style={commonStyles.errorText}>{error}</Text>}
    </View>
  );
});

export default FormField;
