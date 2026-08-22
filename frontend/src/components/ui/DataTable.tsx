import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { cx } from '../../lib/format';
import { useMediaQuery } from '../../lib/useMediaQuery';
import { Button } from './Button';
import { EmptyState } from './EmptyState';
import { Icon } from './Icon';
import { Skeleton } from './Skeleton';

export type SortDirection = 'asc' | 'desc';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  /** Provide to make the column sortable. Omit for action columns and thumbnails. */
  sortValue?: (row: T) => string | number;
  align?: 'left' | 'right' | 'center';
  width?: string;
  /** Suppress in the mobile card layout — useful for redundant or decorative cells. */
  hideOnCard?: boolean;
  /** Becomes the card heading in the mobile layout. Mark exactly one column. */
  primary?: boolean;
}

export interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  /** Return the text a row should be matched against. Omit to hide the search box. */
  searchText?: (row: T) => string;
  searchPlaceholder?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  pageSize?: number;
  toolbarExtra?: ReactNode;
  selectable?: boolean;
  renderBulkActions?: (selected: T[], clearSelection: () => void) => ReactNode;
  initialSort?: { key: string; direction: SortDirection };
}

function compare(a: string | number, b: string | number): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * Sortable, searchable, paginated table with a card layout on narrow screens.
 *
 * Replaces the three hand-rolled `<table>` blocks in the old AdminPortal, which between them
 * had search on products only, no sorting, no pagination, and turned into a horizontal
 * scrollbar on a phone.
 */
