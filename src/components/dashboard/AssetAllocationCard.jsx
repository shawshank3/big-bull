import { Card, CardContent } from '../common';
import { Progress } from '../ui/progress';
import { MutedText, SectionTitle } from '../ui/typography';
import { formatCurrency } from '@/utils';
import {
  ALLOCATION_ROWS,
  getAllocationAmount,
  getAllocationValue,
} from './utils';

export const AssetAllocationCard = ({ allocation }) => {
  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <SectionTitle>Asset allocation</SectionTitle>
        {ALLOCATION_ROWS.map((row) => (
          <div key={row.key} className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium text-foreground">{row.label}</p>
              <p className="font-bold text-foreground">{getAllocationValue(allocation, row.key).toFixed(2)}%</p>
            </div>
            <Progress value={getAllocationValue(allocation, row.key)} indicatorClassName={row.colorClass} />
            <MutedText>{formatCurrency(getAllocationAmount(allocation, row.key))}</MutedText>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default AssetAllocationCard;
