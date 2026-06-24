import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '@/features/auth/store/authSelectors';
import { Alert } from '@/shared/ui/alert';
import { Spinner } from '@/shared/ui/spinner';
import { PageHeader } from '@/shared/layout/PageHeader';
import { useGetPortfolioHoldingsQuery, useGetPortfolioSummaryQuery } from '../api/portfolioApi';
import { getAllocation } from '@/shared/utils';
import { HoldingsBreakdown } from './HoldingsBreakdown';
import { AssetAllocationCard } from './AssetAllocationCard';
import { PortfolioStatsGrid } from './PortfolioStatsGrid';
import { PortfolioTotalValueCard } from './PortfolioTotalValueCard';
import { TaxQuickAccess } from './TaxQuickAccess';

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
        <Spinner label="Loading portfolio…" />
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
      <PortfolioStatsGrid summary={summary} />
      <div className="split-grid">
        <AssetAllocationCard allocation={allocation} />
        <PortfolioTotalValueCard summary={summary} allocation={allocation} />
      </div>
      <HoldingsBreakdown holdings={holdings} isLoading={false} showNavigate />
      <TaxQuickAccess />
    </>
  );
};

export default DashboardContent;
