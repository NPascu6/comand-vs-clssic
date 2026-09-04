import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Alert, Snackbar } from '@mui/material';

export type ToastSeverity = 'success' | 'info' | 'warning' | 'error';

export interface ToastProviderProps {
  children: ReactNode;
}

interface ToastApi {
  show: (message: string, severity?: ToastSeverity) => void;
}

interface Toast {
  key: number;
  message: string;
  severity: ToastSeverity;
}

const ToastContext = createContext<ToastApi | null>(null);

/** One Snackbar + Alert, bottom-right. A new toast replaces the current one. */
export function ToastProvider({ children }: ToastProviderProps) {
  const [toast, setToast] = useState<Toast | null>(null);
  const [open, setOpen] = useState(false);

  const show = useCallback((message: string, severity: ToastSeverity = 'info') => {
    setToast({ key: Date.now(), message, severity });
    setOpen(true);
  }, []);
  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <Snackbar
        key={toast?.key}
        open={open}
        autoHideDuration={4000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        onClose={(_, reason) => {
          if (reason !== 'clickaway') setOpen(false);
        }}
      >
        <Alert severity={toast?.severity ?? 'info'} onClose={() => setOpen(false)} sx={{ width: '100%' }}>
          {toast?.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>');
  return context;
}
