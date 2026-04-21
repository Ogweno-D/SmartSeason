import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useFields } from '../hooks/useFields'
import { FieldCard } from '../components/FieldCard'
import { Navbar } from '../components/Navbar'
import { CreateFieldModal } from '../components/Modal/CreateFieldModal'
import type { Status } from '../src/types'

const STATUSES: Status[] = ['Active', 'At Risk', 'Completed']

const summaryStyle: Record<Status, { bg: string; text: string; num: string }> = {
  Active:    { bg: 'bg-[var(--color-forest-light)]', text: 'text-[var(--color-forest)]', num: 'text-[var(--color-forest)]' },
  'At Risk': { bg: 'bg-[var(--color-risk-light)]',  text: 'text-[var(--color-risk)]',   num: 'text-[var(--color-risk)]'   },
  Completed: { bg: 'bg-gray-50',                    text: 'text-gray-500',              num: 'text-gray-400'              },
}

export default function Dashboard() {
  const { user } = useAuth()
  const { fields, loading, error, refetch } = useFields()
  const [showCreate, setShowCreate] = useState(false)
  const [filter, setFilter] = useState<Status | 'All'>('All')

  const visible = filter === 'All' ? fields : fields.filter(f => f.status === filter)

  return (
    <div className="min-h-screen bg-forest-pale">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">
              {user?.role === 'admin' ? 'All Fields' : 'My Fields'}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {user?.role === 'admin' ? 'Monitor and manage all active fields' : 'Track progress on your assigned fields'}
            </p>
          </div>
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowCreate(true)}
              className="
                inline-flex items-center gap-2 bg-forest text-white
                px-4 py-2.5 rounded-xl text-sm font-semibold
                hover:bg-forest-mid active:scale-[0.98]
                transition-all shadow-sm
              "
            >
              <span className="text-base leading-none">+</span> New Field
            </button>
          )}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-(--shadow-card)">
            <p className="text-3xl font-bold text-gray-900">{fields.length}</p>
            <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-wide">Total Fields</p>
          </div>
          {STATUSES.map(s => {
            const st = summaryStyle[s]
            const count = fields.filter (f => f.status === s).length
            return (
              <button
                key={s}
                onClick={() => setFilter(filter === s ? 'All' : s)}
                className={`
                  rounded-xl border p-4 text-left transition-all shadow-(--shadow-card)
                  ${filter === s ? `${st.bg} border-transparent ring-2 ring-forest-mid/30` : 'bg-white border-gray-100 hover:shadow-md'}
                `}
              >
                <p className={`text-3xl font-bold ${st.num}`}>{count}</p>
                <p className={`text-xs font-medium mt-1 uppercase tracking-wide ${st.text}`}>{s}</p>
              </button>
            )
          })}
        </div>

        {/* Filter chip display */}
        {filter !== 'All' && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-gray-500">Filtering by:</span>
            <span className="inline-flex items-center gap-1.5 bg-forest-light text-forest text-xs font-medium px-3 py-1 rounded-full">
              {filter}
              <button onClick={() => setFilter('All')} className="hover:text-red-600 ml-1">×</button>
            </span>
          </div>
        )}

        {/* Field grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-(--radius-card) border border-gray-100 p-5 h-36 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/3 mb-6" />
                <div className="h-1.5 bg-gray-100 rounded w-full mb-3" />
                <div className="h-3 bg-gray-100 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 text-risk">{error}</div>
        ) : visible.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">🌱</p>
            <p className="font-medium">No fields found</p>
            <p className="text-sm mt-1">
              {filter !== 'All' ? 'No fields match this filter.' : user?.role === 'admin' ? 'Create your first field to get started.' : 'You have no assigned fields yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visible.map(f => <FieldCard key={f.id} field={f} />)}
          </div>
        )}
      </main>

      {showCreate && (
        <CreateFieldModal onClose={() => setShowCreate(false)} onCreated={refetch} />
      )}
    </div>
  )
}