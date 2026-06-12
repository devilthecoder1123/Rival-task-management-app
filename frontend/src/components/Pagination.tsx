'use client';

import clsx from 'clsx';

interface Props {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null;

  // Build a compact page-window: first, last, current ±1, with ellipses.
  const pages: (number | 'ellipsis')[] = [];
  const push = (p: number | 'ellipsis') => pages.push(p);

  const windowAround = new Set<number>();
  [1, totalPages, page - 1, page, page + 1].forEach((p) => {
    if (p >= 1 && p <= totalPages) windowAround.add(p);
  });
  const sorted = Array.from(windowAround).sort((a, b) => a - b);

  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) push('ellipsis');
    push(p);
    prev = p;
  }

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="Pagination">
      <button
        type="button"
        className="btn btn-secondary px-3 py-1.5"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        ← Prev
      </button>

      {pages.map((p, i) =>
        p === 'ellipsis' ? (
          <span key={`e-${i}`} className="px-2 text-muted-foreground">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            className={clsx(
              'btn px-3 py-1.5',
              p === page ? 'btn-primary' : 'btn-secondary',
            )}
            onClick={() => onPageChange(p)}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        className="btn btn-secondary px-3 py-1.5"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        Next →
      </button>
    </nav>
  );
}
