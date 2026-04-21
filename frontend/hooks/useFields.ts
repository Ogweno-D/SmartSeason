import { useState, useEffect } from 'react'
import { api } from '../src/api/api'
import type { Field, Stage } from '../src/types'

export function useFields() {
  const [fields, setFields] = useState<Field[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFields = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.fields.list()
      setFields(data)
    } catch {
      setError('Failed to load fields')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFields()
  }, [])

  const updateStage = async (id: number, stage: Stage) => {
    await api.fields.updateStage(id, stage)
    await fetchFields()
  }

  const addObservation = async (id: number, note: string) => {
    await api.fields.addObservation(id, note)
    await fetchFields()
  }

  return { fields, loading, error, refetch: fetchFields, updateStage, addObservation }
}