export function DataTable<T>({
  rows,
  columns,
  rowKey,
  loading = false,
  error = null,
  onRetry,
  searchText,
  searchPlaceholder = 'Search…',
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  emptyAction,
  pageSize = 10,
  toolbarExtra,
  selectable = false,
  renderBulkActions,
  initialSort,
}: DataTableProps<T>) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(initialSort?.key ?? null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialSort?.direction ?? 'asc');
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());

  // The page is tagged with the search/sort it belongs to, so changing either implicitly returns
  // to page 1 without an effect that would cascade a second render.
  const view = `${query}|${sortKey ?? ''}|${sortDirection}`;
  const [pageState, setPageState] = useState({ view, page: 1 });
  const page = pageState.view === view ? pageState.page : 1;
  const setPage = (next: number) => setPageState({ view, page: next });

  const isCompact = useMediaQuery('(max-width: 860px)');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle || !searchText) return rows;
    return rows.filter((row) => searchText(row).toLowerCase().includes(needle));
  }, [rows, query, searchText]);

  const sorted = useMemo(() => {
    const column = columns.find((candidate) => candidate.key === sortKey);
    if (!column?.sortValue) return filtered;
    const { sortValue } = column;
    const factor = sortDirection === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => compare(sortValue(a), sortValue(b)) * factor);
  }, [filtered, columns, sortKey, sortDirection]);

  // Derive the page rather than storing it, so deleting the last row of the last page cannot
  // strand the view on a page that no longer exists.
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const visible = sorted.slice(start, start + pageSize);

  const toggleSort = (column: Column<T>) => {
    if (!column.sortValue) return;
    if (sortKey === column.key) {
      setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(column.key);
      setSortDirection('asc');
    }
  };

  const clearSelection = () => setSelected(new Set());

  const toggleRow = (key: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const visibleKeys = visible.map(rowKey);
  const allVisibleSelected = visibleKeys.length > 0 && visibleKeys.every((key) => selected.has(key));

  const toggleAllVisible = () => {
    setSelected((current) => {
      const next = new Set(current);
      if (allVisibleSelected) visibleKeys.forEach((key) => next.delete(key));
      else visibleKeys.forEach((key) => next.add(key));
      return next;
    });
  };

  const selectedRows = rows.filter((row) => selected.has(rowKey(row)));
  const cardColumns = columns.filter((column) => !column.hideOnCard);
  const primaryColumn = columns.find((column) => column.primary);

  const toolbar = (searchText || toolbarExtra) && (
    <div className="dt-toolbar">
      {searchText && (
        <div className="dt-search">
          <Icon name="search" size={17} className="dt-search-icon" />
          <input
            type="search"
            className="input dt-search-input"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label={searchPlaceholder}
          />
        </div>
      )}
      {toolbarExtra}
    </div>
  );

  if (loading) {
    return (
      <div className="dt">
        {toolbar}
        <div className="dt-skeleton">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} height="52px" radius="var(--radius-md)" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dt">
        {toolbar}
        <EmptyState
          tone="error"
          title="We couldn't load this"
          description={error}
          action={
            onRetry && (
              <Button variant="secondary" iconLeft="refresh" onClick={onRetry}>
                Try again
              </Button>
            )
          }
        />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="dt">
        {toolbar}
        <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
      </div>
    );
  }

  return (
    <div className="dt">
      {toolbar}

      {selectable && selectedRows.length > 0 && renderBulkActions && (
        <div className="dt-bulk">
          <span className="dt-bulk-count">
            {selectedRows.length} selected
          </span>
          <div className="dt-bulk-actions">{renderBulkActions(selectedRows, clearSelection)}</div>
          <button type="button" className="dt-bulk-clear" onClick={clearSelection}>
            Clear
          </button>
        </div>
      )}

      {sorted.length === 0 ? (
        <EmptyState
          icon="search"
          compact
          title="No matches"
          description={`Nothing matched “${query}”. Try a different search.`}
          action={
            <Button variant="secondary" size="sm" onClick={() => setQuery('')}>
              Clear search
            </Button>
          }
        />
      ) : isCompact ? (
        <ul className="dt-cards">
          {visible.map((row) => {
            const key = rowKey(row);
            return (
              <li key={key} className="dt-card">
                {selectable && (
                  <label className="dt-card-select">
                    <input
                      type="checkbox"
                      checked={selected.has(key)}
                      onChange={() => toggleRow(key)}
                      aria-label="Select row"
                    />
                  </label>
                )}
                {primaryColumn && <div className="dt-card-title">{primaryColumn.render(row)}</div>}
                <dl className="dt-card-fields">
                  {cardColumns
                    .filter((column) => column !== primaryColumn)
                    .map((column) => (
                      <div key={column.key} className="dt-card-field">
                        <dt>{column.header}</dt>
                        <dd>{column.render(row)}</dd>
                      </div>
                    ))}
                </dl>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="dt-scroll">
          <table className="dt-table">
            <thead>
              <tr>
                {selectable && (
                  <th scope="col" className="dt-checkbox-cell">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleAllVisible}
                      aria-label="Select all rows on this page"
                    />
                  </th>
                )}
                {columns.map((column) => {
                  const isSorted = sortKey === column.key;
                  return (
                    <th
                      key={column.key}
                      scope="col"
                      style={{ width: column.width, textAlign: column.align }}
                      aria-sort={
                        isSorted ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined
                      }
                    >
                      {column.sortValue ? (
                        <button
                          type="button"
                          className={cx('dt-sort', isSorted && 'dt-sort-active')}
                          onClick={() => toggleSort(column)}
                        >
                          {column.header}
                          <Icon
                            name={isSorted ? (sortDirection === 'asc' ? 'chevron-up' : 'chevron-down') : 'sort'}
                            size={13}
                          />
                        </button>
                      ) : (
                        column.header
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => {
                const key = rowKey(row);
                return (
                  <tr key={key} className={cx(selected.has(key) && 'dt-row-selected')}>
                    {selectable && (
                      <td className="dt-checkbox-cell">
                        <input
                          type="checkbox"
                          checked={selected.has(key)}
                          onChange={() => toggleRow(key)}
                          aria-label="Select row"
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td key={column.key} style={{ textAlign: column.align }}>
                        {column.render(row)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {sorted.length > pageSize && (
        <div className="dt-pagination">
          <p className="dt-range">
            {start + 1}–{Math.min(start + pageSize, sorted.length)} of {sorted.length}
          </p>
          <div className="dt-pager">
            <Button
              variant="secondary"
              size="sm"
              iconOnly
              iconLeft="chevron-left"
              aria-label="Previous page"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
            />
            <span className="dt-page-label">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              iconOnly
              iconLeft="chevron-right"
              aria-label="Next page"
              disabled={currentPage === totalPages}
              onClick={() => setPage(currentPage + 1)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
