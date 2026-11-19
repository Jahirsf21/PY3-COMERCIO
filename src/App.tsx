import { useLayoutEffect } from "react"
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
import AdminLayout from "@/features/admin/AdminLayout"
import AdminOrderDetailPage from "@/features/admin/AdminOrderDetailPage"
import { useAuth } from "@/lib/auth/authContext"
import { useCart } from "@/lib/cart/cartContext"
import { StoreCartNoticeDialog } from "@/features/stores/StoreCartNoticeDialog"
import { ShopFooter } from "@/components/shop-footer"
import "@/App.css"
import { routes } from "@/lib/navigation/routes"


function App() {
  const { cart } = useCart()
  const { user } = useAuth()
  const location = useLocation()
  const { pathname } = location
  const is_admin = user?.role === "ADMIN"
  const is_admin_panel = pathname === routes.admin || pathname.startsWith(`${routes.admin}/`)
  const purchase_redirect = is_admin
    ? <Navigate to={routes.catalog} replace />
    : null

  useLayoutEffect(() => {
    if (is_admin) window.scrollTo(0, 0)
  }, [is_admin, pathname])

  return (
    <>
      <Routes>
        <Route path={routes.catalog} element={<Catalog />} />
        <Route path={routes.login} element={<LoginPage />} />
        <Route
          path={routes.admin}
          element={user?.role === "ADMIN" ? <AdminLayout key={user.id} user={user} /> : <Navigate to={routes.catalog} replace />}
        >
          <Route index element={<Navigate to={routes.admin_orders} replace />} />
          <Route path={routes.admin_orders} element={null} />
          <Route path={routes.admin_products} element={null} />
          <Route path={routes.admin_analytics} element={null} />
          <Route path={routes.admin_order} element={user ? <AdminOrderDetailPage key={user.id} user={user} /> : null} />
          <Route path="*" element={<Navigate to={routes.admin_orders} replace />} />
        </Route>
        <Route path={routes.cart} element={purchase_redirect ?? <CartPage />} />
        <Route
          path={routes.checkout}
          element={purchase_redirect ?? (cart.length === 0 ? <Navigate to={routes.cart} replace /> : <Checkout />)}
        />
        <Route path={routes.order_payment} element={purchase_redirect ?? <PaymentPage />} />
        <Route
          path={routes.orders}
          element={!user ? <Navigate to={routes.login} replace state={{ from: location }} />
            : user.role === "ADMIN" ? <Navigate to={routes.admin_orders} replace />
              : <OrdersPage />}
        />
        <Route path={routes.analytics} element={<AnalyticsPage />} />
        <Route path={routes.policies} element={<PoliciesPage />} />
        <Route path={routes.order} element={<OrderDetailPage />} />
        <Route path={routes.product} element={<ProductDetailPage />} />
        <Route path="*" element={<Navigate to={routes.catalog} replace />} />
      </Routes>
      {pathname !== routes.login && !is_admin_panel && <ShopFooter />}
      <StoreCartNoticeDialog />
    </>
  )
}

export default App
