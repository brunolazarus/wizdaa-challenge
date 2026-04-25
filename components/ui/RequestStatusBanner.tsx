import type { RequestStatus } from '@/lib/hcm-types'

type Intent = 'info' | 'success' | 'warning' | 'error'

const STATUS_CONFIG: Record<
  Exclude<RequestStatus, 'idle'>,
  { label: string; description: string; intent: Intent }
> = {
  'optimistic-pending': {
    label: 'Pending',
    description: 'Your request has been submitted and is awaiting HCM confirmation.',
    intent: 'info',
  },
  'hcm-confirmed': {
    label: 'Confirmed by HCM',
    description: 'HCM confirmed your request and the balance has been updated.',
    intent: 'success',
  },
  'hcm-rejected': {
    label: 'Request rejected',
    description: 'HCM rejected this request. Your balance has not changed.',
    intent: 'error',
  },
  'hcm-conflict': {
    label: 'Conflict detected',
    description:
      'A conflicting change was made to your balance at the same time. Please try again.',
    intent: 'warning',
  },
  'hcm-silently-wrong': {
    label: 'Unconfirmed',
    description:
      'HCM acknowledged the request but the balance did not update as expected. Your previous balance has been restored.',
    intent: 'error',
  },
  'optimistic-rolled-back': {
    label: 'Rolled back',
    description:
      'The request could not be completed. Your balance has been restored to its previous value.',
    intent: 'error',
  },
}

const INTENT_CLASSES: Record<Intent, string> = {
  info: 'bg-blue-50 border-blue-200 text-blue-900',
  success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  warning: 'bg-amber-50 border-amber-200 text-amber-900',
  error: 'bg-red-50 border-red-200 text-red-900',
}

export interface RequestStatusBannerProps {
  status: RequestStatus
  onReset?: () => void
}

export function RequestStatusBanner({ status, onReset }: RequestStatusBannerProps) {
  if (status === 'idle') return null

  const config = STATUS_CONFIG[status]

  return (
    <div
      role="status"
      aria-live="polite"
      className={`rounded-md border px-4 py-3 ${INTENT_CLASSES[config.intent]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{config.label}</p>
          <p className="text-sm mt-0.5 opacity-80">{config.description}</p>
        </div>
        {onReset && status !== 'optimistic-pending' && (
          <button
            onClick={onReset}
            className="shrink-0 text-xs font-medium underline opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  )
}
