import { formatDate } from './format';

/**
 * Formats market API dates (MFapi DD-MM-YYYY or ISO strings).
 */
export const formatMarketDate = (value) => {
  if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
    const [day, month, year] = value.split('-');
    return formatDate(new Date(`${year}-${month}-${day}`));
  }

  return formatDate(value);
};

export default formatMarketDate;
