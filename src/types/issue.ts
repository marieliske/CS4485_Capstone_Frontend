export type IssueStatus = 'open' | 'in-progress' | 'closed'
export type IssuePriority = 'low' | 'medium' | 'high'
export type MismatchType =
  | 'signature-mismatch'
  | 'removed-api-reference'
  | 'parameter-drift'
  | 'example-outdated'

export interface Issue {
  id: string
  title: string
  description: string
  mismatchType: MismatchType
  codeElement: string
  sourcePath: string
  docPath: string
  docSection: string
  status: IssueStatus
  priority: IssuePriority
  createdAt: string
  updatedAt: string
}
