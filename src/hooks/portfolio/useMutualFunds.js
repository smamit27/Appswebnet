import { usePortfolioContext } from '../../context/PortfolioContext.jsx';
import { useMemo } from 'react';

export function useMutualFunds() {
  const { holdings, loading } = usePortfolioContext();

  const mutualFunds = useMemo(() => {
    return holdings.filter(h => h.type === 'mutualFund');
  }, [holdings]);

  return { mutualFunds, loading };
}
