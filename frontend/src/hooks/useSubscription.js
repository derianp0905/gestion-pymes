import { useState, useEffect } from 'react'
import api from '../api/client'

export function useSubscription() {
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/subscriptions/mi-estado')
      .then(({ data }) => setSubscription(data))
      .catch(() => setSubscription(null))
      .finally(() => setLoading(false))
  }, [])

  const hasModule = (moduleKey) => {
    if (!subscription) return false
    if (!['active', 'trial'].includes(subscription.status)) return false
    return subscription.modulos?.includes(moduleKey) ?? false
  }

  return { subscription, loading, hasModule }
}
