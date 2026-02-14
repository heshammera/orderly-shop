import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import CreateStore from "./pages/CreateStore";
import Dashboard from "./pages/Dashboard";
import StoreDashboard from "./pages/StoreDashboard";
import StoreProducts from "./pages/StoreProducts";
import StoreCategories from "./pages/StoreCategories";
import StoreOrders from "./pages/StoreOrders";
import StoreCustomers from "./pages/StoreCustomers";
import StoreCoupons from "./pages/StoreCoupons";
import StoreWallet from "./pages/StoreWallet";
import StoreSettings from "./pages/StoreSettings";
import StoreIntegrations from "./pages/StoreIntegrations";
import StoreAnalytics from "./pages/StoreAnalytics";
import StoreTeam from "./pages/StoreTeam";
import JoinStore from "./pages/JoinStore";
import NotFound from "./pages/NotFound";
// Storefront pages
import StoreLayout from "./pages/store/StoreLayout";
import StoreHome from "./pages/store/StoreHome";
import ProductCatalog from "./pages/store/ProductCatalog";
import ProductDetail from "./pages/store/ProductDetail";
import Cart from "./pages/store/Cart";
import Checkout from "./pages/store/Checkout";
import TrackOrder from "./pages/store/TrackOrder";
import OrderDetails from "./pages/store/OrderDetails";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminStores from "./pages/admin/AdminStores";
import AdminRechargeRequests from "./pages/admin/AdminRechargeRequests";
import { DashboardLayout } from "./components/dashboard/DashboardLayout";
import { RoleGuard } from "./components/auth/RoleGuard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/create-store" element={<CreateStore />} />
            <Route path="/join-store" element={<JoinStore />} />

            {/* Store Dashboard Routes - Using legacy Dashboard file or new layout? 
                The user has been using DashboardLayout in individual pages. 
                Let's keep the existing structure for dashboard routes if they were working.
            */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/store/:storeId" element={<StoreDashboard />} />
            {/* Protected Routes with RoleGuard */}
            <Route path="/store/:storeId/analytics" element={<StoreAnalytics />} /> {/* Everyone */}

            {/* Editor & Admin Routes */}
            <Route path="/store/:storeId/products" element={
              <RoleGuard allowedRoles={['owner', 'admin', 'editor']}>
                <StoreProducts />
              </RoleGuard>
            } />
            <Route path="/store/:storeId/categories" element={
              <RoleGuard allowedRoles={['owner', 'admin', 'editor']}>
                <StoreCategories />
              </RoleGuard>
            } />
            <Route path="/store/:storeId/coupons" element={
              <RoleGuard allowedRoles={['owner', 'admin', 'editor']}>
                <StoreCoupons />
              </RoleGuard>
            } />

            {/* Restricted Routes (Admin & Owner) */}
            <Route path="/store/:storeId/wallet" element={
              <RoleGuard allowedRoles={['owner']}>
                <StoreWallet />
              </RoleGuard>
            } />
            <Route path="/store/:storeId/settings" element={
              <RoleGuard allowedRoles={['owner', 'admin']}>
                <StoreSettings />
              </RoleGuard>
            } />
            <Route path="/store/:storeId/integrations" element={
              <RoleGuard allowedRoles={['owner', 'admin']}>
                <StoreIntegrations />
              </RoleGuard>
            } />
            <Route path="/store/:storeId/team" element={
              <RoleGuard allowedRoles={['owner', 'admin']}>
                <StoreTeam />
              </RoleGuard>
            } />

            {/* Shared Routes default to accessible if member */}
            <Route path="/store/:storeId/orders" element={<StoreOrders />} />
            <Route path="/store/:storeId/customers" element={<StoreCustomers />} />

            {/* Platform Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="stores" element={<AdminStores />} />
              <Route path="recharge-requests" element={<AdminRechargeRequests />} />
            </Route>

            {/* Public Storefront Routes */}
            <Route path="/s/:storeSlug" element={<StoreLayout />}>
              <Route index element={<StoreHome />} />
              <Route path="products" element={<ProductCatalog />} />
              <Route path="product/:productId" element={<ProductDetail />} />
              <Route path="cart" element={<Cart />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="track" element={<TrackOrder />} />
              <Route path="orders/:orderNumber" element={<OrderDetails />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
