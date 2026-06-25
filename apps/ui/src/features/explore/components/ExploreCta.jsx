import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { ROUTES } from '@/shared/constants/routes';

export const ExploreCta = () => (
  <section>
    <div className="flex flex-col items-center gap-6 rounded-2xl bg-primary px-8 py-12 text-center text-white shadow-soft">
      <h2 className="text-2xl font-bold sm:text-3xl">Ready to start paper trading?</h2>
      <p className="max-w-lg text-sm leading-relaxed text-white/80 sm:text-base">
        Create a free account to trade virtual stocks, track your simulated portfolio, and sharpen
        your skills — all risk-free.
      </p>
      <Button
        asChild
        variant="secondary"
        size="lg"
        className="bg-white text-primary hover:bg-white/90"
      >
        <Link to={ROUTES.REGISTER}>
          Create free account
          <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
        </Link>
      </Button>
    </div>
  </section>
);

export default ExploreCta;
