import '@vly-ai/integrations';
import { Toaster } from "@/components/ui/sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { RequireAdmin } from "@/components/RequireAdmin";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import React, { StrictMode, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import "./index.css";

// Lazy load route components for better code splitting
const Landing = lazy(() => import("./pages/Landing.tsx"));
const AuthPage = lazy(() => import("./pages/Auth.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
// Legacy dashboard (redirects)
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const Transactions = lazy(() => import("./pages/Transactions.tsx"));
const WalletPage = lazy(() => import("./pages/WalletPage.tsx"));
const Disputes = lazy(() => import("./pages/Disputes.tsx"));
const AIInsights = lazy(() => import("./pages/AIInsights.tsx"));
const Settings = lazy(() => import("./pages/Settings.tsx"));
// Buyer panel
const BuyerDashboard = lazy(() => import("./pages/buyer/BuyerDashboard.tsx"));
const BuyerWallet = lazy(() => import("./pages/buyer/BuyerWallet.tsx"));
const BuyerDeliveries = lazy(() => import("./pages/buyer/BuyerDeliveries.tsx"));
const BuyerOrders = lazy(() => import("./pages/buyer/BuyerOrders.tsx"));
const BuyerProfile = lazy(() => import("./pages/buyer/BuyerProfile.tsx"));
// Seller panel
const SellerDashboard = lazy(() => import("./pages/seller/SellerDashboard.tsx"));
const Marketplace = lazy(() => import("./pages/Marketplace.tsx"));
const SellerProducts = lazy(() => import("./pages/seller/SellerProducts.tsx"));
const SellerOrders = lazy(() => import("./pages/seller/SellerOrders.tsx"));
const SellerEarnings = lazy(() => import("./pages/seller/SellerEarnings.tsx"));
const SellerKYC = lazy(() => import("./pages/seller/SellerKYC.tsx"));
const SellerMessages = lazy(() => import("./pages/seller/SellerMessages.tsx"));
const SellerAnalytics = lazy(() => import("./pages/seller/SellerAnalytics.tsx"));
const SellerEscrow = lazy(() => import("./pages/seller/SellerEscrow.tsx"));
const SellerOffers = lazy(() => import("./pages/seller/SellerOffers.tsx"));
const SellerCustomers = lazy(() => import("./pages/seller/SellerCustomers.tsx"));
const SellerReviews = lazy(() => import("./pages/seller/SellerReviews.tsx"));
const SellerDelivery = lazy(() => import("./pages/seller/SellerDelivery.tsx"));
const SellerStore = lazy(() => import("./pages/seller/SellerStore.tsx"));
const SellerSettings = lazy(() => import("./pages/seller/SellerSettings.tsx"));
const BuyerDisputes = lazy(() => import("./pages/Disputes.tsx"));
const BuyerSettings = lazy(() => import("./pages/buyer/BuyerSettings.tsx"));
const SellerNotifications = lazy(() => import("./pages/seller/SellerNotifications.tsx"));
const SellerHelp = lazy(() => import("./pages/seller/SellerHelp.tsx"));
const SellerWithdrawals = lazy(() => import("./pages/seller/SellerWithdrawals.tsx"));
const SellerPromotions = lazy(() => import("./pages/seller/SellerPromotions.tsx"));
const SellerAddProduct = lazy(() => import("./pages/seller/SellerAddProduct.tsx"));
const SellerEditProduct = lazy(() => import("./pages/seller/SellerEditProduct.tsx"));
const JobBoard = lazy(() => import("./pages/JobBoard.tsx"));
const Chat = lazy(() => import("./pages/Chat.tsx"));
const ProductDetails = lazy(() => import("./pages/ProductDetails.tsx"));
const PrivacyPage = lazy(() => import("./pages/Privacy.tsx"));
const SellerProfilePage = lazy(() => import("./pages/SellerProfile.tsx"));
// Components
import MobileBottomNav from "@/components/MobileBottomNav";
import { ErrorBoundary } from "@/components/ErrorBoundary";
const TermsPage = lazy(() => import("./pages/Terms.tsx"));
// Admin panel
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard.tsx"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers.tsx"));
const AdminBuyers = lazy(() => import("./pages/admin/AdminBuyers.tsx"));
const AdminSellers = lazy(() => import("./pages/admin/AdminSellers.tsx"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts.tsx"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders.tsx"));
const AdminPayments = lazy(() => import("./pages/admin/AdminPayments.tsx"));
const AdminEscrow = lazy(() => import("./pages/admin/AdminEscrow.tsx"));
const AdminWallets = lazy(() => import("./pages/admin/AdminWallets.tsx"));
const AdminWithdrawals = lazy(() => import("./pages/admin/AdminWithdrawals.tsx"));
const AdminDeliveries = lazy(() => import("./pages/admin/AdminDeliveries.tsx"));
const AdminDisputes = lazy(() => import("./pages/admin/AdminDisputes.tsx"));
const AdminFraud = lazy(() => import("./pages/admin/AdminFraud.tsx"));
const AdminKYC = lazy(() => import("./pages/admin/AdminKYC.tsx"));
const AdminMessages = lazy(() => import("./pages/admin/AdminMessages.tsx"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews.tsx"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports.tsx"));
const AdminJobs = lazy(() => import("./pages/admin/AdminJobs.tsx"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics.tsx"));
const AdminRevenue = lazy(() => import("./pages/admin/AdminRevenue.tsx"));
const AdminSystem = lazy(() => import("./pages/admin/AdminSystem.tsx"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings.tsx"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications.tsx"));
const AdminAuditLogs = lazy(() => import("./pages/admin/AdminAuditLogs.tsx"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories.tsx"));


// Simple loading fallback for route transitions
function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

/** Silent error boundary — if VlyToolbar crashes it renders nothing instead of
 *  crashing the whole app (e.g. hook errors in WebContainer environment). */
class ToolbarErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: Error) {
    console.warn("[VlyToolbar] Caught error, toolbar disabled:", err.message);
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

/** Hard guard so runtime errors never leave the preview as a blank page. */
class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string; stack: string }
> {
  state = { hasError: false, message: "", stack: "" };
  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error.message || "Unknown runtime error",
      stack: error.stack || "",
    };
  }
  componentDidCatch(err: Error) {
    console.error("[WebContainer preview] Root crash:", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-lg text-center">
            <p className="text-sm font-semibold">Preview runtime error</p>
            <p className="mt-2 text-xs text-muted-foreground break-words">
              {this.state.message}
            </p>
            {this.state.stack && (
              <pre className="mt-3 text-left text-[10px] leading-4 text-muted-foreground/80 max-h-40 overflow-auto rounded border border-border/60 p-2">
                {this.state.stack}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);



function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <ToolbarErrorBoundary>
        <VlyToolbar />
      </ToolbarErrorBoundary>
      <ConvexAuthProvider client={convex}>
        <BrowserRouter>
          <RouteSyncer />
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/auth" element={<AuthPage redirectAfterAuth="/buyer" />} />
              <Route path="/jobs" element={<RequireAuth><JobBoard /></RequireAuth>} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/chat" element={<RequireAuth><Chat /></RequireAuth>} />
              <Route path="/chat/:conversationId" element={<RequireAuth><Chat /></RequireAuth>} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />

              {/* Legacy dashboard routes (backward compat) */}
              <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
              <Route path="/dashboard/transactions" element={<RequireAuth><Transactions /></RequireAuth>} />
              <Route path="/dashboard/wallet" element={<RequireAuth><WalletPage /></RequireAuth>} />
              <Route path="/dashboard/disputes" element={<RequireAuth><Disputes /></RequireAuth>} />
              <Route path="/dashboard/ai-insights" element={<RequireAuth><AIInsights /></RequireAuth>} />
              <Route path="/dashboard/settings" element={<RequireAuth><Settings /></RequireAuth>} />

              {/* Buyer routes */}
              <Route path="/buyer" element={<RequireAuth><BuyerDashboard /></RequireAuth>} />
              <Route path="/buyer/orders" element={<RequireAuth><BuyerOrders /></RequireAuth>} />
              <Route path="/buyer/wallet" element={<RequireAuth><BuyerWallet /></RequireAuth>} />
              <Route path="/buyer/disputes" element={<RequireAuth><BuyerDisputes /></RequireAuth>} />
              <Route path="/buyer/profile" element={<RequireAuth><BuyerProfile /></RequireAuth>} />
              <Route path="/buyer/marketplace" element={<RequireAuth><Marketplace /></RequireAuth>} />
              <Route path="/buyer/jobs" element={<RequireAuth><JobBoard /></RequireAuth>} />
              <Route path="/buyer/deliveries" element={<RequireAuth><BuyerDeliveries /></RequireAuth>} />
              <Route path="/buyer/settings" element={<RequireAuth><BuyerSettings /></RequireAuth>} />

              {/* Seller routes */}
              <Route path="/seller" element={<RequireAuth><SellerDashboard /></RequireAuth>} />
              <Route path="/seller/:userId" element={<SellerProfilePage />} />
              <Route path="/seller/products" element={<RequireAuth><SellerProducts /></RequireAuth>} />
              <Route path="/seller/add-product" element={<RequireAuth><SellerAddProduct /></RequireAuth>} />
              <Route path="/seller/edit-product/:id" element={<RequireAuth><SellerEditProduct /></RequireAuth>} />
              <Route path="/seller/orders" element={<RequireAuth><SellerOrders /></RequireAuth>} />
              <Route path="/seller/escrow" element={<RequireAuth><SellerEscrow /></RequireAuth>} />
              <Route path="/seller/messages" element={<RequireAuth><SellerMessages /></RequireAuth>} />
              <Route path="/seller/offers" element={<RequireAuth><SellerOffers /></RequireAuth>} />
              <Route path="/seller/customers" element={<RequireAuth><SellerCustomers /></RequireAuth>} />
              <Route path="/seller/earnings" element={<RequireAuth><SellerEarnings /></RequireAuth>} />
              <Route path="/seller/withdrawals" element={<RequireAuth><SellerWithdrawals /></RequireAuth>} />
              <Route path="/seller/delivery" element={<RequireAuth><SellerDelivery /></RequireAuth>} />
              <Route path="/seller/analytics" element={<RequireAuth><SellerAnalytics /></RequireAuth>} />
              <Route path="/seller/reviews" element={<RequireAuth><SellerReviews /></RequireAuth>} />
              <Route path="/seller/promotions" element={<RequireAuth><SellerPromotions /></RequireAuth>} />
              <Route path="/seller/kyc" element={<RequireAuth><SellerKYC /></RequireAuth>} />
              <Route path="/seller/store" element={<RequireAuth><SellerStore /></RequireAuth>} />
              <Route path="/seller/notifications" element={<RequireAuth><SellerNotifications /></RequireAuth>} />
              <Route path="/seller/settings" element={<RequireAuth><SellerSettings /></RequireAuth>} />
              <Route path="/seller/help" element={<RequireAuth><SellerHelp /></RequireAuth>} />

              {/* Admin routes */}
              <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
              <Route path="/admin/users" element={<RequireAdmin><AdminUsers /></RequireAdmin>} />
              <Route path="/admin/buyers" element={<RequireAdmin><AdminBuyers /></RequireAdmin>} />
              <Route path="/admin/sellers" element={<RequireAdmin><AdminSellers /></RequireAdmin>} />
              <Route path="/admin/products" element={<RequireAdmin><AdminProducts /></RequireAdmin>} />
              <Route path="/admin/orders" element={<RequireAdmin><AdminOrders /></RequireAdmin>} />
              <Route path="/admin/payments" element={<RequireAdmin><AdminPayments /></RequireAdmin>} />
              <Route path="/admin/escrow" element={<RequireAdmin><AdminEscrow /></RequireAdmin>} />
              <Route path="/admin/wallets" element={<RequireAdmin><AdminWallets /></RequireAdmin>} />
              <Route path="/admin/withdrawals" element={<RequireAdmin><AdminWithdrawals /></RequireAdmin>} />
              <Route path="/admin/deliveries" element={<RequireAdmin><AdminDeliveries /></RequireAdmin>} />
              <Route path="/admin/zones" element={<RequireAdmin><AdminDeliveries /></RequireAdmin>} />
              <Route path="/admin/disputes" element={<RequireAdmin><AdminDisputes /></RequireAdmin>} />
              <Route path="/admin/fraud" element={<RequireAdmin><AdminFraud /></RequireAdmin>} />
              <Route path="/admin/kyc" element={<RequireAdmin><AdminKYC /></RequireAdmin>} />
              <Route path="/admin/messages" element={<RequireAdmin><AdminMessages /></RequireAdmin>} />
              <Route path="/admin/reviews" element={<RequireAdmin><AdminReviews /></RequireAdmin>} />
              <Route path="/admin/reports" element={<RequireAdmin><AdminReports /></RequireAdmin>} />
              <Route path="/admin/jobs" element={<RequireAdmin><AdminJobs /></RequireAdmin>} />
              <Route path="/admin/analytics" element={<RequireAdmin><AdminAnalytics /></RequireAdmin>} />
              <Route path="/admin/revenue" element={<RequireAdmin><AdminRevenue /></RequireAdmin>} />
              <Route path="/admin/system" element={<RequireAdmin><AdminSystem /></RequireAdmin>} />
              <Route path="/admin/settings" element={<RequireAdmin><AdminSettings /></RequireAdmin>} />
              <Route path="/admin/notifications" element={<RequireAdmin><AdminNotifications /></RequireAdmin>} />
              <Route path="/admin/categories" element={<RequireAdmin><AdminCategories /></RequireAdmin>} />
              <Route path="/admin/audit-logs" element={<RequireAdmin><AdminAuditLogs /></RequireAdmin>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <MobileBottomNav />
        </BrowserRouter>
        <Toaster />
      </ConvexAuthProvider>
    </RootErrorBoundary>
  </StrictMode>,
);
