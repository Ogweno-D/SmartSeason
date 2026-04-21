export type Role = 'admin' | 'agent'
export type Stage = 'Planted' | 'Growing' | 'Ready' | 'Harvested'
export type Status = 'Active' | 'At Risk' | 'Completed'
 
export interface User {
  id: number
  name: string
  email: string
  role: Role
}
 
export interface Agent {
  id: number
  name: string
  email: string
}
 
export interface Observation {
  id: number
  field_id: number
  agent_id: number
  agent_name: string
  note: string
  stage_at_time: Stage
  created_at: string
}
 
export interface Field {
  id: number
  name: string
  crop_type: string
  planting_date: string
  current_stage: Stage
  assigned_agent_id: number | null
  agent_name: string | null
  created_by: number
  created_at: string
  updated_at: string
  status: Status
  observations?: Observation[]
}
 
export interface AuthResponse {
  accessToken: string
  refreshToken:string
  user: User
}
 
