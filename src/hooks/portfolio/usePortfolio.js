import { usePortfolioContext } from '../../context/PortfolioContext.jsx';

export function usePortfolio() {
  const { holdings, loading } = usePortfolioContext();
  return { holdings, loading };
}
