/**
 * OrderForm
 * BUY / SELL order form for a single asset.
 * Uses RHF for form state. Calls POST /api/v1/transactions/order.
 */
import { useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { Alert, Button, Input } from '../common';
import { useExecuteOrderMutation } from '../../api/transactionApi';
import { useGetWalletQuery } from '../../api/walletApi';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

export const OrderForm = ({ asset, currentPrice }) => {
  const { isAuthenticated } = useSelector((s) => s.auth);
  const { data: wallet } = useGetWalletQuery(undefined, { skip: !isAuthenticated });
  const [executeOrder, { isLoading, error: orderError, isSuccess, reset }] = useExecuteOrderMutation();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: { transactionType: 'BUY', quantity: '' },
  });

  const transactionType = watch('transactionType');
  const quantity = parseFloat(watch('quantity')) || 0;
  const price = currentPrice ?? asset?.basePrice ?? 0;
  const estimatedTotal = quantity * price;
  const canAfford = !wallet || wallet.balance >= estimatedTotal;

  const onSubmit = async ({ transactionType, quantity }) => {
    await executeOrder({
      assetId: asset._id,
      transactionType,
      quantity: parseFloat(quantity),
      pricePerUnit: price,
    });
  };

  if (isSuccess) {
    return (
      <div className="space-y-3">
        <Alert variant="success">
          Order placed! Your portfolio and wallet have been updated.
        </Alert>
        <Button variant="outline" size="sm" onClick={reset}>
          Place another order
        </Button>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* BUY / SELL toggle */}
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

      {/* Current price */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted">Current price</span>
        <span className="font-semibold tabular-nums">{fmt(price)}</span>
      </div>

      {/* Wallet balance */}
      {wallet && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Wallet balance</span>
          <span className={['font-semibold tabular-nums', !canAfford && transactionType === 'BUY' ? 'text-danger' : ''].join(' ')}>
            {fmt(wallet.balance)}
          </span>
        </div>
      )}

      <Input
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

      {/* Estimated total */}
      {quantity > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-muted/10 px-4 py-3 text-sm">
          <span className="text-muted">Estimated {transactionType === 'BUY' ? 'cost' : 'proceeds'}</span>
          <span className="font-bold tabular-nums">{fmt(estimatedTotal)}</span>
        </div>
      )}

      {/* Insufficient balance warning */}
      {transactionType === 'BUY' && quantity > 0 && !canAfford && (
        <Alert variant="danger">
          Insufficient wallet balance. You need {fmt(estimatedTotal)} but have {fmt(wallet?.balance ?? 0)}.
        </Alert>
      )}

      {/* Server error */}
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
          ? transactionType === 'BUY' ? 'Buying…' : 'Selling…'
          : `${transactionType} ${asset?.ticker ?? ''}`}
      </Button>
    </form>
  );
};

export default OrderForm;
