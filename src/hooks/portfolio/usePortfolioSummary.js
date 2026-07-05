import { usePortfolioContext } from '../../context/PortfolioContext.jsx';

export function usePortfolioSummary() {
  const { summary, loading } = usePortfolioContext();
  return { summary, loading };
}
