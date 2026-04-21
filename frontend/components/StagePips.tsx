import type { Stage } from '../src/types'

const STAGES: Stage[] = ['Planted', 'Growing', 'Ready', 'Harvested']

const colors: Record<Stage, string> = {
  Planted:   'bg-amber-400',
  Growing:   'bg-lime-500',
  Ready:     'bg-emerald-500',
  Harvested: 'bg-gray-400',
}

export function StagePips({ current }: { current: Stage }) {
  const idx = STAGES.indexOf(current)
  return (
    <div className="flex items-center gap-1">
      {STAGES.map((s, i) => (
        <div
          key={s}
          title={s}
          className={`h-1.5 flex-1 rounded-full transition-all ${
            i <= idx ? colors[current] : 'bg-gray-200'
          }`}
        />
      ))}
    </div>
  )
}

export function StageDot({ stage }: { stage: Stage }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${colors[stage]}`} />
  )
}