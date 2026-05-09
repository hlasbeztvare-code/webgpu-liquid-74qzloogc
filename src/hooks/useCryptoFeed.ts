import { useState, useEffect } from 'react';

interface Prices { sol: number; eth: number }
interface History { sol: number[]; eth: number[] }

const FALLBACK: Prices = { sol: 154.22, eth: 3421.50 };
const COINGECKO_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=solana,ethereum&vs_currencies=usd';
const POLL_MS = 60_000;
const MICRO_TICK_MS = 2_500;
const HISTORY_LEN = 20;

/**
 * useCryptoFeed
 * 
 * Fetches live SOL/ETH prices from CoinGecko every 60s.
 * Micro-ticks every 2.5s simulate sub-minute price movement.
 * Returns current prices, sparkline history, and last update timestamp.
 */
export function useCryptoFeed() {
  const [prices, setPrices] = useState<Prices>(FALLBACK);
  const [history, setHistory] = useState<History>({ sol: [], eth: [] });
  const [lastUpdate, setLastUpdate] = useState('');

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch(COINGECKO_URL);
        const data = await res.json();
        setPrices({ sol: data.solana.usd, eth: data.ethereum.usd });
        setLastUpdate(
          new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        );
      } catch {
        setPrices(FALLBACK);
      }
    };

    fetchPrices();
    const pollId = setInterval(fetchPrices, POLL_MS);

    const tickId = setInterval(() => {
      setPrices(prev => {
        const newSol = prev.sol + (Math.random() - 0.5) * 0.05;
        const newEth = prev.eth + (Math.random() - 0.5) * 0.2;

        setHistory(h => ({
          sol: [...h.sol.slice(-HISTORY_LEN), newSol],
          eth: [...h.eth.slice(-HISTORY_LEN), newEth],
        }));

        return { sol: newSol, eth: newEth };
      });
    }, MICRO_TICK_MS);

    return () => {
      clearInterval(pollId);
      clearInterval(tickId);
    };
  }, []);

  return { prices, history, lastUpdate };
}
