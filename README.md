# IR_Khatary TradingView

A responsive web trading terminal and Android-ready app foundation for technical analysis and paper trading.

## Current foundation
- React + TypeScript + Vite
- Lightweight Charts candlestick chart
- Real Binance market history and live trade stream for supported crypto pairs
- Twelve Data adapter for historical/live FX and metals (requires your own API key and a plan that permits the symbols/intervals)
- EMA 20, SMA 50 and RSI calculation foundations
- Simulated paper positions with a $10,000 starting balance
- Persian RTL interface and dark/light themes
- Capacitor Android project configuration

## Run locally
```bash
npm install
cp .env.example .env
# Set VITE_TWELVE_DATA_API_KEY in .env for XAU/USD and FX
npm run dev
```

## Android
```bash
npm run android:sync
npx cap add android
npx cap sync android
npx cap open android
```
Build the signed APK from Android Studio. The generated Android platform folder is intentionally not committed; it is created by Capacitor.

## Market-data accuracy
Crypto candles and streaming prices are fetched from Binance public endpoints. FX/metals require a licensed market-data provider key. Polling intervals, provider limits, exchange outages, network latency and market-session availability mean no app can guarantee zero delay. The UI must always identify the provider and must not fabricate prices.

## Scope and licensing
This is an independent charting application, not the TradingView service. It does not include TradingView proprietary source code, paid data, broker access or proprietary indicators. Add providers only under their terms and obtain appropriate redistribution rights before public deployment.
