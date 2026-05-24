import { Alert, Badge, Card, CardContent } from '../components/common';
import { MainLayout } from '../components/layout/MainLayout';
import { Progress } from '../components/ui/progress';
import { Spinner } from '../components/ui/spinner';
import { MutedText, PageDescription, PageTitle, SectionTitle, StatValue } from '../components/ui/typography';
import { useGetHoldingsQuery } from '../features/api/apiSlice';
import { formatCurrency } from '../utils/format';
import { getAllocation } from '../utils/portfolio';

const allocationRows = [
  { label: 'Mutual funds', key: 'mutual', colorClass: 'bg-primary' },
  { label: 'Stocks', key: 'stock', colorClass: 'bg-secondary' },
];

export const PortfolioPage = () => {
  const { data: holdings = [], isLoading, error } = useGetHoldingsQuery();
  const allocation = getAllocation(holdings);

  const getAllocationValue = (key) => (key === 'mutual' ? allocation.mutualAllocation : allocation.stockAllocation);
  const getAllocationAmount = (key) => (key === 'mutual' ? allocation.mutualValue : allocation.stockValue);

  const sections = [
    { label: 'Mutual funds', items: holdings.filter((holding) => holding.type === 'mutual') },
    { label: 'Stocks', items: holdings.filter((holding) => holding.type === 'stock') },
  ];

  return (
    <MainLayout>
      <div className="page-shell">
        <div className="page-header">
          <PageTitle>Portfolio</PageTitle>
          <PageDescription>
            A higher-level look at how your wealth is split across mutual funds and stocks.
          </PageDescription>
        </div>

        {error ? <Alert variant="danger">Unable to load portfolio data.</Alert> : null}

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
                  <Progress
                    value={getAllocationValue(row.key)}
                    indicatorClassName={row.colorClass}
                  />
                  <MutedText>{formatCurrency(getAllocationAmount(row.key))}</MutedText>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 pt-6">
              <SectionTitle>Total value</SectionTitle>
              <StatValue tone="primary" className="text-3xl">
                {formatCurrency(allocation.total)}
              </StatValue>
              <Badge variant="info">Live market snapshot</Badge>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <Spinner label="Loading portfolio…" />
        ) : (
          <div className="split-grid">
            {sections.map((section) => (
              <Card key={section.label}>
                <CardContent className="space-y-4 pt-6">
                  <SectionTitle>{section.label}</SectionTitle>
                  {section.items.length === 0 ? (
                    <Alert variant="info">No {section.label.toLowerCase()} in your portfolio.</Alert>
                  ) : (
                    <ul className="space-y-2">
                      {section.items.map((holding) => (
                        <li key={holding._id} className="flex items-center justify-between gap-3">
                          <p className="font-bold text-foreground">{holding.name || holding.symbol}</p>
                          <MutedText as="span">{holding.qty} units</MutedText>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default PortfolioPage;
