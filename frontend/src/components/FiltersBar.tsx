'use client';

import type { SortField, SortOrder, TaskStatus } from '@/types';

interface Props {
  status: TaskStatus | '';
  search: string;
  sortBy: SortField;
  sortOrder: SortOrder;
  onStatusChange: (status: TaskStatus | '') => void;
  onSearchChange: (search: string) => void;
  onSortChange: (sortBy: SortField, sortOrder: SortOrder) => void;
}

export function FiltersBar({
  status,
  search,
  sortBy,
  sortOrder,
  onStatusChange,
  onSearchChange,
  onSortChange,
}: Props) {
  return (
    <div className="card grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <label className="label" htmlFor="search">
          Search by title
        </label>
        <input
          id="search"
          className="input"
          type="search"
          placeholder="Search tasks…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div>
        <label className="label" htmlFor="status-filter">
          Status
        </label>
        <select
          id="status-filter"
          className="input"
          value={status}
          onChange={(e) => onStatusChange(e.target.value as TaskStatus | '')}
        >
          <option value="">All</option>
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      <div>
        <label className="label" htmlFor="sort-by">
          Sort by
        </label>
        <select
          id="sort-by"
          className="input"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortField, sortOrder)}
        >
          <option value="createdAt">Created date</option>
          <option value="dueDate">Due date</option>
          <option value="priority">Priority</option>
          <option value="title">Title</option>
        </select>
      </div>

      <div>
        <label className="label" htmlFor="sort-order">
          Order
        </label>
        <select
          id="sort-order"
          className="input"
          value={sortOrder}
          onChange={(e) => onSortChange(sortBy, e.target.value as SortOrder)}
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </div>
    </div>
  );
}
