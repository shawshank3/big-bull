import { useSelector } from 'react-redux';
import { Alert, Badge, Card, CardContent, Tabs, TabsContent, TabsList, TabsTrigger } from '../components/common';
import { MainLayout } from '../components/layout/MainLayout';
import { Progress } from '../components/ui/progress';
import { Spinner } from '../components/ui/spinner';
import { MutedText, PageDescription, PageTitle, SectionTitle, StatValue } from '../components/ui/typography';
import { HOLDING_TABS, HOLDING_TYPES } from '../constants/holdings';
import { useGetHoldingsQuery } from '../api/apiSlice';
import { formatCurrency, formatPercentage } from '../utils/format';
import { getAllocation, getPortfolioSummary } from '../utils/portfolio';

const allocationRows = [
  { label: 'Mutual funds', key: 'mutual', colorClass: 'bg-primary' },
  { label: 'Stocks', key: 'stock', colorClass: 'bg-secondary' },
];

export const DashboardPage = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { data: holdings = [], isLoading, error } = useGetHoldingsQuery(undefined, {
    skip: !isAuthenticated,
  });
  const summary = getPortfolioSummary(holdings);
  const allocation = getAllocation(holdings);

  const getAllocationValue = (key) => (key === 'mutual' ? allocation.mutualAllocation : allocation.stockAllocation);
  const getAllocationAmount = (key) => (key === 'mutual' ? allocation.mutualValue : allocation.stockValue);

  const stats = [
    { label: 'Total invested', value: formatCurrency(summary.totalInvested) },
    { label: 'Current value', value: formatCurrency(summary.totalValue) },
    { label: 'Total return', value: formatCurrency(summary.totalReturn) },
    { label: 'Return %', value: formatPercentage(summary.returnPercentage) },
  ];

  const holdingsByType = (type) => holdings.filter((holding) => holding.type === type);

  return (
    <MainLayout>
      <div className="page-shell">
        <div className="page-header">
          <PageTitle>Dashboard</PageTitle>
          <PageDescription>
            A quick view of your portfolio health, allocation, and holdings breakdown.
          </PageDescription>
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

        <div className="split-grid">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <SectionTitle>Asset allocation</SectionTitle>
              {allocationRows.map((row) => (
                <div key={row.key} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-foreground">{row.label}</p>
                    <p className="font-bold text-foreground">{getAllocationValue(row.key).toFixed(2)}%</p>
                  </div>
                  <Progress value={getAllocationValue(row.key)} indicatorClassName={row.colorClass} />
                  <MutedText>{formatCurrency(getAllocationAmount(row.key))}</MutedText>
                </div>
              ))}
            </CardContent>
          </Card>

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
        </div>

        {isLoading ? (
          <Spinner label="Loading holdings…" />
        ) : holdings.length === 0 ? (
          <Alert variant="info">No holdings found. Add a holding to see insights here.</Alert>
        ) : (
          <Card>
            <CardContent className="space-y-4 pt-6">
              <SectionTitle>Holdings breakdown</SectionTitle>
              <Tabs defaultValue={HOLDING_TYPES.MUTUAL}>
                <TabsList>
                  {HOLDING_TABS.map((tab) => (
                    <TabsTrigger key={tab.key} value={tab.key}>
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {HOLDING_TABS.map((tab) => {
                  const items = holdingsByType(tab.key);

                  return (
                    <TabsContent key={tab.key} value={tab.key}>
                      {items.length === 0 ? (
                        <Alert variant="info">No {tab.label.toLowerCase()} in your portfolio.</Alert>
                      ) : (
                        <ul className="space-y-2">
                          {items.map((holding) => (
                            <li key={holding._id} className="flex items-center justify-between gap-3">
                              <p className="font-bold text-foreground">{holding.name || holding.symbol}</p>
                              <MutedText as="span">{holding.qty} units</MutedText>
                            </li>
                          ))}
                        </ul>
                      )}
                    </TabsContent>
                  );
                })}
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default DashboardPage;
