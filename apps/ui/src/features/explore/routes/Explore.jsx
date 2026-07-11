import { Helmet } from 'react-helmet-async';
import { useSelector } from 'react-redux';
import { selectAuthState } from '@/features/auth';
import { ROUTES } from '@/shared/constants/routes';
import { PageMeta } from '@/shared/components/PageMeta';
import { TickerStrip } from '../components/TickerStrip';
import { ExploreHero } from '../components/ExploreHero';
import { MarketStats } from '../components/MarketStats';
import { FeatureHighlights } from '../components/FeatureHighlights';
import { QuotesSection } from '../components/QuotesSection';
import { ExploreCta } from '../components/ExploreCta';

const EXPLORE_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Big Bull',
  url: 'https://big-bull.onrender.com/explore',
  description:
    'Practice trading in a realistic simulated market. Buy and sell virtual stocks risk-free, learn strategies, and build your skills before entering the real market.',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'INR',
  },
  featureList: [
    'Paper trading with virtual money',
    'Simulated stock market',
    'Mutual fund simulation',
    'Portfolio tracker',
    'AI trading copilot',
    'Tax harvesting calculator',
  ],
};

export const Explore = () => {
  const { isAuthenticated, isLoading } = useSelector(selectAuthState);

  return (
    <>
      <PageMeta
        title="Practice Stock Trading Risk-Free"
        description="Trade virtual stocks in a realistic simulated market. Learn trading strategies, track your portfolio, and build confidence — all with zero real money at stake."
        path="/explore"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(EXPLORE_JSON_LD)}</script>
      </Helmet>

      <div className="flex flex-col gap-16">
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
    </>
  );
};

export default Explore;
