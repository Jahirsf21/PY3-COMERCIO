import { Routes, Route, Navigate, useLocation } from "react-router-dom"
import Catalog from "@/features/catalog/Catalog"
import CartPage from "@/features/cart/CartPage"
import Checkout from "@/features/checkout/Checkout"
import PaymentPage from "@/features/payments/PaymentPage"
import OrdersPage from "@/features/orders/OrdersPage"
import OrderDetailPage from "@/features/orders/OrderDetailPage"
import ProductDetailPage from "@/features/product-detail/ProductDetailPage"
import PoliciesPage from "@/features/policies/PoliciesPage"
import LoginPage from "@/features/auth/LoginPage"
import AnalyticsPage from "@/features/analytics/AnalyticsPage"
import { useAuth } from "@/lib/auth/authContext"
import { useCart } from "@/lib/cart/cartContext"
import { StoreCartNoticeDialog } from "@/features/stores/StoreCartNoticeDialog"
import { ShopFooter } from "@/components/shop-footer"
import "@/App.css"


function App() {
  const { cart } = useCart()
  const { user } = useAuth()
  const location = useLocation()
  const { pathname } = location
  const purchase_redirect = !user
    ? <Navigate to="/login" replace state={{ from: location }} />
    : user.role === "ADMIN"
      ? <Navigate to="/" replace />
      : null

  return (
    <>
      <Routes>
        <Route path="/" element={<Catalog />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/carrito" element={purchase_redirect ?? <CartPage />} />
        <Route
          path="/checkout"
          element={purchase_redirect ?? (cart.length === 0 ? <Navigate to="/carrito" replace /> : <Checkout />)}
        />
        <Route path="/pedido/:orderId/pago" element={purchase_redirect ?? <PaymentPage />} />
        <Route path="/pedidos" element={<OrdersPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/politicas-y-ayuda" element={<PoliciesPage />} />
        <Route path="/pedido/:orderId" element={<OrderDetailPage />} />
        <Route path="/producto/:productId" element={<ProductDetailPage />} />
      </Routes>
      {pathname !== "/login" && <ShopFooter />}
      <StoreCartNoticeDialog />
    </>
  )
}

export default App
