/**
 * HoldingsContent
 * Displays transaction-derived portfolio holdings from GET /api/v1/portfolio/holdings.
 * All values (quantity, avg cost, P&L) are computed on the server from the Transaction ledger.
 */
import { useSelector } from 'react-redux';
import { Alert, Card, CardContent, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../common';
import { PageHeader } from '../layout/PageHeader';
import { Spinner } from '../ui/spinner';
import { MutedText, StatValue } from '../ui/typography';
import { useGetPortfolioHoldingsQuery, useGetPortfolioSummaryQuery } from '../../api/portfolioApi';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n ?? 0);

const pct = (n) =>
  `${n >= 0 ? '+' : ''}${(n ?? 0).toFixed(2)}%`;

const SummaryBar = ({ summary }) => (
  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
    {[
      { label: 'Invested',     value: fmt(summary?.totalInvested) },
      { label: 'Current value', value: fmt(summary?.currentValue) },
      { label: 'Total P&L',
        value: fmt(summary?.totalPnL),
        className: summary?.totalPnL >= 0 ? 'text-success' : 'text-danger' },
      { label: 'Cash balance', value: fmt(summary?.cashBalance) },
    ].map(({ label, value, className }) => (
      <Card key={label}>
        <CardContent className="py-4">
          <p className="text-xs text-muted mb-1">{label}</p>
          <p className={['text-lg font-bold tabular-nums', className ?? ''].join(' ')}>{value}</p>
        </CardContent>
      </Card>
    ))}
  </div>
);

const HoldingRow = ({ holding }) => {
  const pnlUp = holding.unrealisedPnL >= 0;
  return (
    <TableRow key={holding.assetId}>
      <TableCell>
        <p className="font-semibold">{holding.asset?.ticker}</p>
        <MutedText className="text-xs truncate max-w-[160px]">{holding.asset?.name}</MutedText>
      </TableCell>
      <TableCell className="text-right">{holding.netQuantity}</TableCell>
      <TableCell className="text-right">{fmt(holding.avgCostBasis)}</TableCell>
      <TableCell className="text-right">{fmt(holding.currentPrice)}</TableCell>
      <TableCell className="text-right">
        <div className="space-y-0.5">
          <StatValue tone={pnlUp ? 'success' : 'danger'} className="text-sm">
            {fmt(holding.unrealisedPnL)}
          </StatValue>
          <MutedText as="span" className="text-xs">
            {pct(holding.unrealisedPnLPercent)}
          </MutedText>
        </div>
      </TableCell>
    </TableRow>
  );
};

export const HoldingsContent = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  const { data: summary, isLoading: summaryLoading } = useGetPortfolioSummaryQuery(undefined, {
    skip: !isAuthenticated,
  });

  const { data: holdingsData, isLoading, error } = useGetPortfolioHoldingsQuery(undefined, {
    skip: !isAuthenticated,
    pollingInterval: 30000, // refresh with SSE tick cadence
  });

  const holdings = holdingsData ?? [];

  return (
    <>
      <PageHeader
        title="Portfolio"
        description="Holdings are derived from your transaction history in real time."
      />

      {summaryLoading ? null : <SummaryBar summary={summary} />}

      {error ? <Alert variant="danger">Unable to load holdings right now.</Alert> : null}

      {isLoading ? (
        <Spinner label="Loading holdings…" />
      ) : holdings.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted">
            No holdings yet. Buy some assets from the Market page to get started.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Asset</TableHeader>
                  <TableHeader className="text-right">Qty</TableHeader>
                  <TableHeader className="text-right">Avg Cost</TableHeader>
                  <TableHeader className="text-right">Price</TableHeader>
                  <TableHeader className="text-right">Unrealised P&L</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {holdings.map((h) => (
                  <HoldingRow key={h.assetId} holding={h} />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default HoldingsContent;
