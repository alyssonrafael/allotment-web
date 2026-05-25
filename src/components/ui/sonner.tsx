import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon } from 'lucide-react'
import { Toaster as Sonner } from 'sonner'
import type { ToasterProps } from 'sonner'
import { useUIStore } from '#/stores/uiStore'

const Toaster = ({ ...props }: ToasterProps) => {
  const theme = useUIStore((s) => s.theme)

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        style: {
          fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
          fontSize: '13px',
          fontWeight: '600',
        },
      }}
      style={
        {
          '--normal-bg': 'var(--surface)',
          '--normal-text': 'var(--fg)',
          '--normal-border': 'var(--border-color)',
          '--success-bg': 'var(--status-livre-50)',
          '--success-text': 'var(--status-livre-text)',
          '--success-border': 'var(--status-livre)',
          '--error-bg': 'var(--status-erro-50)',
          '--error-text': 'var(--status-erro-text)',
          '--error-border': 'var(--status-erro)',
          '--warning-bg': 'var(--status-reservado-50)',
          '--warning-text': 'var(--status-reservado-text)',
          '--warning-border': 'var(--status-reservado)',
          '--info-bg': 'var(--surface-2)',
          '--info-text': 'var(--brand-primary)',
          '--info-border': 'var(--border-color)',
          '--border-radius': '12px',
          '--toast-shadow': 'var(--shadow-md)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
