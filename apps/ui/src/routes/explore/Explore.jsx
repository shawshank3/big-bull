import { useSelector } from 'react-redux';
import { ROUTES } from '../../constants/routes';
import { TickerStrip } from './TickerStrip';
import { ExploreHero } from './ExploreHero';
import { MarketStats } from './MarketStats';
import { FeatureHighlights } from './FeatureHighlights';
import { QuotesSection } from './QuotesSection';
import { ExploreCta } from './ExploreCta';

export const Explore = () => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

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
