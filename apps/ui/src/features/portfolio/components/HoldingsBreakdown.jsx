import { Alert } from '@/shared/ui/alert';
import { Card, CardContent } from '@/shared/components/card';
import { Spinner } from '@/shared/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/tabs';
import { HOLDING_TABS, HOLDING_TYPES } from '../constants/holdings';
import { HoldingsSectionHeader } from './HoldingsSectionHeader';
import { HoldingsTable } from './HoldingsTable';

export const HoldingsBreakdown = ({ holdings, isLoading, showNavigate = false }) => {
  const holdingsByType = (type) => holdings.filter((h) => h.type === type);

  if (isLoading) return <Spinner label="Loading holdings…" />;
  if (holdings.length === 0)
    return <Alert variant="info">No holdings found. Add a holding to see insights here.</Alert>;

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <HoldingsSectionHeader showNavigate={showNavigate} />
        <Tabs defaultValue={HOLDING_TYPES.MUTUAL}>
          <TabsList>
            {HOLDING_TABS.map((tab) => (
              <TabsTrigger key={tab.key} value={tab.key}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {HOLDING_TABS.map((tab) => {
            const items = holdingsByType(tab.key);
            return (
              <TabsContent key={tab.key} value={tab.key}>
                {items.length === 0 ? (
                  <Alert variant="info">No {tab.label.toLowerCase()} in your portfolio.</Alert>
                ) : (
                  <HoldingsTable holdings={items} />
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default HoldingsBreakdown;
