import type { ReactNode } from 'react'

export interface TableColumn<T> {
  key: keyof T
  label: string
  render?: (row: T) => ReactNode
}

interface TableProps<T> {
  columns: Array<TableColumn<T>>
  data: T[]
  getRowKey: (row: T, index: number) => string
}

export function Table<T>({ columns, data, getRowKey }: TableProps<T>) {
  return (
    <table className="table">
      <thead className="table-head">
        <tr>
          {columns.map((column) => (
            <th key={String(column.key)}>
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIndex) => (
          <tr key={getRowKey(row, rowIndex)}>
            {columns.map((column) => (
              <td key={String(column.key)}>
                {column.render ? column.render(row) : String(row[column.key])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
