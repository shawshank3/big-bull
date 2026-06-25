import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '@/features/auth/store/authSelectors';
import { useGetWalletQuery } from '@/features/wallet/api/walletApi';
import { useGetPortfolioHoldingsQuery } from '@/features/portfolio/api/portfolioApi';
import { formatCurrency } from '@/shared/utils/format';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/tabs';
import BuyForm from './BuyForm';
import SellForm from './SellForm';
import { ASSET_TYPES, TRANSACTION_TYPES } from '@/shared/constants';

export const OrderForm = ({ asset, currentPrice }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { data: wallet } = useGetWalletQuery(undefined, { skip: !isAuthenticated });
  const { data: holdings } = useGetPortfolioHoldingsQuery(undefined, {
    skip: !isAuthenticated,
    refetchOnMountOrArgChange: true,
  });

  const price = currentPrice ?? asset?.basePrice ?? 0;

  // Find how many units the user currently holds for this asset
  const assetHolding = holdings?.find(
    (h) => h.assetId === (asset?.id ?? asset?._id) || h.ticker === asset?.ticker
  );
  const heldQty = assetHolding?.netQuantity ?? assetHolding?.qty ?? 0;
  const isMF = asset?.assetType === ASSET_TYPES.MUTUAL_FUND;

  // User-friendly display name: ticker for stocks, truncated name for mutual funds
  const displayLabel =
    asset?.assetType === ASSET_TYPES.MUTUAL_FUND
      ? (asset?.name ?? 'Fund').slice(0, 20) + ((asset?.name?.length ?? 0) > 20 ? '…' : '')
      : (asset?.ticker ?? '');

  return (
    <div className="space-y-4">
      {/* Info rows rendered OUTSIDE TabsContent — always visible */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted">{isMF ? 'Units held' : 'In holdings'}</span>
        <span className="font-semibold tabular-nums">{heldQty > 0 ? heldQty : '—'}</span>
      </div>
      {wallet && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Wallet balance</span>
          <span className="font-semibold tabular-nums">{formatCurrency(wallet.balance)}</span>
        </div>
      )}

      {/* Delegated to Tier 3 Tabs compound */}
      <Tabs defaultValue={TRANSACTION_TYPES.BUY}>
        <TabsList className="w-full grid grid-cols-2 rounded-lg overflow-hidden border border-border p-0 h-auto gap-0">
          <TabsTrigger
            value={TRANSACTION_TYPES.BUY}
            className="rounded-none py-2 text-sm font-semibold data-[state=active]:bg-success data-[state=active]:text-white data-[state=inactive]:bg-surface data-[state=inactive]:text-muted"
          >
            {TRANSACTION_TYPES.BUY}
          </TabsTrigger>
          <TabsTrigger
            value={TRANSACTION_TYPES.SELL}
            className="rounded-none py-2 text-sm font-semibold data-[state=active]:bg-danger data-[state=active]:text-white data-[state=inactive]:bg-surface data-[state=inactive]:text-muted"
          >
            {TRANSACTION_TYPES.SELL}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={TRANSACTION_TYPES.BUY}>
          <BuyForm asset={asset} price={price} wallet={wallet} displayLabel={displayLabel} />
        </TabsContent>
        <TabsContent value={TRANSACTION_TYPES.SELL}>
          <SellForm asset={asset} price={price} heldQty={heldQty} displayLabel={displayLabel} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrderForm;
