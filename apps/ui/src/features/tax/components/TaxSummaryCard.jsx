import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/shared/components/card';
import { MutedText, StatValue } from '@/shared/ui/typography';
import { formatCurrency } from '@/shared/utils';
import { ROUTES } from '@/shared/constants/routes';

const getTone = (value) => {
  if (value > 0) return 'success';
  if (value < 0) return 'danger';
  return 'default';
};

export const TaxSummaryCard = ({ summary = {} }) => {
  const stats = [
    {
      label: 'Total STCG',
      value: formatCurrency(summary.totalSTCG ?? 0),
      tone: getTone(summary.totalSTCG ?? 0),
    },
    {
      label: 'Total LTCG',
      value: formatCurrency(summary.totalLTCG ?? 0),
      tone: getTone(summary.totalLTCG ?? 0),
    },
    {
      label: 'Net Gain/Loss',
      value: formatCurrency(summary.netRealizedGain ?? 0),
      tone: getTone(summary.netRealizedGain ?? 0),
    },
    {
      label: 'Estimated Tax',
      value: formatCurrency(summary.estimatedTax ?? 0),
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
