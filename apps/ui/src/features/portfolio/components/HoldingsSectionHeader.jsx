import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/ui/button';
import { SectionTitle } from '@/shared/ui/typography';
import { ROUTES } from '@/shared/constants/routes';

export const HoldingsSectionHeader = ({
  title = 'Holdings breakdown',
  showNavigate = false,
  navigateTo = ROUTES.HOLDINGS,
}) => {
  const navigate = useNavigate();
  if (!showNavigate) return <SectionTitle>{title}</SectionTitle>;
  return (
    <div className="flex items-center justify-between gap-3">
      <SectionTitle>{title}</SectionTitle>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-9 w-9 shrink-0 p-0"
        onClick={() => navigate(navigateTo)}
        aria-label="View all holdings"
      >
        <ArrowRight className="h-5 w-5 text-muted" aria-hidden />
      </Button>
    </div>
  );
};

export default HoldingsSectionHeader;
