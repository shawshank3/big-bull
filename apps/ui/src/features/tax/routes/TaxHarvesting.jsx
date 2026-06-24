import { AppPageLayout } from '@/shared/layout/AppPageLayout';
import { PageHeader } from '@/shared/layout/PageHeader';
import { Alert } from '@/shared/ui/alert';
import { Spinner } from '@/shared/ui/spinner';
import { useGetTaxSummaryQuery, useGetTaxHarvestingQuery } from '../api/taxApi';
import { useTaxYear } from '../hooks/useTaxYear';
import { useThreshold } from '../hooks/useThreshold';
import { useWhatIfSimulator } from '../hooks/useWhatIfSimulator';
import { TaxYearSelector } from '../components/TaxYearSelector';
import { HarvestingMetrics } from '../components/HarvestingMetrics';
import { GainsVsLossesChart } from '../components/GainsVsLossesChart';
import { SectorHeatmap } from '../components/SectorHeatmap';
import { ThresholdConfig } from '../components/ThresholdConfig';
import { EnhancedOpportunitiesTable } from '../components/EnhancedOpportunitiesTable';
import { WhatIfPanel } from '../components/WhatIfPanel';

const TaxHarvestingContent = () => {
  const { taxYear, setTaxYear } = useTaxYear();
  const { threshold } = useThreshold();

  const { data: summary } = useGetTaxSummaryQuery({ taxYear });
  const { data: harvesting, isLoading } = useGetTaxHarvestingQuery({
    taxYear,
    minLoss: threshold,
  });

  const opportunities = harvesting?.opportunities ?? [];

  const {
    selectedIds,
    toggleSelection,
    resetSelection,
    hasSelection,
    selectedLossesTotal,
    currentFYGain,
    postHarvestGain,
    taxBefore,
    taxAfter,
    netSavings,
  } = useWhatIfSimulator(summary, opportunities);

  return (
    <>
      <PageHeader
        title="Tax-Loss Harvesting Insights"
        actions={
          <div className="flex items-center gap-2">
            <ThresholdConfig />
            <TaxYearSelector taxYear={taxYear} setTaxYear={setTaxYear} />
          </div>
        }
      />

      <Alert variant="warning">
        ⚠️ This feature is for educational purposes only and does not constitute tax advice. Consult
        a qualified tax advisor for real financial decisions.
      </Alert>

      {isLoading ? (
        <Spinner label="Loading harvesting insights…" />
      ) : (
        <div className={`flex flex-col gap-6 ${hasSelection ? 'pb-56' : ''}`}>
          <HarvestingMetrics opportunities={opportunities} />
          <GainsVsLossesChart summary={summary} opportunities={opportunities} />
          <SectorHeatmap opportunities={opportunities} />
          <EnhancedOpportunitiesTable
            opportunities={opportunities}
            selectedIds={selectedIds}
            onToggleSelection={toggleSelection}
          />
        </div>
      )}

      {hasSelection && (
        <WhatIfPanel
          selectedLossesTotal={selectedLossesTotal}
          currentFYGain={currentFYGain}
          postHarvestGain={postHarvestGain}
          taxBefore={taxBefore}
          taxAfter={taxAfter}
          netSavings={netSavings}
          onReset={resetSelection}
        />
      )}
    </>
  );
};

export const TaxHarvesting = () => (
  <AppPageLayout>
    <AppPageLayout.Content>
      <TaxHarvestingContent />
    </AppPageLayout.Content>
    <AppPageLayout.Chatbot />
  </AppPageLayout>
);

export default TaxHarvesting;
