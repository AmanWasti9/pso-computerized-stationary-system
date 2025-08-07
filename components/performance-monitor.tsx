"use client"

import { useEffect, useState } from 'react'
import { CacheManager } from '@/lib/cache'

interface PerformanceMetrics {
  cacheHits: number
  cacheMisses: number
  apiCalls: number
  averageResponseTime: number
  lastRefresh: Date | null
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    cacheHits: 0,
    cacheMisses: 0,
    apiCalls: 0,
    averageResponseTime: 0,
    lastRefresh: null
  })
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV === 'development') {
      const updateMetrics = () => {
        const cacheStats = CacheManager.getStats()
        setMetrics(prev => ({
          ...prev,
          ...cacheStats,
          lastRefresh: new Date()
        }))
      }

      // Update metrics every 5 seconds
      const interval = setInterval(updateMetrics, 5000)
      updateMetrics() // Initial update

      return () => clearInterval(interval)
    }
  }, [])

  // Only render in development
  if (process.env.NODE_ENV !== 'development' || !isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white p-2 rounded-full text-xs z-50"
        title="Show Performance Metrics"
      >
        📊
      </button>
    )
  }

  const cacheHitRate = metrics.cacheHits + metrics.cacheMisses > 0 
    ? ((metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100).toFixed(1)
    : '0'

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg z-50 text-xs max-w-xs">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-gray-800">Performance</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-1 text-gray-600">
        <div className="flex justify-between">
          <span>Cache Hit Rate:</span>
          <span className={`font-medium ${parseFloat(cacheHitRate) > 70 ? 'text-green-600' : 'text-yellow-600'}`}>
            {cacheHitRate}%
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Cache Hits:</span>
          <span className="font-medium text-green-600">{metrics.cacheHits}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Cache Misses:</span>
          <span className="font-medium text-red-600">{metrics.cacheMisses}</span>
        </div>
        
        <div className="flex justify-between">
          <span>API Calls:</span>
          <span className="font-medium">{metrics.apiCalls}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Avg Response:</span>
          <span className="font-medium">{metrics.averageResponseTime}ms</span>
        </div>
        
        {metrics.lastRefresh && (
          <div className="text-xs text-gray-500 mt-2">
            Last updated: {metrics.lastRefresh.toLocaleTimeString()}
          </div>
        )}
      </div>
      
      <button
        onClick={() => {
          CacheManager.clearAll()
          setMetrics(prev => ({
            ...prev,
            cacheHits: 0,
            cacheMisses: 0,
            apiCalls: 0
          }))
        }}
        className="mt-2 w-full bg-red-500 text-white py-1 px-2 rounded text-xs hover:bg-red-600"
      >
        Clear Cache
      </button>
    </div>
  )
}