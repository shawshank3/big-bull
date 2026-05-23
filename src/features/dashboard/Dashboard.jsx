import React, { useState } from 'react'
import { useGetMutualHoldingsQuery, useGetStockHoldingsQuery } from '../api/apiSlice'

function HoldingsList({ items }) {
  if (!items) return null
  return (
    <div>
      {items.map((h) => (
        <div key={h.id || h._id} className="post">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{h.name || h.symbol}</strong>
            <span>{h.quantity ?? h.qty}</span>
          </div>
          <div style={{ fontSize: 13, color: '#555' }}>
            Avg: {h.avgPrice ?? '-'} • Price: {h.currentPrice ?? '-'}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [tab, setTab] = useState('mutuals')

  const {
    data: mutuals,
    isLoading: loadingMutuals,
    error: mutualsError,
  } = useGetMutualHoldingsQuery(undefined, { skip: tab !== 'mutuals' })

  const {
    data: stocks,
    isLoading: loadingStocks,
    error: stocksError,
  } = useGetStockHoldingsQuery(undefined, { skip: tab !== 'stocks' })

  return (
    <div>
      <div className="tabs">
        <button className={`tab ${tab === 'mutuals' ? 'active' : ''}`} onClick={() => setTab('mutuals')}>Mutual Funds</button>
        <button className={`tab ${tab === 'stocks' ? 'active' : ''}`} onClick={() => setTab('stocks')}>Stocks</button>
      </div>

      <div style={{ marginTop: 12 }}>
        {tab === 'mutuals' && (
          <div>
            {loadingMutuals && <div className="loading">Loading mutual funds...</div>}
            {mutualsError && <div className="loading">Error loading mutual funds</div>}
            <HoldingsList items={mutuals} />
          </div>
        )}

        {tab === 'stocks' && (
          <div>
            {loadingStocks && <div className="loading">Loading stocks...</div>}
            {stocksError && <div className="loading">Error loading stocks</div>}
            <HoldingsList items={stocks} />
          </div>
        )}
      </div>
    </div>
  )
}
