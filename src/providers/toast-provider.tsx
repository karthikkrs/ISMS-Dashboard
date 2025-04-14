'use client';

import { Toaster } from 'sonner';

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          borderRadius: '8px',
          fontSize: '14px',
        },
        duration: 4000,
      }}
    />
  );
}
