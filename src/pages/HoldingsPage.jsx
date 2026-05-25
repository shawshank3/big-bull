import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Alert, Card, CardContent, Tabs, TabsContent, TabsList, TabsTrigger } from '../components/common';
import { MainLayout } from '../components/layout/MainLayout';
import { HoldingsTable } from '../components/holdings';
import { Spinner } from '../components/ui/spinner';
import { PageDescription, PageTitle } from '../components/ui/typography';
import { useGetMutualHoldingsQuery, useGetStockHoldingsQuery } from '../api/apiSlice';
import { HOLDING_TABS, HOLDING_TYPES } from '../constants/holdings';

const HoldingsTabPanel = ({ query, holdings }) => {
  if (query.error) {
    return <Alert variant="danger">Unable to load holdings. Please try again later.</Alert>;
  }

  if (query.isLoading) {
    return <Spinner label="Loading holdings…" />;
  }

  if (holdings.length === 0) {
    return <Alert variant="info">No holdings found in this category.</Alert>;
  }

  return <HoldingsTable holdings={holdings} />;
};

export const HoldingsPage = () => {
  const [activeTab, setActiveTab] = useState(HOLDING_TYPES.MUTUAL);
  const { isAuthenticated } = useSelector((state) => state.auth);

  const mutualQuery = useGetMutualHoldingsQuery(undefined, {
    skip: !isAuthenticated || activeTab !== HOLDING_TYPES.MUTUAL,
  });
  const stockQuery = useGetStockHoldingsQuery(undefined, {
    skip: !isAuthenticated || activeTab !== HOLDING_TYPES.STOCK,
  });

  return (
    <MainLayout>
      <div className="page-shell">
        <div className="page-header">
          <PageTitle>Holdings</PageTitle>
          <PageDescription>
            Review your holdings by category and spot opportunities quickly.
          </PageDescription>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            {HOLDING_TABS.map((tab) => (
              <TabsTrigger key={tab.key} value={tab.key}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <Card>
            <CardContent className="space-y-4 pt-6">
              <TabsContent value={HOLDING_TYPES.MUTUAL} className="mt-0">
                <HoldingsTabPanel query={mutualQuery} holdings={mutualQuery.data ?? []} />
              </TabsContent>
              <TabsContent value={HOLDING_TYPES.STOCK} className="mt-0">
                <HoldingsTabPanel query={stockQuery} holdings={stockQuery.data ?? []} />
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default HoldingsPage;
