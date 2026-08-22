import { cx } from '../../lib/format';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  radius?: string;
  className?: string;
}

export function Skeleton({ width = '100%', height = '1rem', radius, className }: SkeletonProps) {
  return (
    <span
      className={cx('skeleton', className)}
      style={{ width, height, borderRadius: radius, display: 'block' }}
      aria-hidden="true"
    />
  );
}

export interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

/** The last line is shortened so a block of them reads as text rather than as bars. */
export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <span className={cx('skeleton-text', className)} aria-hidden="true">
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          height="0.7rem"
          width={index === lines - 1 ? '60%' : '100%'}
          radius="var(--radius-full)"
        />
      ))}
    </span>
  );
}
