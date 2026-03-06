import { apiRequest } from './client'
import type { ApiResponse } from '../types/api'
import type { Report } from '../types/report'

export async function getReports() {
  const response = await apiRequest<ApiResponse<Report[]>>('/reports')
  return response.data
}
