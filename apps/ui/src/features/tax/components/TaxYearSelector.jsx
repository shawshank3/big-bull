import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/shared/components/select';
import { generateFYOptions, formatFYLabel } from '../utils/taxFormatters';

export const TaxYearSelector = ({ taxYear, setTaxYear }) => {
  const years = generateFYOptions();

  return (
    <Select value={String(taxYear)} onValueChange={(val) => setTaxYear(Number(val))}>
      <SelectTrigger className="w-[140px]" aria-label="Select financial year">
        <SelectValue placeholder="Select FY" />
      </SelectTrigger>
      <SelectContent>
        {years.map((year) => (
          <SelectItem key={year} value={String(year)}>
            {formatFYLabel(year)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default TaxYearSelector;
