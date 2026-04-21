import type { Status } from '../src/types'

const map: Record<Status, string> = {
  Active:    'bg-[var(--color-forest-light)] text-[var(--color-forest)] ring-1 ring-[var(--color-forest-mid)]/20',
  'At Risk': 'bg-[var(--color-risk-light)] text-[var(--color-risk)] ring-1 ring-[var(--color-risk)]/20',
  Completed: 'bg-gray-100 text-gray-500 ring-1 ring-gray-200',
}

const dot: Record<Status, string> = {
  Active:    'bg-[var(--color-forest-mid)]',
  'At Risk': 'bg-[var(--color-risk)]',
  Completed: 'bg-gray-400',
}

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${map[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot[status]}`} />
      {status}
    </span>
  )
}