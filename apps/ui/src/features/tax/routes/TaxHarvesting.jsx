import { AppPageLayout } from '@/shared/layout/AppPageLayout';
import { PageHeader } from '@/shared/layout/PageHeader';
import { Alert } from '@/shared/ui/alert';
import { Spinner } from '@/shared/ui/spinner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/tabs';
import { useGetTaxSummaryQuery, useGetTaxHarvestingQuery } from '../api/taxApi';
import { useTaxYear } from '../hooks/useTaxYear';
import { useThreshold } from '../hooks/useThreshold';
import { useSlabRate } from '../hooks/useSlabRate';
import { useWhatIfSimulator } from '../hooks/useWhatIfSimulator';
import { TaxYearSelector } from '../components/TaxYearSelector';
import { HarvestingMetrics } from '../components/HarvestingMetrics';
import { GainsVsLossesChart } from '../components/GainsVsLossesChart';
import { SectorHeatmap } from '../components/SectorHeatmap';
import { ThresholdConfig } from '../components/ThresholdConfig';
import { SlabRateConfig } from '../components/SlabRateConfig';
import { EnhancedOpportunitiesTable } from '../components/EnhancedOpportunitiesTable';
import { WhatIfPanel } from '../components/WhatIfPanel';
import { IntradayHarvestingSection } from '../components/IntradayHarvestingSection';
import { getCurrentFY, formatFYLabel } from '../utils/taxFormatters';

/**
 * Delivery tab content (STCG or LTCG) — shared layout for both buckets.
 */
const DeliveryTab = ({ bucket, opportunities, summary, slabRate }) => {
  const bucketOpps = opportunities.filter((o) => o.lossType === bucket);

  const {
    selectedIds,
    toggleSelection,
    selectAll,
    resetSelection,
    hasSelection,
    selectedLossesTotal,
    bucketGain,
    postHarvestGain,
    taxBefore,
    taxAfter,
    netSavings,
  } = useWhatIfSimulator(summary, bucketOpps, bucket, slabRate);

  return (
    <div className="flex flex-col gap-6">
      <HarvestingMetrics opportunities={opportunities} summary={summary} bucket={bucket} />

      {bucket === 'STCG' && <SectorHeatmap opportunities={bucketOpps} />}

      <EnhancedOpportunitiesTable
        opportunities={bucketOpps}
        selectedIds={selectedIds}
        onToggleSelection={toggleSelection}
        onSelectAll={selectAll}
      />

      {hasSelection && (
        <WhatIfPanel
          bucket={bucket}
          selectedLossesTotal={selectedLossesTotal}
          bucketGain={bucketGain}
          postHarvestGain={postHarvestGain}
          taxBefore={taxBefore}
          taxAfter={taxAfter}
          netSavings={netSavings}
          onReset={resetSelection}
        />
      )}
    </div>
  );
};

const TaxHarvestingContent = () => {
  const { taxYear, setTaxYear } = useTaxYear();
  const { threshold } = useThreshold();
  const { slabRate } = useSlabRate();
  const isCurrentFY = taxYear === getCurrentFY();

  const { data: summary } = useGetTaxSummaryQuery({ taxYear });
  const { data: harvesting, isLoading } = useGetTaxHarvestingQuery({
    taxYear,
    minLoss: threshold,
  });

  const opportunities = harvesting?.opportunities ?? [];
  const intradayOpportunities = harvesting?.intradayOpportunities ?? [];

  const stcgCount = opportunities.filter((o) => o.lossType === 'STCG').length;
  const ltcgCount = opportunities.filter((o) => o.lossType === 'LTCG').length;
  const intradayCount = intradayOpportunities.length;

  const TabBadge = ({ count }) =>
    count > 0 ? (
      <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-primary/15 px-1.5 py-0.5 text-[11px] font-semibold text-primary">
        {count}
      </span>
    ) : null;

  return (
    <>
      <PageHeader
        title="Tax-Loss Harvesting Insights"
        actions={
          <div className="flex items-center gap-2">
            {isCurrentFY && <ThresholdConfig />}
            <SlabRateConfig />
            <TaxYearSelector taxYear={taxYear} setTaxYear={setTaxYear} />
          </div>
        }
      />

      <Alert variant="warning">
        ⚠️ This feature is for educational purposes only and does not constitute tax advice. Consult
        a qualified tax advisor for real financial decisions.
      </Alert>

      {!isCurrentFY && (
        <Alert variant="info">
          ℹ️ Tax-loss harvesting only applies to the current Financial Year (
          {formatFYLabel(getCurrentFY())}). Past FY data is shown for reference.
        </Alert>
      )}

      {isLoading ? (
        <Spinner label="Loading harvesting insights…" />
      ) : (
        <div className="flex flex-col gap-6">
          {/* FY overview chart — applies to all buckets (current and past FY) */}
          <GainsVsLossesChart
            summary={summary}
            opportunities={opportunities}
            intradayOpportunities={isCurrentFY ? intradayOpportunities : []}
          />

          {isCurrentFY ? (
            <Tabs defaultValue="stcg">
              <div className="overflow-x-auto -mx-1 px-1 pb-1">
                <TabsList className="min-w-full sm:min-w-0">
                  <TabsTrigger value="stcg">
                    STCG Harvesting
                    <TabBadge count={stcgCount} />
                  </TabsTrigger>
                  <TabsTrigger value="ltcg">
                    LTCG Harvesting
                    <TabBadge count={ltcgCount} />
                  </TabsTrigger>
                  <TabsTrigger value="intraday">
                    Intraday Harvesting
                    <TabBadge count={intradayCount} />
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="stcg">
                <DeliveryTab
                  bucket="STCG"
                  opportunities={opportunities}
                  summary={summary}
                  slabRate={slabRate}
                />
              </TabsContent>

              <TabsContent value="ltcg">
                <DeliveryTab
                  bucket="LTCG"
                  opportunities={opportunities}
                  summary={summary}
                  slabRate={slabRate}
                />
              </TabsContent>

              <TabsContent value="intraday">
                <IntradayHarvestingSection
                  intradayOpportunities={intradayOpportunities}
                  summary={summary}
                />
              </TabsContent>
            </Tabs>
          ) : (
            /* Past FY — no tabs, just show delivery opportunities read-only */
            <div className="flex flex-col gap-6">
              <HarvestingMetrics opportunities={opportunities} summary={summary} bucket="STCG" />
              <HarvestingMetrics opportunities={opportunities} summary={summary} bucket="LTCG" />
              <EnhancedOpportunitiesTable
                opportunities={opportunities}
                selectedIds={new Set()}
                onToggleSelection={() => {}}
                onSelectAll={() => {}}
              />
            </div>
          )}
        </div>
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
