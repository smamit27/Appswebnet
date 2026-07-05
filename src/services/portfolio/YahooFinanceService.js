export class YahooFinanceService {
  static async getStockPrice(symbol) {
    const cacheKey = `stock_price_${symbol}`;
    const cached = getCache(cacheKey);
    if (cached) return cached;

    try {
      const url = `https://corsproxy.io/?https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
      const res = await fetch(url);
      const data = await res.json();
      const price = data.chart.result[0].meta.regularMarketPrice;
      if (price) {
        setCache(cacheKey, price, 15 * 60 * 1000);
        return price;
      }
    } catch (err) {
      console.error(`Failed to fetch stock price for ${symbol}:`, err);
    }
    return null;
  }
}

function getCache(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { val, expiry } = JSON.parse(raw);
    if (Date.now() > expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return val;
  } catch (e) {
    return null;
  }
}

function setCache(key, val, durationMs = 15 * 60 * 1000) {
  try {
    localStorage.setItem(key, JSON.stringify({ val, expiry: Date.now() + durationMs }));
  } catch (e) {}
}
