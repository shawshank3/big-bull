import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '@/features/auth';
import { Alert } from '@/shared/ui/alert';
import { Spinner } from '@/shared/ui/spinner';
import { PageHeader } from '@/shared/layout/PageHeader';
import { useGetPortfolioHoldingsQuery, useGetPortfolioSummaryQuery } from '../api/portfolioApi';
import { getAllocation } from '@/shared/utils';
import { HoldingsBreakdown } from './HoldingsBreakdown';
import { PortfolioOverviewCard } from './PortfolioOverviewCard';
import { TaxQuickAccess } from './TaxQuickAccess';
import { TopMovers } from './TopMovers';

export const DashboardContent = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const {
    data: holdings = [],
    isLoading: holdingsLoading,
    error,
  } = useGetPortfolioHoldingsQuery(undefined, {
    skip: !isAuthenticated,
    refetchOnMountOrArgChange: true,
  });
  const { data: summary = {}, isLoading: summaryLoading } = useGetPortfolioSummaryQuery(undefined, {
    skip: !isAuthenticated,
    refetchOnMountOrArgChange: true,
  });
  const allocation = getAllocation(holdings);

  const isLoading = holdingsLoading || summaryLoading;

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Dashboard"
          description="A quick view of your portfolio health, allocation, and holdings breakdown."
        />
        <Spinner label="Loading dashboard…" />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="A quick view of your portfolio health, allocation, and holdings breakdown."
      />
      {error ? <Alert variant="danger">Unable to load holdings right now.</Alert> : null}
      <PortfolioOverviewCard summary={summary} allocation={allocation} />
      <TopMovers />
      <HoldingsBreakdown holdings={holdings} isLoading={false} showNavigate />
      <TaxQuickAccess />
    </>
  );
};

export default DashboardContent;
