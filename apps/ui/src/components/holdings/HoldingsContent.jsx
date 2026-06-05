import { useSelector } from 'react-redux';
import { Alert } from '../common';
import { PageHeader } from '../layout/PageHeader';
import { useGetHoldingsQuery } from '../../api/apiSlice';
import { HoldingsBreakdown } from './HoldingsBreakdown';

export const HoldingsContent = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { data: holdings = [], isLoading, error } = useGetHoldingsQuery(undefined, {
    skip: !isAuthenticated,
  });

  return (
    <>
      <PageHeader
        title="Holdings"
        description="Review your mutual funds and stocks in detail."
      />

      {error ? <Alert variant="danger">Unable to load holdings right now.</Alert> : null}

      <HoldingsBreakdown holdings={holdings} isLoading={isLoading} />
    </>
  );
};

export default HoldingsContent;
