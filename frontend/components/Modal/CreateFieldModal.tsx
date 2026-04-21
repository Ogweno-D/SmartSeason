import { useState, useEffect, type FormEvent} from 'react'
import { api } from '../../src/api/api'
import type { Agent } from '../../src/types'

interface Props {
  onClose: () => void
  onCreated: () => void
}

export function CreateFieldModal({ onClose, onCreated }: Props) {
  const [agents, setAgents] = useState<Agent[]>([])
  const [form, setForm] = useState({ name: '', crop_type: '', planting_date: '', assigned_agent_id: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.agents.list().then(setAgents)
  }, [])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e : FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.fields.create({
        name: form.name,
        crop_type: form.crop_type,
        planting_date: form.planting_date,
        assigned_agent_id: form.assigned_agent_id ? Number(form.assigned_agent_id) : null,
      })
      onCreated()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-900 text-lg">New Field</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input
            required placeholder="Field name"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-forest-mid)]/40"
            value={form.name} onChange={set('name')}
          />
          <input
            required placeholder="Crop type (e.g. Maize, Wheat)"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-forest-mid)]/40"
            value={form.crop_type} onChange={set('crop_type')}
          />
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium px-1">Planting date</label>
            <input
              required type="date"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-forest-mid)]/40"
              value={form.planting_date} onChange={set('planting_date')}
            />
          </div>
          <select
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-forest-mid)]/40"
            value={form.assigned_agent_id} onChange={set('assigned_agent_id')}
          >
            <option value="">Unassigned</option>
            {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-forest text-white rounded-xl py-3 text-sm font-medium hover:bg-[var(--color-forest-mid)] transition-colors disabled:opacity-60">
              {saving ? 'Creating…' : 'Create Field'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}