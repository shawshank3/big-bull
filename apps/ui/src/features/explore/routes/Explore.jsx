import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '@/features/auth/store/authSelectors';
import { ROUTES } from '@/shared/constants/routes';
import { TickerStrip } from '../components/TickerStrip';
import { ExploreHero } from '../components/ExploreHero';
import { MarketStats } from '../components/MarketStats';
import { FeatureHighlights } from '../components/FeatureHighlights';
import { QuotesSection } from '../components/QuotesSection';
import { ExploreCta } from '../components/ExploreCta';

export const Explore = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  return (
    <div className="flex flex-col gap-16 pb-20">
      <TickerStrip />

      <ExploreHero>
        <ExploreHero.Badge>🇮🇳 Indian Markets · NSE · BSE · Mutual Funds</ExploreHero.Badge>
        <ExploreHero.Heading>
          Explore the markets, <span className="text-primary">before you invest</span>
        </ExploreHero.Heading>

        <ExploreHero.Description>
          Search thousands of stocks and mutual funds, see live quotes, and make informed decisions.
          {isAuthenticated
            ? ' Use the search bar above to find any stock or mutual fund.'
            : " No account needed to explore — sign up when you're ready to track your portfolio."}
        </ExploreHero.Description>

        {isAuthenticated ? (
          <ExploreHero.Authenticated>
            <ExploreHero.Actions.Primary to={ROUTES.DASHBOARD}>
              Go to dashboard
            </ExploreHero.Actions.Primary>
          </ExploreHero.Authenticated>
        ) : (
          <ExploreHero.Guest>
            <ExploreHero.Actions>
              <ExploreHero.Actions.Primary to={ROUTES.REGISTER}>
                Get started free
              </ExploreHero.Actions.Primary>
              <ExploreHero.Actions.Secondary to={ROUTES.LOGIN}>
                Log in
              </ExploreHero.Actions.Secondary>
            </ExploreHero.Actions>
          </ExploreHero.Guest>
        )}
      </ExploreHero>

      <MarketStats />
      <FeatureHighlights />
      <QuotesSection />
      {!isAuthenticated && <ExploreCta />}
    </div>
  );
};

export default Explore;
