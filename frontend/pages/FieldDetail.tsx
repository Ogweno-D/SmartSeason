import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../src/api/api'
import type { Field, Stage } from '../src/types'
import { Navbar } from '../components/Navbar'
import { StatusBadge } from '../components/StatusBadge'
import { StagePips, StageDot } from '../components/StagePips'
import { useAuth } from '../context/AuthContext'

const STAGES: Stage[] = ['Planted', 'Growing', 'Ready', 'Harvested']

export default function FieldDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const nav = useNavigate()
  const [field, setField] = useState<Field | null>(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => api.fields.get(Number(id)).then(setField)
  useEffect(() => { load() }, [id])

  const changeStage = async (stage: Stage) => {
    await api.fields.updateStage(Number(id), stage)
    load()
  }

  const submitNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!note.trim()) return
    setSaving(true)
    try {
      await api.fields.addObservation(Number(id), note)
      setNote('')
      load()
    } finally {
      setSaving(false)
    }
  }

  if (!field) return (
    <div className="min-h-screen bg-forest-pale">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 h-28 animate-pulse" />
        ))}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[var(--color-forest-pale)]">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-5">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <button
            onClick={() => nav('/')}
            className="hover:text-[var(--color-forest)] transition-colors"
          >
            Dashboard
          </button>
          <span>/</span>
          <span className="text-gray-700 font-medium truncate">{field.name}</span>
        </div>

        {/* Hero card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 leading-snug">{field.name}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{field.crop_type}</p>
            </div>
            <StatusBadge status={field.status} />
          </div>

          <StagePips current={field.current_stage} />

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 mt-5 text-sm">
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium mb-1">Stage</p>
              <p className="font-medium flex items-center gap-1.5">
                <StageDot stage={field.current_stage} />
                {field.current_stage}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium mb-1">Planted</p>
              <p className="font-medium font-[family-name:var(--font-mono)] text-xs leading-6">
                {new Date(field.planting_date).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium mb-1">Agent</p>
              <p className="font-medium">
                {field.agent_name ?? <span className="text-gray-300 italic text-xs">Unassigned</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Stage selector */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Update Stage</h2>
          <div className="flex flex-wrap gap-2">
            {STAGES.map(s => (
              <button
                key={s}
                onClick={() => changeStage(s)}
                className={`
                  px-4 py-2 rounded-xl text-sm font-medium transition-all
                  ${field.current_stage === s
                    ? 'bg-[var(--color-forest)] text-white shadow-sm'
                    : 'bg-gray-50 text-gray-600 hover:bg-[var(--color-forest-light)] hover:text-[var(--color-forest)]'
                  }
                `}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Log observation */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Log Observation</h2>
          <form onSubmit={submitNote} className="flex gap-3">
            <input
              className="
                flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                focus:outline-none focus:ring-2 focus:ring-[var(--color-forest-mid)]/40
                placeholder:text-gray-400
              "
              placeholder="e.g. Irrigation complete, healthy growth observed…"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
            <button
              type="submit"
              disabled={saving || !note.trim()}
              className="
                bg-[var(--color-forest)] text-white px-5 py-2.5 rounded-xl
                text-sm font-semibold hover:bg-[var(--color-forest-mid)]
                transition-colors disabled:opacity-50 shrink-0
              "
            >
              {saving ? '…' : 'Save'}
            </button>
          </form>
        </div>

        {/* Observation log */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">
            Observation Log
            <span className="ml-2 text-xs font-normal text-gray-400">
              {field.observations?.length ?? 0} entries
            </span>
          </h2>

          {!field.observations?.length ? (
            <p className="text-sm text-gray-400 py-6 text-center">No observations recorded yet.</p>
          ) : (
            <ul className="mt-4 space-y-0">
              {field.observations.map((o, idx) => (
                <li key={o.id} className="flex gap-3">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-2 h-2 rounded-full bg-[var(--color-forest-mid)] mt-1.5" />
                    {idx < (field.observations?.length ?? 0) - 1 && (
                      <div className="w-px flex-1 bg-gray-100 mt-1" />
                    )}
                  </div>
                  <div className="pb-5 flex-1 min-w-0">
                    <p className="text-sm text-gray-800 leading-relaxed">{o.note}</p>
                    <p className="text-xs text-gray-400 mt-1 font-[family-name:var(--font-mono)]">
                      {o.agent_name}
                      {' · '}
                      {new Date(o.created_at).toLocaleString('en-GB', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                      {' · '}
                      <span className="text-gray-500">{o.stage_at_time}</span>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Admin: delete field */}
        {user?.role === 'admin' && (
          <div className="flex justify-end pb-4">
            <button
              onClick={async () => {
                if (!confirm(`Delete "${field.name}" and all its observations?`)) return
                await api.fields.delete(field.id)
                nav('/')
              }}
              className="text-xs text-gray-400 hover:text-[var(--color-risk)] transition-colors px-3 py-2 rounded-lg hover:bg-[var(--color-risk-light)]"
            >
              Delete field
            </button>
          </div>
        )}
      </main>
    </div>
  )
}