import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/shared/components/card';
import { SectionTitle, MutedText } from '@/shared/ui/typography';
import { formatCurrency } from '@/shared/utils';
import { ROUTES } from '@/shared/constants/routes';
import { useSlabRate } from '../hooks/useSlabRate';

const LOSS_TYPE_STYLES = {
  LTCG: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  STCG: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  INTRADAY: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
};

export const HarvestingPreview = ({ opportunities = [], intradayOpportunities = [] }) => {
  const { slabRate, slabRateLabel } = useSlabRate();

  // Normalise intraday entries to share the same shape as delivery opportunities,
  // computing estimatedSaving using the user's persisted income slab rate.
  const normalizedIntraday = intradayOpportunities.map((opp) => ({
    assetId: opp.assetId,
    ticker: opp.ticker,
    name: opp.name,
    lossType: 'INTRADAY',
    unrealizedLoss: opp.unrealizedIntradayLoss,
    estimatedSaving: opp.unrealizedIntradayLoss * slabRate,
  }));

  const combined = [...opportunities, ...normalizedIntraday];

  if (combined.length === 0) return null;

  // Sort by absolute loss descending, then take top 5
  const topOpportunities = [...combined]
    .sort((a, b) => b.unrealizedLoss - a.unrealizedLoss)
    .slice(0, 5);

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <SectionTitle>Top Tax-Loss Harvesting Opportunities</SectionTitle>
          <Link
            to={ROUTES.TAX_HARVESTING}
            className="text-sm font-medium text-primary hover:underline"
          >
            View All Insights →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-2 font-medium text-muted">Asset</th>
                <th className="pb-2 font-medium text-muted text-right">Unrealized Loss</th>
                <th className="pb-2 font-medium text-muted text-right">Loss Type</th>
                <th className="pb-2 font-medium text-muted text-right">
                  Est. Saving
                  <span className="ml-1 font-normal text-muted/60">
                    (Intraday @ {slabRateLabel})
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {topOpportunities.map((opp) => (
                <tr
                  key={`${opp.lossType}-${opp.assetId}`}
                  className="border-b border-border last:border-0"
                >
                  <td className="py-2">
                    <p className="font-semibold">{opp.ticker}</p>
                    <MutedText className="text-xs">{opp.name}</MutedText>
                  </td>
                  <td className="py-2 text-right text-danger font-medium">
                    {formatCurrency(opp.unrealizedLoss)}
                  </td>
                  <td className="py-2 text-right">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                        LOSS_TYPE_STYLES[opp.lossType] ?? LOSS_TYPE_STYLES.STCG
                      }`}
                    >
                      {opp.lossType}
                    </span>
                  </td>
                  <td className="py-2 text-right text-success font-medium">
                    {formatCurrency(opp.estimatedSaving)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default HarvestingPreview;
