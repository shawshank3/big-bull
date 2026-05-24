import { useState } from 'react';
import { Alert, Button, Card, CardContent } from '../components/common';
import { MainLayout } from '../components/layout/MainLayout';
import { HoldingsTable } from '../components/holdings';
import { Spinner } from '../components/ui/spinner';
import { PageDescription, PageTitle } from '../components/ui/typography';
import { useGetMutualHoldingsQuery, useGetStockHoldingsQuery } from '../features/api/apiSlice';
import { HOLDING_TABS, HOLDING_TYPES } from '../constants/holdings';

export const HoldingsPage = () => {
  const [activeTab, setActiveTab] = useState(HOLDING_TYPES.MUTUAL);

  const mutualQuery = useGetMutualHoldingsQuery(undefined, { skip: activeTab !== HOLDING_TYPES.MUTUAL });
  const stockQuery = useGetStockHoldingsQuery(undefined, { skip: activeTab !== HOLDING_TYPES.STOCK });

  const currentQuery = activeTab === HOLDING_TYPES.MUTUAL ? mutualQuery : stockQuery;
  const holdings = currentQuery.data ?? [];

  return (
    <MainLayout>
      <div className="page-shell">
        <div className="page-header">
          <PageTitle>Holdings</PageTitle>
          <PageDescription>
            Review your holdings by category and spot opportunities quickly.
          </PageDescription>
        </div>

        <div className="flex flex-wrap gap-2">
          {HOLDING_TABS.map((tab) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? 'primary' : 'outline'}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        <Card>
          <CardContent className="space-y-4 pt-6">
            {currentQuery.error ? (
              <Alert variant="danger">Unable to load holdings. Please try again later.</Alert>
            ) : null}

            {currentQuery.isLoading ? (
              <Spinner label="Loading holdings…" />
            ) : holdings.length === 0 ? (
              <Alert variant="info">No holdings found in this category.</Alert>
            ) : (
              <HoldingsTable holdings={holdings} />
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default HoldingsPage;
