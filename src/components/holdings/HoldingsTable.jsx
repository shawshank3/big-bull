import { Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../common';
import { MutedText, StatValue } from '../ui/typography';
import { formatCurrency } from '../../utils/format';
import { getHoldingReturn } from '../../utils/portfolio';

export const HoldingsTable = ({ holdings }) => {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeader>Name</TableHeader>
          <TableHeader>Type</TableHeader>
          <TableHeader className="text-right">Quantity</TableHeader>
          <TableHeader className="text-right">Avg price</TableHeader>
          <TableHeader className="text-right">Current price</TableHeader>
          <TableHeader className="text-right">Value</TableHeader>
          <TableHeader className="text-right">Return</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        {holdings.map((holding) => {
          const { value, percentage } = getHoldingReturn(holding);

          return (
            <TableRow key={holding._id}>
              <TableCell>{holding.name || holding.symbol}</TableCell>
              <TableCell>
                <Badge variant={holding.type === 'mutual' ? 'info' : 'warning'}>
                  {holding.type === 'mutual' ? 'MF' : 'STK'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">{holding.qty}</TableCell>
              <TableCell className="text-right">{formatCurrency(holding.avgPrice)}</TableCell>
              <TableCell className="text-right">{formatCurrency(holding.currentPrice)}</TableCell>
              <TableCell className="text-right">
                {formatCurrency(value + holding.qty * holding.avgPrice)}
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
