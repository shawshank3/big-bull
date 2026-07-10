import { useSelector } from 'react-redux';
import { selectAuthState } from '@/features/auth';
import { ROUTES } from '@/shared/constants/routes';
import { TickerStrip } from '../components/TickerStrip';
import { ExploreHero } from '../components/ExploreHero';
import { MarketStats } from '../components/MarketStats';
import { FeatureHighlights } from '../components/FeatureHighlights';
import { QuotesSection } from '../components/QuotesSection';
import { ExploreCta } from '../components/ExploreCta';

export const Explore = () => {
  const { isAuthenticated, isLoading } = useSelector(selectAuthState);

  return (
    <div className="flex flex-col gap-16 pb-20">
      <TickerStrip />

      <ExploreHero>
        <ExploreHero.Badge>🎮 Simulated Markets · Risk-Free · Paper Trading</ExploreHero.Badge>
        <ExploreHero.Heading>
          Practice trading, <span className="text-primary">without the risk</span>
        </ExploreHero.Heading>

        {isLoading ? (
          <ExploreHero.CtaSkeleton />
        ) : (
          <>
            <ExploreHero.Description>
              Trade virtual stocks in a realistic simulated market. Learn strategies, test ideas,
              and build confidence — all with zero real money at stake.
              {isAuthenticated
                ? ' Use the search bar above to find any simulated stock.'
                : " No account needed to explore — sign up when you're ready to start paper trading."}
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
          </>
        )}
      </ExploreHero>

      <MarketStats />
      <FeatureHighlights />
      <QuotesSection />
      {!isLoading && !isAuthenticated && <ExploreCta />}
    </div>
  );
};

export default Explore;
