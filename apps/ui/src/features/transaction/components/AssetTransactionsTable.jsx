import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Spinner } from '@/shared/ui/spinner';
import { Alert } from '@/shared/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { MutedText } from '@/shared/ui/typography';
import { formatCurrency } from '@/shared/utils';
import { useGetTransactionsQuery } from '../api/transactionApi';

const fmt = (n) => formatCurrency(n, 'INR');

const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
};

/**
 * AssetTransactionsTable
 *
 * Renders a full-width transaction history table for a specific asset.
 * Shows "No transactions" when the list is empty.
 *
 * @param {string} assetId - MongoDB ObjectId of the asset
 */
export const AssetTransactionsTable = ({ assetId }) => {
  const { data, isLoading, isError } = useGetTransactionsQuery(
    { assetId, limit: 50 },
    { skip: !assetId }
  );

  const transactions = data?.transactions ?? [];

  return (
    <Card className="w-full">
      <CardHeader className="py-3 px-6">
        <CardTitle className="text-base">Transaction History</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pt-0 pb-6">
        {isLoading && <Spinner label="Loading transactions…" />}
        {isError && (
          <div className="pt-4">
            <Alert variant="danger">Unable to load transactions.</Alert>
          </div>
        )}
        {!isLoading && !isError && transactions.length === 0 && (
          <div className="py-10 text-center">
            <MutedText>No transactions</MutedText>
          </div>
        )}
        {!isLoading && !isError && transactions.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Price / unit</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Fees</TableHead>
                <TableHead className="text-right">Date &amp; time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>
                    <Badge variant={tx.transactionType === 'BUY' ? 'success' : 'danger'}>
                      {tx.transactionType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{tx.quantity}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt(tx.pricePerUnit)}</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">
                    {fmt(tx.quantity * tx.pricePerUnit)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {tx.fees > 0 ? fmt(tx.fees) : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <MutedText className="text-xs">{fmtDate(tx.executedAt)}</MutedText>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default AssetTransactionsTable;
