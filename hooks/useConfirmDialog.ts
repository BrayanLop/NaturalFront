import { showConfirm } from '@/utils/logger';
import { useCallback } from 'react';

interface UseConfirmDialogOptions {
  title?: string;
  message: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

export function useConfirmDialog() {
  const confirm = useCallback(
    async ({ title, message, onConfirm, onCancel }: UseConfirmDialogOptions) => {
      const result = await showConfirm(message, title);
      
      if (result) {
        await onConfirm();
      } else if (onCancel) {
        onCancel();
      }
      
      return result;
    },
    []
  );

  return { confirm };
}
