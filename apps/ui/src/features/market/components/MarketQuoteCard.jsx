import { createContext, useContext } from 'react';
import { Alert } from '@/shared/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Spinner } from '@/shared/ui/spinner';
import { formatCurrency, formatMarketDate } from '@/shared/utils';

const MarketQuoteContext = createContext(null);
const useMarketQuote = () => {
  const ctx = useContext(MarketQuoteContext);
  if (!ctx)
    throw new Error('MarketQuoteCard compound components must be used within MarketQuoteCard');
  return ctx;
};

const Loading = ({ children = "Loading today's price…" }) => {
  const { isLoading } = useMarketQuote();
  if (!isLoading) return null;
  return (
    <Card>
      <CardContent className="flex items-center justify-center gap-3 py-16">
        <Spinner label={children} className="py-4" />
      </CardContent>
    </Card>
  );
};
const Error = ({ children = 'Unable to load price data right now.' }) => {
  const { isError } = useMarketQuote();
  if (!isError) return null;
  return <Alert variant="danger">{children}</Alert>;
};
const Empty = ({ children = 'Price data is not available.' }) => {
  const { quote, isLoading, isError } = useMarketQuote();
  if (isLoading || isError || quote?.price || quote?.price === 0) return null;
  return <Alert variant="warning">{children}</Alert>;
};
const Data = ({ children, className }) => {
  const { quote, isLoading, isError } = useMarketQuote();
  if (isLoading || isError || (!quote?.price && quote?.price !== 0)) return null;
  return <Card className={className}>{children}</Card>;
};
const Header = ({ title, subtitle }) => (
  <CardHeader>
    <CardTitle>{title}</CardTitle>
    {subtitle && <CardDescription>{subtitle}</CardDescription>}
  </CardHeader>
);
const Content = ({ children }) => <CardContent className="space-y-4">{children}</CardContent>;
const Price = ({ value, currency = 'INR', label = 'price' }) => (
  <div>
    <p className="text-sm font-medium text-muted">Today&apos;s {label?.toLowerCase() ?? 'price'}</p>
    <p className="text-4xl font-black tracking-tight text-foreground">
      {formatCurrency(value, currency)}
    </p>
  </div>
);
const AsOf = ({ date }) =>
  date ? <p className="text-sm text-muted">As of {formatMarketDate(date)}</p> : null;
const Notice = ({ children }) => <p className="text-sm text-muted">{children}</p>;

export const MarketQuoteCard = ({ quote, isLoading, isError, children }) => (
  <MarketQuoteContext.Provider value={{ quote, isLoading, isError }}>
    {children}
  </MarketQuoteContext.Provider>
);
MarketQuoteCard.Loading = Loading;
MarketQuoteCard.Error = Error;
MarketQuoteCard.Empty = Empty;
MarketQuoteCard.Data = Data;
MarketQuoteCard.Header = Header;
MarketQuoteCard.Content = Content;
MarketQuoteCard.Price = Price;
MarketQuoteCard.AsOf = AsOf;
MarketQuoteCard.Notice = Notice;

export default MarketQuoteCard;
