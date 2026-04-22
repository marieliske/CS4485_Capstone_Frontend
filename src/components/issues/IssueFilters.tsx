interface IssueFiltersProps {
  query: string
  status: string
  sortBy: 'priority' | 'date' | 'repo'
  sortDirection: 'asc' | 'desc'
  onQueryChange: (value: string) => void
  onStatusChange: (value: string) => void
  onSortByChange: (value: 'priority' | 'date' | 'repo') => void
  onSortDirectionChange: (value: 'asc' | 'desc') => void
}

export function IssueFilters({
  query,
  status,
  sortBy,
  sortDirection,
  onQueryChange,
  onStatusChange,
  onSortByChange,
  onSortDirectionChange,
}: IssueFiltersProps) {
  return (
    <div className="toolbar">
      <input
        className="input"
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Search symbol, file path, or doc section"
        value={query}
      />
      <select className="select" onChange={(event) => onStatusChange(event.target.value)} value={status}>
        <option value="all">All mismatch states</option>
        <option value="open">Flagged</option>
        <option value="in-progress">Under Review</option>
        <option value="closed">Resolved</option>
      </select>
      <select
        className="select"
        onChange={(event) => onSortByChange(event.target.value as 'priority' | 'date' | 'repo')}
        value={sortBy}
      >
        <option value="priority">Sort by Priority</option>
        <option value="date">Sort by Date</option>
        <option value="repo">Sort by Repo</option>
      </select>
      <select
        className="select"
        onChange={(event) => onSortDirectionChange(event.target.value as 'asc' | 'desc')}
        value={sortDirection}
      >
        <option value="desc">Descending</option>
        <option value="asc">Ascending</option>
      </select>
    </div>
  )
}
