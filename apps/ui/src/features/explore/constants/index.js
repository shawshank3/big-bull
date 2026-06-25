import { TrendingUp, BarChart2, Users, Activity } from 'lucide-react';

export const STOCK_QUOTES = [
  {
    text: 'The stock market is a device for transferring money from the impatient to the patient.',
    author: 'Warren Buffett',
  },
  { text: 'In investing, what is comfortable is rarely profitable.', author: 'Robert Arnott' },
  {
    text: 'The four most dangerous words in investing are: "this time it\'s different."',
    author: 'Sir John Templeton',
  },
  {
    text: 'Wide diversification is only required when investors do not understand what they are doing.',
    author: 'Warren Buffett',
  },
  {
    text: "It's not whether you're right or wrong, but how much money you make when you're right.",
    author: 'George Soros',
  },
  {
    text: 'The individual investor should act consistently as an investor and not as a speculator.',
    author: 'Benjamin Graham',
  },
];

export const MARKET_FACTS = [
  {
    key: 'stockCount',
    icon: TrendingUp,
    label: 'Simulated Stocks',
    note: 'virtual equities to trade',
  },
  {
    key: 'mutualFundCount',
    icon: BarChart2,
    label: 'Mutual Funds',
    note: 'virtual schemes to invest in',
  },
  {
    key: 'totalTrades',
    icon: Activity,
    label: 'Trades Executed',
    note: 'across all paper traders',
  },
  {
    key: 'userCount',
    icon: Users,
    label: 'Paper Traders',
    note: 'registered on the platform',
  },
];

export const FEATURE_HIGHLIGHTS = [
  {
    title: 'Simulated Market Search',
    description:
      'Browse thousands of virtual stocks with simulated price movements — no real market data, just practice.',
    gradient: 'from-primary/10 to-primary/5',
    iconBg: 'bg-primary/10 text-primary',
    icon: '🔍',
  },
  {
    title: 'Paper Portfolio',
    description:
      'Build a virtual portfolio, track simulated P&L, and learn portfolio management without risking a rupee.',
    gradient: 'from-secondary/10 to-secondary/5',
    iconBg: 'bg-secondary/10 text-secondary',
    icon: '📊',
  },
  {
    title: 'AI Market Assistant',
    description:
      'Ask anything about trading strategies or the simulated market and get smart, context-aware answers.',
    gradient: 'from-warning/10 to-warning/5',
    iconBg: 'bg-warning/10 text-warning',
    icon: '🤖',
  },
];

export const TICKER_ITEMS = [
  { label: 'RELIANCE', change: '+1.23%', up: true },
  { label: 'TCS', change: '-0.45%', up: false },
  { label: 'HDFC BANK', change: '+0.87%', up: true },
  { label: 'INFOSYS', change: '+2.10%', up: true },
  { label: 'ICICI BANK', change: '-0.33%', up: false },
  { label: 'WIPRO', change: '+0.62%', up: true },
  { label: 'BAJAJ FINANCE', change: '-1.05%', up: false },
  { label: 'MARUTI', change: '+1.78%', up: true },
  { label: 'NIFTY 50', change: '+0.54%', up: true },
  { label: 'SENSEX', change: '+0.49%', up: true },
];
