import { apiRequest } from './client'
import type { ApiResponse } from '../types/api'
import type { Issue } from '../types/issue'

export async function getIssues() {
  const response = await apiRequest<ApiResponse<Issue[]>>('/issues')
  return response.data
}
