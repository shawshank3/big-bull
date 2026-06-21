import { useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Alert } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { FormInput } from '@/shared/ui/FormInput';
import { useExecuteOrderMutation } from '@/features/transaction/api/transactionApi';
import { useGetWalletQuery } from '@/features/wallet/api/walletApi';
import { useGetPortfolioHoldingsQuery } from '@/features/portfolio/api/portfolioApi';
import { ROUTES } from '@/shared/constants/routes';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(n);

export const OrderForm = ({ asset, currentPrice }) => {
  const { isAuthenticated } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const { data: wallet } = useGetWalletQuery(undefined, { skip: !isAuthenticated });
  const { data: holdings } = useGetPortfolioHoldingsQuery(undefined, { skip: !isAuthenticated });
  const [executeOrder, { isLoading, error: orderError, isSuccess }] = useExecuteOrderMutation();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({ defaultValues: { transactionType: 'BUY', quantity: '' } });

  const transactionType = watch('transactionType');
  const quantity = parseFloat(watch('quantity')) || 0;
  const price = currentPrice ?? asset?.basePrice ?? 0;
  const estimatedTotal = quantity * price;
  const canAfford = !wallet || wallet.balance >= estimatedTotal;

  // Find how many units the user currently holds for this asset
  const assetHolding = holdings?.find(
    (h) => h.assetId === (asset?.id ?? asset?._id) || h.ticker === asset?.ticker
  );
  const heldQty = assetHolding?.netQuantity ?? assetHolding?.qty ?? 0;

  const onSubmit = async ({ transactionType, quantity }) => {
    const result = await executeOrder({
      assetId: asset.id ?? asset._id,
      transactionType,
      quantity: parseFloat(quantity),
    });
    if (!result.error) {
      navigate(ROUTES.HOLDINGS);
    }
  };

  const displayLabel =
    asset?.assetType === 'MUTUAL_FUND'
      ? (asset?.name ?? 'Fund').slice(0, 20) + ((asset?.name?.length ?? 0) > 20 ? '…' : '')
      : (asset?.ticker ?? '');

  if (isSuccess) {
    return (
      <div className="space-y-3">
        <Alert variant="success">Order placed! Your portfolio and wallet have been updated.</Alert>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="flex rounded-lg overflow-hidden border border-border">
        {['BUY', 'SELL'].map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setValue('transactionType', type)}
            className={[
              'flex-1 py-2 text-sm font-semibold transition-colors',
              transactionType === type
                ? type === 'BUY'
                  ? 'bg-success text-white'
                  : 'bg-danger text-white'
                : 'bg-surface text-muted hover:text-foreground',
            ].join(' ')}
          >
            {type}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted">In holdings</span>
        <span className="font-semibold tabular-nums">{heldQty > 0 ? heldQty : '—'}</span>
      </div>
      {wallet && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Wallet balance</span>
          <span
            className={[
              'font-semibold tabular-nums',
              !canAfford && transactionType === 'BUY' ? 'text-danger' : '',
            ].join(' ')}
          >
            {fmt(wallet.balance)}
          </span>
        </div>
      )}
      <FormInput
        label="Quantity"
        type="number"
        step="0.001"
        min="0.001"
        placeholder="e.g. 10"
        error={errors.quantity?.message}
        {...register('quantity', {
          required: 'Quantity is required',
          min: { value: 0.001, message: 'Minimum quantity is 0.001' },
          validate: (v) => !isNaN(parseFloat(v)) || 'Enter a valid number',
        })}
      />
      {quantity > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-muted/10 px-4 py-3 text-sm">
          <span className="text-muted">
            Est. {transactionType === 'BUY' ? 'cost' : 'proceeds'} (indicative)
          </span>
          <span className="font-bold tabular-nums">{fmt(estimatedTotal)}</span>
        </div>
      )}
      {transactionType === 'BUY' && quantity > 0 && !canAfford && (
        <Alert variant="danger">
          Insufficient wallet balance. You need {fmt(estimatedTotal)} but have{' '}
          {fmt(wallet?.balance ?? 0)}.
        </Alert>
      )}
      {orderError && (
        <Alert variant="danger">
          {orderError?.data?.error?.message ?? 'Order failed. Please try again.'}
        </Alert>
      )}
      <Button
        type="submit"
        variant={transactionType === 'BUY' ? 'primary' : 'danger'}
        size="lg"
        loading={isLoading}
        disabled={transactionType === 'BUY' && !canAfford && quantity > 0}
        className="w-full"
      >
        {isLoading
          ? transactionType === 'BUY'
            ? 'Buying…'
            : 'Selling…'
          : `${transactionType} ${displayLabel}`}
      </Button>
    </form>
  );
};

export default OrderForm;
