import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Alert } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { FormInput } from '@/shared/components/FormInput';
import { useExecuteOrderMutation } from '@/features/transaction/api/transactionApi';
import { formatCurrency } from '@/shared/utils/format';
import { ROUTES } from '@/shared/constants/routes';

const BuyForm = ({ asset, price, wallet, displayLabel }) => {
  const navigate = useNavigate();
  const [executeOrder, { isLoading, error: orderError, isSuccess }] = useExecuteOrderMutation();
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
    const result = await executeOrder({
      assetId: asset.id ?? asset._id,
      transactionType: 'BUY',
      quantity: parseFloat(quantity),
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
        label="Quantity"
        type="number"
        step="0.001"
        min="0.001"
        placeholder="e.g. 10"
        error={errors.quantity?.message}
        {...register('quantity', {
          required: 'Quantity is required',
          min: { value: 0.001, message: 'Minimum quantity is 0.001' },
          validate: (v) => {
            const parsed = parseFloat(v);
            if (isNaN(parsed)) return 'Enter a valid number';
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
