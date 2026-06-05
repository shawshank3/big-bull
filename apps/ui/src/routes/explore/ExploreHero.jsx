import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { ROUTES } from '../../constants/routes';

// Compound component: ExploreHero with composable children
const HeroBadge = ({ children }) => (
  <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
    {children}
  </span>
);

const HeroHeading = ({ children }) => (
  <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
    {children}
  </h1>
);

const HeroDescription = ({ children }) => (
  <p className="mb-8 text-base leading-relaxed text-muted sm:text-lg">{children}</p>
);

const HeroActions = ({ children }) => (
  <div className="flex flex-wrap items-center justify-center gap-3">{children}</div>
);

// Primary CTA
HeroActions.Primary = ({ to, children }) => (
  <Button asChild size="lg">
    <Link to={to}>
      {children}
      <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
    </Link>
  </Button>
);

// Secondary CTA
HeroActions.Secondary = ({ to, children }) => (
  <Button asChild variant="outline" size="lg">
    <Link to={to}>{children}</Link>
  </Button>
);

// Authenticated state components
const Authenticated = ({ children }) => children;
const Guest = ({ children }) => children;

// Main component
export const ExploreHero = ({ children }) => (
  <section className="text-center">
    <div className="mx-auto max-w-2xl">{children}</div>
  </section>
);

// Attach compound components
ExploreHero.Badge = HeroBadge;
ExploreHero.Heading = HeroHeading;
ExploreHero.Description = HeroDescription;
ExploreHero.Actions = HeroActions;
ExploreHero.Authenticated = Authenticated;
ExploreHero.Guest = Guest;

export default ExploreHero;
