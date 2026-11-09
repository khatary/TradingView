export type Candle = { time: number; open: number; high: number; low: number; close: number; volume?: number };
export type MarketSymbol = { symbol: string; label: string; kind: 'crypto' | 'forex' | 'metal'; provider: 'binance' | 'twelve' };
export const symbols: MarketSymbol[] = [
  { symbol: 'BTCUSDT', label: 'بیت‌کوین / تتر', kind: 'crypto', provider: 'binance' },
  { symbol: 'ETHUSDT', label: 'اتریوم / تتر', kind: 'crypto', provider: 'binance' },
  { symbol: 'SOLUSDT', label: 'سولانا / تتر', kind: 'crypto', provider: 'binance' },
  { symbol: 'XAU/USD', label: 'طلا / دلار', kind: 'metal', provider: 'twelve' },
  { symbol: 'EUR/USD', label: 'یورو / دلار', kind: 'forex', provider: 'twelve' },
  { symbol: 'GBP/USD', label: 'پوند / دلار', kind: 'forex', provider: 'twelve' },
  { symbol: 'USD/JPY', label: 'دلار / ین', kind: 'forex', provider: 'twelve' }
];
const apiKey = import.meta.env.VITE_TWELVE_DATA_API_KEY as string | undefined;
const intervalMap: Record<string,string> = { '1m':'1min', '5m':'5min', '15m':'15min', '30m':'30min', '1h':'1h', '4h':'4h', '1D':'1day', '1W':'1week', '1M':'1month' };
export async function loadHistory(item: MarketSymbol, interval: string): Promise<Candle[]> {
  if (item.provider === 'binance') {
    const q = new URLSearchParams({ symbol: item.symbol, interval: interval === '1D' ? '1d' : interval === '1W' ? '1w' : interval === '1M' ? '1M' : interval, limit: '500' });
    const r = await fetch('https://api.binance.com/api/v3/klines?' + q);
    if (!r.ok) throw new Error('دریافت تاریخچه از Binance ناموفق بود');
    const rows = await r.json();
    return rows.map((x: any[]) => ({ time: Math.floor(x[0]/1000), open:+x[1], high:+x[2], low:+x[3], close:+x[4], volume:+x[5] }));
  }
  if (!apiKey) throw new Error('برای داده واقعی طلا و فارکس، کلید API سرویس Twelve Data لازم است. آن را در VITE_TWELVE_DATA_API_KEY قرار بده.');
  const q = new URLSearchParams({ symbol: item.symbol, interval: intervalMap[interval] || '5min', outputsize: '500', apikey: apiKey, timezone: 'UTC' });
  const r = await fetch('https://api.twelvedata.com/time_series?' + q);
  const data = await r.json();
  if (!r.ok || data.status === 'error' || !data.values) throw new Error(data.message || 'دریافت تاریخچه ناموفق بود');
  return data.values.reverse().map((x: any) => ({ time: Math.floor(new Date(x.datetime + 'Z').getTime()/1000), open:+x.open, high:+x.high, low:+x.low, close:+x.close, volume:+(x.volume || 0) }));
}
export function connectCryptoTicker(symbol: string, onPrice: (price:number)=>void): () => void {
  const ws = new WebSocket('wss://stream.binance.com:9443/ws/' + symbol.toLowerCase() + '@trade');
  ws.onmessage = e => { try { onPrice(+JSON.parse(e.data).p); } catch {} };
  return () => ws.close();
}
export function connectTwelveTicker(symbol: string, onPrice: (price:number)=>void): () => void {
  if (!apiKey) return () => {};
  let active = true;
  const poll = async () => {
    try {
      const q = new URLSearchParams({ symbol, apikey: apiKey });
      const r = await fetch('https://api.twelvedata.com/price?' + q);
      const j = await r.json(); if (active && j.price) onPrice(+j.price);
    } catch {}
  };
  void poll(); const id = window.setInterval(poll, 15000);
  return () => { active = false; window.clearInterval(id); };
}
export function calculateSMA(data:Candle[], period:number) {
  return data.map((d,i) => ({ time:d.time, value:i+1<period ? NaN : data.slice(i+1-period,i+1).reduce((s,x)=>s+x.close,0)/period })).filter(x=>Number.isFinite(x.value));
}
export function calculateEMA(data:Candle[], period:number) {
  const k=2/(period+1); let prev=data[0]?.close || 0;
  return data.map((d,i)=>{ prev=i===0?d.close:d.close*k+prev*(1-k); return {time:d.time,value:prev}; });
}
export function calculateRSI(data:Candle[], period=14) {
  let gain=0,loss=0;
  for(let i=1;i<=period && i<data.length;i++){const d=data[i].close-data[i-1].close;gain+=Math.max(d,0);loss+=Math.max(-d,0);}
  let ag=gain/period,al=loss/period;
  return data.slice(period).map((d,i)=>{if(i>0){const delta=d.close-data[period+i-1].close;ag=(ag*(period-1)+Math.max(delta,0))/period;al=(al*(period-1)+Math.max(-delta,0))/period;}return {time:d.time,value:al===0?100:100-100/(1+ag/al)};});
}