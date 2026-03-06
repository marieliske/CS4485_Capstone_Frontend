interface IssueFiltersProps {
  query: string
  status: string
  onQueryChange: (value: string) => void
  onStatusChange: (value: string) => void
}

export function IssueFilters({
  query,
  status,
  onQueryChange,
  onStatusChange,
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
    </div>
  )
}
