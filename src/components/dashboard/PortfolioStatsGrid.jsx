import { Card, CardContent } from '../common';
import { MutedText, StatValue } from '../ui/typography';
import { formatCurrency, formatPercentage } from '@/utils';

export const PortfolioStatsGrid = ({ summary }) => {
  const stats = [
    { label: 'Total invested', value: formatCurrency(summary.totalInvested) },
    { label: 'Current value', value: formatCurrency(summary.totalValue) },
    { label: 'Total return', value: formatCurrency(summary.totalReturn) },
    { label: 'Return %', value: formatPercentage(summary.returnPercentage) },
  ];

  return (
    <div className="stat-grid">
      {stats.map((item) => (
        <Card key={item.label}>
          <CardContent className="space-y-1 pt-6">
            <MutedText>{item.label}</MutedText>
            <StatValue>{item.value}</StatValue>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PortfolioStatsGrid;
