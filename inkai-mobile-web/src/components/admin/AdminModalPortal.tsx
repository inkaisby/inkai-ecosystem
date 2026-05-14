'use client';

import type { ReactNode } from 'react';
import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

/** Modal admin di-portal ke document.body agar z-index efektif di atas TopBar (stacking flex layout). */
export default function AdminModalPortal({ children }: { children: ReactNode }) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  if (!mounted) return null;
  return createPortal(children, document.body);
}
