// Event Type Constants for SSE and WebSocket

// Server-Sent Events (SSE) Types
const SSE_EVENTS = {
  PRICE_UPDATE: 'price_update',
  VOLATILITY_ALERT: 'volatility_alert',
  MARKET_STATUS: 'market_status',
  PORTFOLIO_UPDATE: 'portfolio_update',
  TRANSACTION_COMPLETE: 'transaction_complete',
  WALLET_UPDATE: 'wallet_update',
  NEWS_UPDATE: 'news_update',
  HEARTBEAT: 'heartbeat',
};

// WebSocket Event Types
const WS_EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe',
  ERROR: 'error',
};

// Chat Event Types
const CHAT_EVENTS = {
  MESSAGE: 'message',
  USER_JOIN: 'user_join',
  USER_LEAVE: 'user_leave',
  TYPING_START: 'typing_start',
  TYPING_STOP: 'typing_stop',
  ROOM_CREATED: 'room_created',
  ROOM_DELETED: 'room_deleted',
};

// Market Event Types
const MARKET_EVENTS = {
  MARKET_OPEN: 'market_open',
  MARKET_CLOSE: 'market_close',
  TRADING_HALT: 'trading_halt',
  TRADING_RESUME: 'trading_resume',
  CIRCUIT_BREAKER: 'circuit_breaker',
};

module.exports = {
  SSE_EVENTS,
  WS_EVENTS,
  CHAT_EVENTS,
  MARKET_EVENTS,
};
