import { useNavigate } from 'react-router-dom'
import type { Field } from '../src/types'
import { StatusBadge } from './StatusBadge'
import { StagePips } from './StagePips'

export function FieldCard({ field }: { field: Field }) {
  const nav = useNavigate()
  return (
    <article
      onClick={() => nav(`/fields/${field.id}`)}
      className="
        group bg-white rounded-(--radius-card) border border-gray-100
        p-5 cursor-pointer select-none
        shadow-[var(--shadow-card)]
        hover:shadow-[var(--shadow-hover)] hover:-translate-y-0.5
        transition-all duration-200
      "
    >
      <div className="flex justify-between items-start mb-4">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 truncate leading-snug">{field.name}</h3>
          <p className="text-sm text-gray-500 mt-0.5 font-medium">{field.crop_type}</p>
        </div>
        <StatusBadge status={field.status} />
      </div>

      <StagePips current={field.current_stage} />

      <div className="flex items-center justify-between mt-3">
        <span className="text-xs font-medium text-gray-600">{field.current_stage}</span>
        {field.agent_name
          ? <span className="text-xs text-gray-400 truncate max-w-[120px]">{field.agent_name}</span>
          : <span className="text-xs text-gray-300 italic">Unassigned</span>
        }
      </div>

      <p className="text-xs text-gray-400 mt-2 font-[family-name:var(--font-mono)]">
        Planted {new Date(field.planting_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
      </p>
    </article>
  )
}