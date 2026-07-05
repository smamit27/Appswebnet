import { usePortfolioContext } from '../../context/PortfolioContext.jsx';

export function useTransactions() {
  const { transactions, loading } = usePortfolioContext();
  return { transactions, loading };
}
