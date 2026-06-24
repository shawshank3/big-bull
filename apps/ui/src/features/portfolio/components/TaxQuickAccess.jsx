import { Link } from 'react-router-dom';
import { Receipt, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/shared/components/card';
import { ROUTES } from '@/shared/constants/routes';

export const TaxQuickAccess = () => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
    <Link to={ROUTES.TAX} className="group">
      <Card className="transition-colors group-hover:border-primary/40">
        <CardContent className="flex items-center gap-4 py-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Tax Center</p>
            <p className="text-xs text-muted">View capital gains &amp; tax summary</p>
          </div>
        </CardContent>
      </Card>
    </Link>
    <Link to={ROUTES.TAX_HARVESTING} className="group">
      <Card className="transition-colors group-hover:border-primary/40">
        <CardContent className="flex items-center gap-4 py-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
            <TrendingDown className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Tax-Loss Harvesting</p>
            <p className="text-xs text-muted">Find opportunities to offset gains</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  </div>
);

export default TaxQuickAccess;
