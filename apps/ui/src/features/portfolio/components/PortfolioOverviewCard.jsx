import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/shared/components/card';
import { Progress } from '@/shared/ui/progress';
import { MutedText, SectionTitle } from '@/shared/ui/typography';
import { formatCurrency, formatPercentage } from '@/shared/utils';
import { getAllocationValue, getAllocationAmount } from '../utils/allocation';

const ALLOCATION_ROWS = [
  { label: 'Mutual funds', key: 'mutual', colorClass: 'bg-primary' },
  { label: 'Stocks', key: 'stock', colorClass: 'bg-secondary' },
];

export const PortfolioOverviewCard = ({ summary = {}, allocation = {} }) => {
  const totalValue = allocation.total ?? 0;
  const totalPnL = summary.totalPnL ?? summary.totalReturn ?? 0;
  const totalPnLPercent = summary.totalPnLPercent ?? summary.returnPercentage ?? 0;
  const holdingCount = summary.holdingCount ?? 0;

  const isPositive = totalPnL > 0;
  const isNeutral = totalPnL === 0;

  const Icon = isPositive ? TrendingUp : isNeutral ? Minus : TrendingDown;
  const deltaColor = isPositive ? 'text-success' : isNeutral ? 'text-muted' : 'text-danger';

  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        {/* Total Value — Hero */}
        <div className="space-y-1">
          <MutedText>Total value</MutedText>
          <p className="text-3xl font-extrabold text-primary tabular-nums">
            {formatCurrency(totalValue)}
          </p>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 text-sm font-semibold tabular-nums ${deltaColor}`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {isPositive ? '+' : ''}
              {formatCurrency(totalPnL)} ({isPositive ? '+' : ''}
              {formatPercentage(totalPnLPercent)})
            </span>
            <MutedText as="span" className="text-xs">
              · {holdingCount} holdings
            </MutedText>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-border" />

        {/* Asset Allocation */}
        <div className="space-y-4">
          <SectionTitle className="text-base">Asset allocation</SectionTitle>
          {ALLOCATION_ROWS.map((row) => (
            <div key={row.key} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-foreground">{row.label}</p>
                <p className="font-bold text-foreground">
                  {getAllocationValue(allocation, row.key).toFixed(2)}%
                </p>
              </div>
              <Progress
                value={getAllocationValue(allocation, row.key)}
                indicatorClassName={row.colorClass}
              />
              <MutedText>{formatCurrency(getAllocationAmount(allocation, row.key))}</MutedText>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PortfolioOverviewCard;
