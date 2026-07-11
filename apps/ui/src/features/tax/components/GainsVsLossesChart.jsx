import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/card';
import { formatCurrency } from '@/shared/utils';
import { buildGainsVsLossesData } from '../utils/chartHelpers';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;

  const { name, value } = payload[0].payload;
  const isNegative = value < 0;
  return (
    <div className="rounded-lg border border-border bg-surface p-3 shadow-soft">
      <p className="text-sm font-medium text-foreground">{name}</p>
      <p
        className={`text-sm font-semibold tabular-nums ${
          isNegative ? 'text-danger' : 'text-success'
        }`}
      >
        {formatCurrency(value)}
      </p>
    </div>
  );
};

/**
 * GainsVsLossesChart
 *
 * Full FY overview bar chart shown above the harvesting tabs.
 * Includes STCG, LTCG, and intraday gains/losses alongside all
 * harvestable losses (delivery + intraday open positions).
 */
export const GainsVsLossesChart = ({
  summary = {},
  opportunities = [],
  intradayOpportunities = [],
}) => {
  const chartData = buildGainsVsLossesData(summary, opportunities, intradayOpportunities);

  return (
    <Card>
      <CardHeader>
        <CardTitle>FY Gains &amp; Losses Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 16, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: 'var(--muted)', fontFamily: 'inherit' }}
              axisLine={false}
              tickLine={false}
              interval={0}
              height={36}
              // Wrap long labels by truncating — keeps mobile clean
              tickFormatter={(v) => (v.length > 12 ? v.slice(0, 11) + '…' : v)}
            />
            <YAxis
              tickFormatter={(val) => formatCurrency(val)}
              tick={{ fontSize: 11, fill: 'var(--muted)', fontFamily: 'inherit' }}
              axisLine={false}
              tickLine={false}
              width={72}
            />
            <ReferenceLine y={0} stroke="var(--border)" strokeWidth={1} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(96, 165, 250, 0.06)' }} />
            <Bar dataKey="value" name="Amount" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          {chartData.map((entry) => (
            <span key={entry.name} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-sm"
                style={{ backgroundColor: entry.fill }}
              />
              {entry.name}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default GainsVsLossesChart;
