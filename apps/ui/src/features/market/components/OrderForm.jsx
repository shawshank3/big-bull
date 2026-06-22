import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useGetWalletQuery } from '@/features/wallet/api/walletApi';
import { useGetPortfolioHoldingsQuery } from '@/features/portfolio/api/portfolioApi';
import { formatCurrency } from '@/shared/utils/format';
import BuyForm from './BuyForm';
import SellForm from './SellForm';
import { ASSET_TYPES, TRANSACTION_TYPES } from '@/shared/constants';

export const OrderForm = ({ asset, currentPrice }) => {
  const [activeTab, setActiveTab] = useState(TRANSACTION_TYPES.BUY);
  const { isAuthenticated } = useSelector((s) => s.auth);
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

  // User-friendly display name: ticker for stocks, truncated name for mutual funds
  const displayLabel =
    asset?.assetType === ASSET_TYPES.MUTUAL_FUND
      ? (asset?.name ?? 'Fund').slice(0, 20) + ((asset?.name?.length ?? 0) > 20 ? '…' : '')
      : (asset?.ticker ?? '');

  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div className="flex rounded-lg overflow-hidden border border-border">
        {[TRANSACTION_TYPES.BUY, TRANSACTION_TYPES.SELL].map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setActiveTab(type)}
            className={[
              'flex-1 py-2 text-sm font-semibold transition-colors',
              activeTab === type
                ? type === TRANSACTION_TYPES.BUY
                  ? 'bg-success text-white'
                  : 'bg-danger text-white'
                : 'bg-surface text-muted hover:text-foreground',
            ].join(' ')}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Info rows */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted">In holdings</span>
        <span className="font-semibold tabular-nums">{heldQty > 0 ? heldQty : '—'}</span>
      </div>
      {wallet && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Wallet balance</span>
          <span className="font-semibold tabular-nums">{formatCurrency(wallet.balance)}</span>
        </div>
      )}

      {/* Separate forms for BUY and SELL */}
      {activeTab === TRANSACTION_TYPES.BUY ? (
        <BuyForm asset={asset} price={price} wallet={wallet} displayLabel={displayLabel} />
      ) : (
        <SellForm asset={asset} price={price} heldQty={heldQty} displayLabel={displayLabel} />
      )}
    </div>
  );
};

export default OrderForm;
