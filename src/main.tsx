import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { AnalyticsProvider } from '@/lib/analytics/analyticsProvider'
import { AuthProvider } from '@/lib/auth/authProvider'
import { CartProvider } from '@/lib/cart/cartProvider'
import { OrdersProvider } from '@/lib/orders/ordersProvider'
import { StoresProvider } from '@/lib/stores/storesProvider'
import { Toaster } from '@/components/ui/toast'
import '@/index.css'
import App from '@/App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <AnalyticsProvider>
        <StoresProvider>
          <CartProvider>
            <OrdersProvider>
              <HashRouter>
                <Toaster>
                  <App />
                </Toaster>
              </HashRouter>
            </OrdersProvider>
          </CartProvider>
        </StoresProvider>
      </AnalyticsProvider>
    </AuthProvider>
  </StrictMode>
)
