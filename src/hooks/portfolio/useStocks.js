import { usePortfolioContext } from '../../context/PortfolioContext.jsx';
import { useMemo } from 'react';

export function useStocks() {
  const { holdings, loading } = usePortfolioContext();

  const stocks = useMemo(() => {
    return holdings.filter(h => h.type === 'stock');
  }, [holdings]);

  return { stocks, loading };
}
