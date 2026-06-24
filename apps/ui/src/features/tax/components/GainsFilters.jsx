import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/shared/components/select';

export const GainsFilters = ({ assetType, setAssetType, gainType, setGainType }) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={assetType} onValueChange={setAssetType}>
        <SelectTrigger className="w-[150px]" aria-label="Filter by asset type">
          <SelectValue placeholder="All Assets" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Assets</SelectItem>
          <SelectItem value="STOCK">Stocks</SelectItem>
          <SelectItem value="MUTUAL_FUND">Mutual Funds</SelectItem>
        </SelectContent>
      </Select>

      <Select value={gainType} onValueChange={setGainType}>
        <SelectTrigger className="w-[130px]" aria-label="Filter by gain type">
          <SelectValue placeholder="All Gains" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Gains</SelectItem>
          <SelectItem value="STCG">STCG</SelectItem>
          <SelectItem value="LTCG">LTCG</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default GainsFilters;
