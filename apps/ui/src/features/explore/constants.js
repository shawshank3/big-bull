import { TrendingUp, BarChart2, Shield, Zap } from 'lucide-react';

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
  { icon: TrendingUp, label: 'NSE Listed Companies', value: '2,000+', note: 'across 20+ sectors' },
  {
    icon: BarChart2,
    label: 'Daily Traded Volume',
    value: '₹50,000 Cr+',
    note: 'average turnover on NSE',
  },
  {
    icon: Shield,
    label: 'Mutual Fund Schemes',
    value: '1,500+',
    note: 'across equity, debt & hybrid',
  },
  {
    icon: Zap,
    label: 'SEBI Registered Investors',
    value: '15 Cr+',
    note: 'and growing every year',
  },
];

export const FEATURE_HIGHLIGHTS = [
  {
    title: 'Real-time Search',
    description:
      'Search across thousands of NSE/BSE stocks and mutual fund schemes instantly with live quotes.',
    gradient: 'from-primary/10 to-primary/5',
    iconBg: 'bg-primary/10 text-primary',
    icon: '🔍',
  },
  {
    title: 'Portfolio Tracking',
    description:
      'Log your holdings, track P&L, and get a consolidated view of your entire investment portfolio.',
    gradient: 'from-secondary/10 to-secondary/5',
    iconBg: 'bg-secondary/10 text-secondary',
    icon: '📊',
  },
  {
    title: 'AI Market Assistant',
    description:
      'Ask anything about markets, stocks, or investing and get smart, context-aware answers.',
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
