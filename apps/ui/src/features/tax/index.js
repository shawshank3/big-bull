// Tax feature public API
export { TaxCenter } from './routes/TaxCenter';
export { TaxHarvesting } from './routes/TaxHarvesting';
export {
  taxApi,
  useGetTaxGainsQuery,
  useGetTaxSummaryQuery,
  useGetTaxHarvestingQuery,
} from './api/taxApi';
export { useTaxYear, getCurrentFY } from './hooks/useTaxYear';
export { useThreshold } from './hooks/useThreshold';
export { useSlabRate, setSlabRate, INTRADAY_SLAB_RATES } from './hooks/useSlabRate';
export { useWhatIfSimulator } from './hooks/useWhatIfSimulator';
export { useIntradaySimulator } from './hooks/useIntradaySimulator';

// Components
export { TaxYearSelector } from './components/TaxYearSelector';
export { TaxSummaryCard } from './components/TaxSummaryCard';
export { GainsFilters } from './components/GainsFilters';
export { GainsTable } from './components/GainsTable';
export { HarvestingPreview } from './components/HarvestingPreview';
export { EducationalTooltip, TAX_TOOLTIPS } from './components/EducationalTooltips';
export { EnhancedOpportunitiesTable } from './components/EnhancedOpportunitiesTable';
export { IntradayHarvestingSection } from './components/IntradayHarvestingSection';
export { ThresholdConfig } from './components/ThresholdConfig';
export { SlabRateConfig } from './components/SlabRateConfig';
export { WhatIfPanel, IntradayWhatIfPanel } from './components/WhatIfPanel';

// Utils
export {
  STCG_RATE,
  LTCG_RATE,
  LTCG_EXEMPTION,
  computeTax,
  computeIntradayTax,
  computeHarvestingMetrics,
  computeLossPercent,
} from './utils/taxCalculations';
export {
  formatFYLabel,
  generateFYOptions,
  groupBySector,
  getLossIntensity,
} from './utils/taxFormatters';
export { buildGainsVsLossesData } from './utils/chartHelpers';
