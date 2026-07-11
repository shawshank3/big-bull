import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/shared/components/card';
import { MutedText, StatValue } from '@/shared/ui/typography';
import { formatCurrency } from '@/shared/utils';
import { ROUTES } from '@/shared/constants/routes';
import { computeTax, computeIntradayTax } from '../utils/taxCalculations';
import { useSlabRate } from '../hooks/useSlabRate';

const getTone = (value) => {
  if (value > 0) return 'success';
  if (value < 0) return 'danger';
  return 'default';
};

export const TaxSummaryCard = ({ summary = {} }) => {
  const { slabRate, slabRateLabel } = useSlabRate();

  const totalSTCG = summary.totalSTCG ?? 0;
  const totalLTCG = summary.totalLTCG ?? 0;
  const totalIntraday = summary.totalIntraday ?? 0;

  // Compute the full estimated tax client-side so intraday uses the user's slab
  const cgTax = computeTax(totalSTCG, totalLTCG);
  const intradayTax = computeIntradayTax(totalIntraday, slabRate);
  const totalEstimatedTax = cgTax + intradayTax;

  const stats = [
    {
      label: 'Total STCG',
      value: formatCurrency(totalSTCG),
      tone: getTone(totalSTCG),
    },
    {
      label: 'Total LTCG',
      value: formatCurrency(totalLTCG),
      tone: getTone(totalLTCG),
    },
    {
      label: `Intraday (Slab ${slabRateLabel})`,
      value: formatCurrency(totalIntraday),
      tone: getTone(totalIntraday),
    },
    {
      label: 'Net Gain/Loss',
      value: formatCurrency(summary.netRealizedGain ?? 0),
      tone: getTone(summary.netRealizedGain ?? 0),
    },
    {
      label: 'Estimated Tax',
      value: formatCurrency(totalEstimatedTax),
      tone: 'default',
    },
    {
      label: 'Harvesting Opportunities',
      value: String(summary.harvestingCount ?? 0),
      tone: (summary.harvestingCount ?? 0) > 0 ? 'primary' : 'default',
      linkTo: ROUTES.TAX_HARVESTING,
    },
  ];

  return (
    <div className="stat-grid">
      {stats.map((item) =>
        item.linkTo ? (
          <Link key={item.label} to={item.linkTo} className="group">
            <Card className="h-full transition-colors group-hover:border-primary/40">
              <CardContent className="space-y-1 pt-6">
                <MutedText className="group-hover:text-foreground transition-colors">
                  {item.label} →
                </MutedText>
                <StatValue tone={item.tone}>{item.value}</StatValue>
              </CardContent>
            </Card>
          </Link>
        ) : (
          <Card key={item.label}>
            <CardContent className="space-y-1 pt-6">
              <MutedText>{item.label}</MutedText>
              <StatValue tone={item.tone}>{item.value}</StatValue>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
};

export default TaxSummaryCard;
