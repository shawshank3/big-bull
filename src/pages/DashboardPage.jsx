import { Alert, Badge, Card, CardContent } from '../components/common';
import { MainLayout } from '../components/layout/MainLayout';
import { Spinner } from '../components/ui/spinner';
import { MutedText, PageDescription, PageTitle, SectionTitle, StatValue } from '../components/ui/typography';
import { useGetHoldingsQuery } from '../features/api/apiSlice';
import { formatCurrency, formatPercentage } from '../utils/format';
import { getPortfolioSummary } from '../utils/portfolio';

export const DashboardPage = () => {
  const { data: holdings = [], isLoading, error } = useGetHoldingsQuery();
  const summary = getPortfolioSummary(holdings);

  const stats = [
    { label: 'Total invested', value: formatCurrency(summary.totalInvested) },
    { label: 'Current value', value: formatCurrency(summary.totalValue) },
    { label: 'Total return', value: formatCurrency(summary.totalReturn) },
    { label: 'Return %', value: formatPercentage(summary.returnPercentage) },
  ];

  return (
    <MainLayout>
      <div className="page-shell">
        <div className="page-header">
          <PageTitle>Dashboard</PageTitle>
          <PageDescription>A quick view of your current portfolio health.</PageDescription>
        </div>

        {error ? <Alert variant="danger">Unable to load holdings right now.</Alert> : null}

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

        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SectionTitle>Holdings ({summary.holdingCount})</SectionTitle>
              <Badge variant={summary.totalReturn >= 0 ? 'success' : 'danger'}>
                {summary.totalReturn >= 0 ? 'Positive momentum' : 'Watchlist'}
              </Badge>
            </div>

            {isLoading ? (
              <Spinner label="Loading holdings…" />
            ) : holdings.length === 0 ? (
              <Alert variant="info">No holdings found. Add a holding to see insights here.</Alert>
            ) : (
              <MutedText>The holdings table is available on the holdings page for a full breakdown.</MutedText>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default DashboardPage;
