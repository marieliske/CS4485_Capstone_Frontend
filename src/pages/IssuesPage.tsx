import { useMemo, useState } from 'react'
import { IssueDetailPanel } from '../components/issues/IssueDetailPanel'
import { IssueFilters } from '../components/issues/IssueFilters'
import { IssueTable } from '../components/issues/IssueTable'
import { Spinner } from '../components/shared/Spinner'
import { useIssues } from '../hooks/useIssues'

export function IssuesPage() {
  const { issues, loading, error, selectedIssue, setSelectedIssue } = useIssues()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const normalizedQuery = query.toLowerCase()
      const matchesQuery =
        issue.title.toLowerCase().includes(normalizedQuery) ||
        issue.codeElement.toLowerCase().includes(normalizedQuery) ||
        issue.docPath.toLowerCase().includes(normalizedQuery) ||
        issue.docSection.toLowerCase().includes(normalizedQuery)
      const matchesStatus = status === 'all' ? true : issue.status === status
      return matchesQuery && matchesStatus
    })
  }, [issues, query, status])

  return (
    <section className="page-stack">
      <IssueFilters
        onQueryChange={setQuery}
        onStatusChange={setStatus}
        query={query}
        status={status}
      />
      {loading ? <Spinner /> : null}
      {error ? <p className="error-text">{error}</p> : null}
      <div className="panel-grid issues-layout">
        <IssueTable issues={filteredIssues} onSelect={setSelectedIssue} />
        <IssueDetailPanel issue={selectedIssue} />
      </div>
    </section>
  )
}
