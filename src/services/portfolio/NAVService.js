export class NAVService {
  static async getLiveNAV(isin) {
    const cacheKey = `mf_nav_${isin}`;
    const cached = getCache(cacheKey);
    if (cached) return cached;

    try {
      const searchUrl = `https://api.mfapi.in/mf/search?q=${isin}`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();
      
      if (searchData && searchData.length > 0) {
        const schemeCode = searchData[0].schemeCode;
        const detailUrl = `https://api.mfapi.in/mf/${schemeCode}`;
        const detailRes = await fetch(detailUrl);
        const detailData = await detailRes.json();
        
        if (detailData && detailData.data && detailData.data.length > 0) {
          const nav = parseFloat(detailData.data[0].nav);
          if (nav) {
            setCache(cacheKey, nav, 15 * 60 * 1000);
            return nav;
          }
        }
      }
    } catch (err) {
      console.error(`Failed to fetch NAV for ISIN ${isin}:`, err);
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
