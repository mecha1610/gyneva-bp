import styles from './KpiSkeleton.module.css';

interface Props {
  count?: number;
  gridClassName?: string;
}

/**
 * Renders `count` shimmer placeholder cards that match the KPI card dimensions.
 * Wrap in the page's kpiGrid class via `gridClassName`.
 */
export default function KpiSkeleton({ count = 4, gridClassName }: Props) {
  return (
    <div className={gridClassName}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.skeleton} aria-hidden="true" />
      ))}
    </div>
  );
}
