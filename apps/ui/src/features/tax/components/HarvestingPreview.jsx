import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/shared/components/card';
import { SectionTitle, MutedText } from '@/shared/ui/typography';
import { formatCurrency } from '@/shared/utils';
import { ROUTES } from '@/shared/constants/routes';

export const HarvestingPreview = ({ opportunities = [] }) => {
  if (opportunities.length === 0) return null;

  const topOpportunities = opportunities.slice(0, 5);

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <SectionTitle>Tax-Loss Harvesting Opportunities</SectionTitle>
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
                <th className="pb-2 font-medium text-muted text-right">Est. Saving</th>
              </tr>
            </thead>
            <tbody>
              {topOpportunities.map((opp) => (
                <tr key={opp.assetId} className="border-b border-border last:border-0">
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
                        opp.lossType === 'LTCG'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
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
