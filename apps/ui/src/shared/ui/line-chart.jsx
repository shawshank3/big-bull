// Tier 2 — Prop-Based Component
/**
 * LineChart — atomic shadcn-style Recharts wrapper.
 *
 * Follows the same forwardRef + cn() + CSS-variable-token conventions as
 * every other component in shared/ui. Recharts internals are hidden behind
 * this surface so callers never import from recharts directly.
 *
 * Props:
 *   points         {Array<{ timestamp: string, price: number }>}  required
 *   color          'up' | 'down' | 'neutral'   default 'neutral'
 *   height         number                       default 220
 *   formatY        (value: number) => string    default plain number
 *   formatX        (iso: string) => string      default HH:MM for intraday,
 *                                               DD MMM for daily
 *   granularity    '30s' | 'daily'              drives default formatX
 *   baseline       number                       optional horizontal reference
 *                                               line price; renders a dashed
 *                                               muted line + label
 *   baselineLabel  string                       short label for the baseline
 *                                               line (e.g. "Prev close")
 *   className      string
 */

import * as React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/shared/utils/format';

// ─── Colour map: prop → CSS variable ─────────────────────────────────────────
const STROKE = {
  up: 'var(--success)',
  down: 'var(--danger)',
  neutral: 'var(--primary)',
};

// ─── Default formatters ───────────────────────────────────────────────────────

const formatIntraday = (iso) => {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

const formatDaily = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, labelFormatter, valueFormatter }) => {
  if (!active || !payload?.length) return null;
  const { timestamp, price } = payload[0].payload;
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 shadow-soft text-xs">
      <p className="text-muted mb-1">{labelFormatter(timestamp)}</p>
      <p className="font-semibold text-foreground">{valueFormatter(price)}</p>
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

export const LineChart = React.forwardRef(
  (
    {
      points = [],
      color = 'neutral',
      height = 220,
      granularity = '30s',
      formatY,
      formatX,
      baseline,
      baselineLabel,
      className,
      ...props
    },
    ref
  ) => {
    const stroke = STROKE[color] ?? STROKE.neutral;
    const gradientId = React.useId();

    const defaultFormatX = granularity === 'daily' ? formatDaily : formatIntraday;
    const xFormatter = formatX ?? defaultFormatX;
    const yFormatter = formatY ?? ((v) => formatCurrency(Math.round(v)));

    const hasBaseline = typeof baseline === 'number' && isFinite(baseline);

    // Compute y-axis domain with a small buffer so the line doesn't hug edges.
    // Include the baseline value so the reference line is always visible.
    const prices = points.map((p) => p.price);
    const allValues = hasBaseline ? [...prices, baseline] : prices;
    const minPrice = allValues.length ? Math.min(...allValues) : 0;
    const maxPrice = allValues.length ? Math.max(...allValues) : 1;
    const buffer = (maxPrice - minPrice) * 0.08 || maxPrice * 0.05 || 1;
    const yMin = Math.max(0, minPrice - buffer);
    const yMax = maxPrice + buffer;

    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 4 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={stroke} stopOpacity={0.18} />
                <stop offset="95%" stopColor={stroke} stopOpacity={0.01} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 4" stroke="var(--border)" vertical={false} />

            <XAxis
              dataKey="timestamp"
              tickFormatter={xFormatter}
              tick={{ fontSize: 10, fill: 'var(--muted)', fontFamily: 'inherit' }}
              axisLine={false}
              tickLine={false}
              minTickGap={40}
            />

            <YAxis
              domain={[yMin, yMax]}
              tickFormatter={yFormatter}
              tick={{ fontSize: 10, fill: 'var(--muted)', fontFamily: 'inherit' }}
              axisLine={false}
              tickLine={false}
              width={56}
              tickCount={4}
            />

            <Tooltip
              content={<ChartTooltip labelFormatter={xFormatter} valueFormatter={formatCurrency} />}
              cursor={{ stroke: 'var(--border)', strokeWidth: 1 }}
            />

            {hasBaseline && (
              <ReferenceLine
                y={baseline}
                stroke="var(--muted)"
                strokeDasharray="4 4"
                strokeWidth={1}
                ifOverflow="extendDomain"
                label={{
                  value: baselineLabel
                    ? `${baselineLabel} ${formatCurrency(baseline)}`
                    : formatCurrency(baseline),
                  position: 'insideTopLeft',
                  fill: 'var(--muted)',
                  fontSize: 10,
                  fontFamily: 'inherit',
                }}
              />
            )}

            <Area
              type="monotone"
              dataKey="price"
              stroke={stroke}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 4, fill: stroke, strokeWidth: 0 }}
              isAnimationActive={points.length < 200}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }
);

LineChart.displayName = 'LineChart';
