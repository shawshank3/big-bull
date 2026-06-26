import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Alert } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { FormInput } from '@/shared/components/FormInput';
import { useExecuteOrderMutation } from '@/features/transaction';
import { formatCurrency } from '@/shared/utils/format';
import { blockDecimalKeys } from '@/shared/utils/inputFilters';
import { ROUTES } from '@/shared/constants/routes';
import { ASSET_TYPES } from '@/shared/constants/assetTypes';

const BuyForm = ({ asset, price, wallet, displayLabel }) => {
  const navigate = useNavigate();
  const [executeOrder, { isLoading, error: orderError, isSuccess }] = useExecuteOrderMutation();
  const isStock = asset?.assetType === ASSET_TYPES.STOCK;
  const isMF = asset?.assetType === ASSET_TYPES.MUTUAL_FUND;
  const inputLabel = isMF ? 'Units' : 'Quantity';
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: { quantity: '' } });

  const quantity = parseFloat(watch('quantity')) || 0;
  const estimatedTotal = quantity * price;
  const canAfford = !wallet || wallet.balance >= estimatedTotal;

  const onSubmit = async ({ quantity }) => {
    const parsedQty = isStock ? parseInt(quantity, 10) : parseFloat(quantity);
    const result = await executeOrder({
      assetId: asset.id ?? asset._id,
      transactionType: 'BUY',
      quantity: parsedQty,
    });
    if (!result.error) {
      navigate(ROUTES.HOLDINGS);
    }
  };

  if (isSuccess) {
    return (
      <div className="space-y-3">
        <Alert variant="success">
          Buy order placed for {displayLabel}! Your portfolio and wallet have been updated.
        </Alert>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormInput
        label={inputLabel}
        type="number"
        step={isStock ? '1' : '0.001'}
        min={isStock ? '1' : '0.001'}
        inputMode={isStock ? 'numeric' : 'decimal'}
        placeholder={isStock ? 'e.g. 10' : 'e.g. 10.5'}
        onKeyDown={isStock ? blockDecimalKeys : undefined}
        error={errors.quantity?.message}
        {...register('quantity', {
          required: `${inputLabel} is required`,
          min: {
            value: isStock ? 1 : 0.001,
            message: isStock ? 'Minimum quantity is 1' : 'Minimum units is 0.001',
          },
          validate: (v) => {
            const parsed = parseFloat(v);
            if (isNaN(parsed)) return 'Enter a valid number';
            if (isStock && !Number.isInteger(parsed)) {
              return 'Stock quantity must be a whole number (no decimals)';
            }
            if (wallet && parsed * price > wallet.balance) {
              const shortBy = parsed * price - wallet.balance;
              return `Insufficient balance to buy ${displayLabel}. You need ${formatCurrency(shortBy)} more.`;
            }
            return true;
          },
        })}
      />
      {quantity > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-muted/10 px-4 py-3 text-sm">
          <span className="text-muted">Est. cost (indicative)</span>
          <span className="font-bold tabular-nums">{formatCurrency(estimatedTotal)}</span>
        </div>
      )}
      {quantity > 0 && !canAfford && (
        <Alert variant="danger">
          Insufficient balance to buy {displayLabel}. You need{' '}
          {formatCurrency(estimatedTotal - (wallet?.balance ?? 0))} more.
        </Alert>
      )}
      {orderError && (
        <Alert variant="danger">
          {orderError?.data?.error?.message ?? 'Order failed. Please try again.'}
        </Alert>
      )}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={isLoading}
        disabled={!canAfford && quantity > 0}
        className="w-full"
      >
        {isLoading ? 'Buying…' : `BUY ${displayLabel}`}
      </Button>
    </form>
  );
};

export default BuyForm;
