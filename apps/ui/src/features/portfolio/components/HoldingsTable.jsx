import { useNavigate } from 'react-router-dom';
import { Badge } from '@/shared/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { MutedText, StatValue } from '@/shared/ui/typography';
import { formatCurrency, getHoldingReturn } from '@/shared/utils';
import { buildStockDetailPath, buildMutualDetailPath } from '@/features/market/constants/market';

export const HoldingsTable = ({ holdings }) => {
  const navigate = useNavigate();

  const getDetailPath = (holding) => {
    if (holding.type === 'mutual') {
      return buildMutualDetailPath(holding.ticker);
    }
    return buildStockDetailPath(holding.ticker);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Quantity</TableHead>
          <TableHead className="text-right">Avg price</TableHead>
          <TableHead className="text-right">Current price</TableHead>
          <TableHead className="text-right">Value</TableHead>
          <TableHead className="text-right">Return</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {holdings.map((holding) => {
          const { value, percentage } = getHoldingReturn(holding);
          return (
            <TableRow
              key={holding.assetId ?? holding._id}
              className="cursor-pointer"
              onClick={() => navigate(getDetailPath(holding), { state: { name: holding.name } })}
              role="button"
              tabIndex={0}
              onKeyDown={(e) =>
                e.key === 'Enter' &&
                navigate(getDetailPath(holding), { state: { name: holding.name } })
              }
            >
              <TableCell>{holding.name || holding.ticker}</TableCell>
              <TableCell>
                <Badge variant={holding.type === 'mutual' ? 'info' : 'warning'}>
                  {holding.type === 'mutual' ? 'MF' : 'STK'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">{holding.qty}</TableCell>
              <TableCell className="text-right">{formatCurrency(holding.avgPrice)}</TableCell>
              <TableCell className="text-right">{formatCurrency(holding.currentPrice)}</TableCell>
              <TableCell className="text-right">
                {formatCurrency(holding.currentValue ?? holding.qty * holding.currentPrice)}
              </TableCell>
              <TableCell className="text-right">
                <div className="space-y-0.5">
                  <StatValue tone={value >= 0 ? 'success' : 'danger'} className="text-sm">
                    {formatCurrency(value)}
                  </StatValue>
                  <MutedText as="span" className="text-xs">
                    {percentage.toFixed(2)}%
                  </MutedText>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default HoldingsTable;
