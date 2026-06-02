import { Badge, Card, CardContent } from '../common';
import { MutedText, SectionTitle, StatValue } from '../ui/typography';
import { formatCurrency } from '../../utils/format';

export const PortfolioTotalValueCard = ({ summary, allocation }) => {
  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle>Total value</SectionTitle>
          <Badge variant={summary.totalReturn >= 0 ? 'success' : 'danger'}>
            {summary.totalReturn >= 0 ? 'Positive momentum' : 'Watchlist'}
          </Badge>
        </div>
        <StatValue tone="primary" className="text-3xl">
          {formatCurrency(allocation.total)}
        </StatValue>
        <MutedText>{summary.holdingCount} holdings</MutedText>
      </CardContent>
    </Card>
  );
};

export default PortfolioTotalValueCard;
