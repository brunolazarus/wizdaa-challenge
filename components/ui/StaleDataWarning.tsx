export interface StaleDataWarningProps {
  preBalance: number
  postBalance: number
  unit: string
}

export function StaleDataWarning({ preBalance, postBalance, unit }: StaleDataWarningProps) {
  return (
    <div role="alert" className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
      <p className="text-sm font-semibold text-amber-900">Balance mismatch detected</p>
      <p className="text-sm text-amber-800 mt-1">
        HCM returned success but the balance did not change as expected. Expected{' '}
        <strong>
          {preBalance} {unit}
        </strong>{' '}
        after your request, but HCM still reports{' '}
        <strong>
          {postBalance} {unit}
        </strong>
        . Your previous balance has been restored.
      </p>
    </div>
  )
}
