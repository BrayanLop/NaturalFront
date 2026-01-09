import { validateField, ValidationRule } from '@/utils/validators';
import { useCallback, useState } from 'react';

interface UseFormOptions<T> {
  initialValues: T;
  validationRules?: Record<keyof T, ValidationRule>;
  onSubmit: (values: T) => void | Promise<void>;
}

interface UseFormReturn<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isSubmitting: boolean;
  handleChange: (field: keyof T, value: any) => void;
  handleBlur: (field: keyof T) => void;
  handleSubmit: () => Promise<void>;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldError: (field: keyof T, error: string) => void;
  resetForm: () => void;
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  validationRules = {},
  onSubmit,
}: UseFormOptions<T>): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateFieldValue = useCallback(
    (field: keyof T, value: any): string | null => {
      const rule = validationRules[field];
      if (!rule) return null;
      return validateField(String(value), rule);
    },
    [validationRules]
  );

  const handleChange = useCallback(
    (field: keyof T, value: any) => {
      setValues((prev) => ({ ...prev, [field]: value }));
      
      // Validar en tiempo real si el campo ya fue tocado
      if (touched[field]) {
        const error = validateFieldValue(field, value);
        setErrors((prev) => ({ ...prev, [field]: error || undefined }));
      }
    },
    [touched, validateFieldValue]
  );

  const handleBlur = useCallback(
    (field: keyof T) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      
      // Validar al perder el foco
      const error = validateFieldValue(field, values[field]);
      setErrors((prev) => ({ ...prev, [field]: error || undefined }));
    },
    [values, validateFieldValue]
  );

  const validateAllFields = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    Object.keys(validationRules).forEach((key) => {
      const field = key as keyof T;
      const error = validateFieldValue(field, values[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validationRules, validateFieldValue]);

  const handleSubmit = useCallback(async () => {
    // Marcar todos los campos como tocados
    const allTouched = Object.keys(initialValues).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {}
    ) as Partial<Record<keyof T, boolean>>;
    setTouched(allTouched);

    // Validar todos los campos
    if (!validateAllFields()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, initialValues, validateAllFields, onSubmit]);

  const setFieldValue = useCallback((field: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors((prev) => ({ ...prev, [field]: error }));
  }, []);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const isValid = Object.keys(errors).length === 0;

  return {
    values,
    errors,
    touched,
    isValid,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    resetForm,
  };
}
