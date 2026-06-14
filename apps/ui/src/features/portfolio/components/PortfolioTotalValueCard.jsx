import { Badge } from '@/shared/ui/badge';
import { Card, CardContent } from '@/shared/ui/card';
import { MutedText, SectionTitle, StatValue } from '@/shared/ui/typography';
import { formatCurrency } from '@/shared/utils';

export const PortfolioTotalValueCard = ({ summary = {}, allocation = {} }) => {
  const totalPnL = summary.totalPnL ?? summary.totalReturn ?? 0;
  const holdingCount = summary.holdingCount ?? 0;
  const totalValue = allocation.total ?? 0;
  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle>Total value</SectionTitle>
          <Badge variant={totalPnL >= 0 ? 'success' : 'danger'}>
            {totalPnL >= 0 ? 'Positive momentum' : 'Watchlist'}
          </Badge>
        </div>
        <StatValue tone="primary" className="text-3xl">
          {formatCurrency(totalValue)}
        </StatValue>
        <MutedText>{holdingCount} holdings</MutedText>
      </CardContent>
    </Card>
  );
};

export default PortfolioTotalValueCard;
