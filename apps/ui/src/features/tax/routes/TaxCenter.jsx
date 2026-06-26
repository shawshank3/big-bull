import { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '@/features/auth';
import { AppPageLayout } from '@/shared/layout/AppPageLayout';
import { PageHeader } from '@/shared/layout/PageHeader';
import { Card, CardContent } from '@/shared/components/card';
import { Alert } from '@/shared/ui/alert';
import { Spinner } from '@/shared/ui/spinner';
import {
  useGetTaxSummaryQuery,
  useGetTaxGainsQuery,
  useGetTaxHarvestingQuery,
} from '../api/taxApi';
import { useTaxYear } from '../hooks/useTaxYear';
import { TaxYearSelector } from '../components/TaxYearSelector';
import { TaxSummaryCard } from '../components/TaxSummaryCard';
import { GainsFilters } from '../components/GainsFilters';
import { GainsTable } from '../components/GainsTable';
import { HarvestingPreview } from '../components/HarvestingPreview';

const TaxCenterContent = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { taxYear, setTaxYear } = useTaxYear();
  const [assetType, setAssetType] = useState('ALL');
  const [gainType, setGainType] = useState('ALL');

  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
  } = useGetTaxSummaryQuery({ taxYear }, { skip: !isAuthenticated });

  const {
    data: gainsData,
    isLoading: gainsLoading,
    error: gainsError,
  } = useGetTaxGainsQuery({ taxYear, page: 1, limit: 100 }, { skip: !isAuthenticated });

  const { data: harvestingData } = useGetTaxHarvestingQuery(
    { taxYear, minLoss: 0 },
    { skip: !isAuthenticated }
  );

  const gains = gainsData?.gains ?? [];
  const opportunities = harvestingData?.opportunities ?? [];
  const hasError = summaryError || gainsError;

  return (
    <>
      <PageHeader
        title="Tax Center"
        description="Track capital gains and explore tax-loss harvesting opportunities."
        actions={<TaxYearSelector taxYear={taxYear} setTaxYear={setTaxYear} />}
      />

      <Alert variant="warning">
        ⚠️ This feature is for educational purposes only and does not constitute tax advice. Consult
        a qualified tax advisor for real financial decisions.
      </Alert>

      {hasError && <Alert variant="danger">Unable to load tax data. Please try again later.</Alert>}

      {summaryLoading ? (
        <Spinner label="Loading tax summary…" />
      ) : (
        <TaxSummaryCard summary={summary} />
      )}

      <Card>
        <CardContent className="p-0">
          <div className="px-4 pt-4">
            <GainsFilters
              assetType={assetType}
              setAssetType={setAssetType}
              gainType={gainType}
              setGainType={setGainType}
            />
          </div>
          {gainsLoading ? (
            <div className="p-8 text-center">
              <Spinner label="Loading gains…" />
            </div>
          ) : gains.length === 0 ? (
            <div className="py-16 text-center text-muted text-sm">
              No realized gains for this financial year.
            </div>
          ) : (
            <GainsTable gains={gains} assetType={assetType} gainType={gainType} />
          )}
        </CardContent>
      </Card>

      <HarvestingPreview opportunities={opportunities} />
    </>
  );
};

export const TaxCenter = () => (
  <AppPageLayout>
    <AppPageLayout.Content>
      <TaxCenterContent />
    </AppPageLayout.Content>
    <AppPageLayout.Chatbot />
  </AppPageLayout>
);

export default TaxCenter;
