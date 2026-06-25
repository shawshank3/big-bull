import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/card';
import { formatCurrency } from '@/shared/utils';
import { buildGainsVsLossesData } from '../utils/chartHelpers';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;

  const { name, value } = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-surface p-3 shadow-soft">
      <p className="text-sm font-medium text-foreground">{name}</p>
      <p className="text-sm text-muted">{formatCurrency(value)}</p>
    </div>
  );
};

export const GainsVsLossesChart = ({ summary = {}, opportunities = [] }) => {
  const chartData = buildGainsVsLossesData(summary, opportunities);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gains vs Losses Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} className="fill-muted" />
            <YAxis
              tickFormatter={(val) => formatCurrency(val)}
              tick={{ fontSize: 12 }}
              className="fill-muted"
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(96, 165, 250, 0.08)' }} />
            <Bar dataKey="value" name="Amount" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default GainsVsLossesChart;
