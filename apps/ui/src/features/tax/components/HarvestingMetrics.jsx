import { Card, CardContent } from '@/shared/components/card';
import { MutedText, StatValue } from '@/shared/ui/typography';
import { formatCurrency } from '@/shared/utils';
import { computeHarvestingMetrics } from '../utils/taxCalculations';

export const HarvestingMetrics = ({ opportunities = [] }) => {
  const { totalHarvestableLoss, potentialTaxSavings, stcgOffsets, ltcgOffsets } =
    computeHarvestingMetrics(opportunities);

  const metrics = [
    { label: 'Total Harvestable Loss', value: formatCurrency(totalHarvestableLoss) },
    { label: 'Potential Tax Savings', value: formatCurrency(potentialTaxSavings) },
    { label: 'STCG Offsets Available', value: formatCurrency(stcgOffsets) },
    { label: 'LTCG Offsets Available', value: formatCurrency(ltcgOffsets) },
  ];

  return (
    <div className="stat-grid">
      {metrics.map((item) => (
        <Card key={item.label}>
          <CardContent className="space-y-1 pt-6">
            <MutedText>{item.label}</MutedText>
            <StatValue>{item.value}</StatValue>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default HarvestingMetrics;
