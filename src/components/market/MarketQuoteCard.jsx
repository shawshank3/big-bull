import { Alert, Card, CardContent, CardDescription, CardHeader, CardTitle } from '../common';
import { Spinner } from '../ui/spinner';
import { formatCurrency, formatMarketDate } from '@/utils';

export const MarketQuoteCard = ({
  title,
  subtitle,
  quote,
  isLoading,
  isError,
  emptyMessage = 'Price data is not available.',
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-3 py-16">
          <Spinner label="Loading today's price…" className="py-4" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return <Alert variant="danger">Unable to load price data right now.</Alert>;
  }

  if (!quote?.price && quote?.price !== 0) {
    return <Alert variant="warning">{emptyMessage}</Alert>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {subtitle ? <CardDescription>{subtitle}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-muted">
            Today&apos;s {quote.priceLabel?.toLowerCase() ?? 'price'}
          </p>
          <p className="text-4xl font-black tracking-tight text-foreground">
            {formatCurrency(quote.price, quote.currency || 'INR')}
          </p>
        </div>

        {quote.asOf ? (
          <p className="text-sm text-muted">As of {formatMarketDate(quote.asOf)}</p>
        ) : null}

        <p className="text-sm text-muted">
          Charts, history, and additional metrics will appear here in a future update.
        </p>
      </CardContent>
    </Card>
  );
};

export default MarketQuoteCard;
