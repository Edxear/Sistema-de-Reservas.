/**
 * Phase 5 – Skeleton Loader
 * Lightweight animated placeholders used while data is loading.
 *
 * Usage:
 *   import { SkeletonKpiGrid, SkeletonTable, SkeletonLines } from '../components/SkeletonLoader';
 *
 *   {loading ? <SkeletonKpiGrid cards={4} /> : <MyContent />}
 */

import React from 'react';
import styles from './SkeletonLoader.module.css';

// ── Primitives ────────────────────────────────────────────────────────────────

export function SkeletonBlock({ className = '', style = {} }) {
  return <div className={`${styles.block} ${styles.pulse} ${className}`} style={style} />;
}

export function SkeletonLine({ short = false }) {
  return <div className={`${short ? styles.lineSm : styles.line} ${styles.pulse}`} />;
}

export function SkeletonTitle() {
  return <div className={`${styles.title} ${styles.pulse}`} />;
}

// ── Composite presets ─────────────────────────────────────────────────────────

/** Grid of KPI cards (default 4) */
export function SkeletonKpiGrid({ cards = 4 }) {
  return (
    <div className={styles.kpiGrid}>
      {Array.from({ length: cards }).map((_, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <div key={i} className={`${styles.kpiCard} ${styles.pulse}`}>
          <div className={styles.lineSm} />
          <div className={styles.title} style={{ width: '70%', height: 28 }} />
        </div>
      ))}
    </div>
  );
}

/** N skeleton lines inside a card */
export function SkeletonLines({ lines = 4 }) {
  return (
    <div className={styles.card}>
      <div className={styles.title} />
      {Array.from({ length: lines }).map((_, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <div key={i} className={`${styles.line} ${styles.pulse}`} />
      ))}
    </div>
  );
}

/** Table skeleton (header row + N body rows) */
export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className={styles.table} style={{ overflow: 'hidden' }}>
      {/* header */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 8 }}>
        {Array.from({ length: cols }).map((_, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={i} className={`${styles.block} ${styles.pulse}`} style={{ height: 12, borderRadius: 4, background: '#d1e4f8' }} />
        ))}
      </div>
      {/* body */}
      {Array.from({ length: rows }).map((_, r) => (
        // eslint-disable-next-line react/no-array-index-key
        <div key={r} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 8, marginTop: 8 }}>
          {Array.from({ length: cols }).map((__, c) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={c} className={`${styles.block} ${styles.pulse}`} style={{ height: 12, borderRadius: 4 }} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Full-area page skeleton */
export function SkeletonAreaPage() {
  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', padding: '24px 16px', display: 'grid', gap: 16 }}>
      {/* hero */}
      <div style={{ border: '1px solid #d7e4f3', borderRadius: 16, background: '#f8fbff', padding: 18, display: 'grid', gap: 10 }}>
        <div className={`${styles.title} ${styles.pulse}`} style={{ width: '50%', height: 28 }} />
        <div className={`${styles.line} ${styles.pulse}`} style={{ width: '80%' }} />
        <div style={{ display: 'flex', gap: 8 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={`${styles.block} ${styles.pulse}`} style={{ width: 120, height: 28, borderRadius: 999 }} />
          ))}
        </div>
      </div>
      {/* tab bar */}
      <div style={{ display: 'flex', gap: 8 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`${styles.block} ${styles.pulse}`} style={{ width: 100, height: 36, borderRadius: 10 }} />
        ))}
      </div>
      {/* KPIs */}
      <SkeletonKpiGrid cards={4} />
      {/* Table */}
      <SkeletonTable rows={5} cols={4} />
    </div>
  );
}
