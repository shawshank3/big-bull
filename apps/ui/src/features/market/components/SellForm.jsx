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

const SellForm = ({ asset, price, heldQty, displayLabel }) => {
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
  const estimatedProceeds = quantity * price;
  const canSell = heldQty >= quantity;

  const onSubmit = async ({ quantity }) => {
    const parsedQty = isStock ? parseInt(quantity, 10) : parseFloat(quantity);
    const result = await executeOrder({
      assetId: asset.id ?? asset._id,
      transactionType: 'SELL',
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
          Sell order placed for {displayLabel}! Your portfolio and wallet have been updated.
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
            if (parsed > heldQty) {
              const shortBy = +(parsed - heldQty).toFixed(3);
              return `Insufficient holdings for ${displayLabel}. You are ${shortBy} units short.`;
            }
            return true;
          },
        })}
      />
      {quantity > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-muted/10 px-4 py-3 text-sm">
          <span className="text-muted">Est. proceeds (indicative)</span>
          <span className="font-bold tabular-nums">{formatCurrency(estimatedProceeds)}</span>
        </div>
      )}
      {quantity > 0 && !canSell && (
        <Alert variant="danger">
          Insufficient holdings for {displayLabel}. You are {+(quantity - heldQty).toFixed(3)} units
          short.
        </Alert>
      )}
      {orderError && (
        <Alert variant="danger">
          {orderError?.data?.error?.message ?? 'Order failed. Please try again.'}
        </Alert>
      )}
      <Button
        type="submit"
        variant="danger"
        size="lg"
        loading={isLoading}
        disabled={!canSell && quantity > 0}
        className="w-full"
      >
        {isLoading ? 'Selling…' : `SELL ${displayLabel}`}
      </Button>
    </form>
  );
};

export default SellForm;
