import '@vly-ai/integrations';
import { Toaster } from "@/components/ui/sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { RequireAdmin } from "@/components/RequireAdmin";
import { RoleRouter } from "@/components/RoleRouter";
import { useAuth } from "@/hooks/use-auth";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import React, { StrictMode, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router";
import "./index.css";

// Lazy load route components for better code splitting
const Landing = lazy(() => import("./pages/Landing.tsx"));
const AuthPage = lazy(() => import("./pages/Auth.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
// Buyer panel
const BuyerDashboard = lazy(() => import("./pages/buyer/BuyerDashboard.tsx"));
const BuyerWallet = lazy(() => import("./pages/buyer/BuyerWallet.tsx"));
const BuyerDeliveries = lazy(() => import("./pages/buyer/BuyerDeliveries.tsx"));
const BuyerOrders = lazy(() => import("./pages/buyer/BuyerOrders.tsx"));
const BuyerProfile = lazy(() => import("./pages/buyer/BuyerProfile.tsx"));
const BuyerNotifications = lazy(() => import("./pages/buyer/BuyerNotifications.tsx"));
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
const FreelancerProfile = lazy(() => import("./pages/freelance/FreelancerProfile.tsx"));
// Freelance marketplace
const FreelanceLanding = lazy(() => import("./pages/freelance/FreelanceLanding.tsx"));
const FreelanceServiceDetail = lazy(() => import("./pages/freelance/FreelanceServiceDetail.tsx"));
const FreelanceJobs = lazy(() => import("./pages/freelance/FreelanceJobs.tsx"));
const FreelanceJobDetail = lazy(() => import("./pages/freelance/FreelanceJobDetail.tsx"));
const FreelancerTools = lazy(() => import("./pages/freelance/FreelancerTools.tsx"));

const FreelanceDashboard = lazy(() => import("./pages/freelance/FreelanceDashboard.tsx"));
// Employer panel
const EmployerDashboard = lazy(() => import("./pages/employer/EmployerDashboard.tsx"));
const EmployerJobs = lazy(() => import("./pages/employer/EmployerJobs.tsx"));
const EmployerProjects = lazy(() => import("./pages/employer/EmployerProjects.tsx"));
const FreelanceFindWork = lazy(() => import("./pages/freelance/FreelanceFindWork.tsx"));
const FreelanceFindFreelancers = lazy(() => import("./pages/freelance/FreelanceFindFreelancers.tsx"));
const FreelancePostTask = lazy(() => import("./pages/freelance/FreelancePostTask.tsx"));
const FreelanceProjects = lazy(() => import("./pages/freelance/FreelanceProjects.tsx"));
const FreelanceApplications = lazy(() => import("./pages/freelance/FreelanceApplications.tsx"));
const FreelanceServices = lazy(() => import("./pages/freelance/FreelanceServices.tsx"));
const FreelanceEarnings = lazy(() => import("./pages/freelance/FreelanceEarnings.tsx"));
const FreelanceSettings = lazy(() => import("./pages/freelance/FreelanceSettings.tsx"));
const FreelanceMessages = lazy(() => import("./pages/freelance/FreelanceMessages.tsx"));
const FreelanceNotifications = lazy(() => import("./pages/freelance/FreelanceNotifications.tsx"));
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
const AdminSellers = lazy(() => import("./pages/admin/AdminSellers.tsx"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts.tsx"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders.tsx"));
const AdminPayments = lazy(() => import("./pages/admin/AdminPayments.tsx"));
const AdminEscrow = lazy(() => import("./pages/admin/AdminEscrow.tsx"));
const AdminWallets = lazy(() => import("./pages/admin/AdminWallets.tsx"));
const AdminWithdrawals = lazy(() => import("./pages/admin/AdminWithdrawals.tsx"));
const AdminDeliveries = lazy(() => import("./pages/admin/AdminDeliveries.tsx"));
const AdminDisputes = lazy(() => import("./pages/admin/AdminDisputes.tsx"));
const AdminAI = lazy(() => import("./pages/admin/AdminAI.tsx"));
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
const AdminOwner = lazy(() => import("./pages/admin/AdminOwner.tsx"));
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

/**
 * Old single-dashboard URLs (pre role-panels) now redirect to the panel that
 * matches the signed-in user's role instead of showing a dead page.
 */
function LegacyDashboardRedirect() {
  const { isLoading, isAuthenticated, role } = useAuth();
  if (isLoading) return <RouteLoading />;
  if (!isAuthenticated) return <Navigate to="/auth?returnTo=/dashboard" replace />;
  const target =
    role === "admin"
      ? "/admin"
      : role === "seller"
      ? "/seller"
      : role === "freelancer"
      ? "/freelance/dashboard"
      : role === "employer"
      ? "/employer"
      : "/buyer";
  return <Navigate to={target} replace />;
}



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
              {/* Dedicated seller registration/sign-in panel — skips the "Choose Your Path" role cards */}
              <Route path="/auth/seller" element={<AuthPage sellerFirst redirectAfterAuth="/seller" />} />
              {/* Dedicated Writer/Freelancer registration/sign-in panel — the
                  Freelance counterpart of /auth/seller. Freelance accounts are
                  separate from Marketplace Seller accounts and never need a store. */}
              <Route path="/auth/freelance" element={<AuthPage freelanceFirst redirectAfterAuth="/freelance/dashboard" />} />
              {/* Public freelance jobs board (legacy /jobs URL) */}
              <Route path="/jobs" element={<FreelanceJobs />} />

              {/* Freelance Marketplace — services & digital tools, jobs, tools */}
              <Route path="/freelance" element={<FreelanceLanding />} />
              <Route path="/freelance/service/:id" element={<FreelanceServiceDetail />} />
              <Route path="/freelance/jobs" element={<FreelanceJobs />} />
              <Route path="/freelance/jobs/:id" element={<FreelanceJobDetail />} />
              {/* legacy deep-link kept for the freelancer panel's Find Work cards */}
              <Route path="/freelance/task/:id" element={<FreelanceJobDetail />} />
              <Route path="/freelance/tools" element={<FreelancerTools />} />
              <Route path="/freelance/dashboard" element={<RoleRouter allowedRoles={["freelancer"]}><FreelanceDashboard /></RoleRouter>} />
              {/* Employer routes — the employer panel is entirely separate from
                  the writer/freelancer panel. /employer/jobs is the applicant
                  management screen for the employer's own job posts. */}
              <Route path="/employer" element={<RoleRouter allowedRoles={["employer"]}><EmployerDashboard /></RoleRouter>} />
              <Route path="/employer/post-job" element={<RoleRouter allowedRoles={["employer"]}><FreelancePostTask /></RoleRouter>} />
              <Route path="/employer/jobs" element={<RoleRouter allowedRoles={["employer"]}><EmployerJobs /></RoleRouter>} />
              <Route path="/employer/projects" element={<RoleRouter allowedRoles={["employer"]}><EmployerProjects /></RoleRouter>} />
              <Route path="/employer/messages" element={<RoleRouter allowedRoles={["employer"]}><FreelanceMessages /></RoleRouter>} />
              <Route path="/employer/notifications" element={<RoleRouter allowedRoles={["employer"]}><FreelanceNotifications /></RoleRouter>} />
              <Route path="/employer/earnings" element={<RoleRouter allowedRoles={["employer"]}><FreelanceEarnings /></RoleRouter>} />
              <Route path="/freelance/find-work" element={<RoleRouter allowedRoles={["freelancer"]}><FreelanceFindWork /></RoleRouter>} />
              {/* Finding talent is an employer action, not a freelancer one. */}
              <Route path="/freelance/find-freelancers" element={<RoleRouter allowedRoles={["employer"]}><FreelanceFindFreelancers /></RoleRouter>} />
              {/* Writers/freelancers must NOT see the post-task screen; the
                  backend role-gates createTask to employers as well. */}
              <Route path="/freelance/post-task" element={<RoleRouter allowedRoles={["employer"]}><FreelancePostTask /></RoleRouter>} />
              <Route path="/freelance/projects" element={<RoleRouter allowedRoles={["freelancer"]}><FreelanceProjects /></RoleRouter>} />
              <Route path="/freelance/applications" element={<RoleRouter allowedRoles={["freelancer"]}><FreelanceApplications /></RoleRouter>} />
              {/* Publishing a freelance service — the freelancer's own flow
                  (seller-style wizard, no seller layout, marketplace locked to
                  freelance). Services land in the Freelance Marketplace. */}
              <Route path="/freelance/publish" element={<RoleRouter allowedRoles={["freelancer", "seller"]}><SellerAddProduct freelanceMode /></RoleRouter>} />
              <Route path="/freelance/edit-service/:id" element={<RoleRouter allowedRoles={["freelancer", "seller"]}><SellerEditProduct freelanceMode /></RoleRouter>} />
              {/* Public freelancer profile — NOT a seller store page. */}
              <Route path="/freelancer/:userId" element={<FreelancerProfile />} />
              <Route path="/freelance/services" element={<RoleRouter allowedRoles={["freelancer"]}><FreelanceServices /></RoleRouter>} />
              <Route path="/freelance/earnings" element={<RoleRouter allowedRoles={["freelancer"]}><FreelanceEarnings /></RoleRouter>} />
              <Route path="/freelance/settings" element={<RoleRouter allowedRoles={["freelancer"]}><FreelanceSettings /></RoleRouter>} />
              <Route path="/freelance/messages" element={<RoleRouter allowedRoles={["freelancer"]}><FreelanceMessages /></RoleRouter>} />
              <Route path="/freelance/notifications" element={<RoleRouter allowedRoles={["freelancer"]}><FreelanceNotifications /></RoleRouter>} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/chat" element={<RequireAuth><Chat /></RequireAuth>} />
              <Route path="/chat/:conversationId" element={<RequireAuth><Chat /></RequireAuth>} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />

              {/* Legacy /dashboard/* URLs redirect to the current role-based panel */}
              <Route path="/dashboard/*" element={<LegacyDashboardRedirect />} />

              {/* Buyer routes (buyer role only — sellers/admins get bounced to their own panel) */}
              <Route path="/buyer" element={<RoleRouter allowedRoles={["buyer"]}><BuyerDashboard /></RoleRouter>} />
              <Route path="/buyer/orders" element={<RoleRouter allowedRoles={["buyer"]}><BuyerOrders /></RoleRouter>} />
              <Route path="/buyer/wallet" element={<RoleRouter allowedRoles={["buyer"]}><BuyerWallet /></RoleRouter>} />
              <Route path="/buyer/disputes" element={<RoleRouter allowedRoles={["buyer"]}><BuyerDisputes /></RoleRouter>} />
              <Route path="/buyer/profile" element={<RoleRouter allowedRoles={["buyer"]}><BuyerProfile /></RoleRouter>} />
              <Route path="/buyer/notifications" element={<RoleRouter allowedRoles={["buyer"]}><BuyerNotifications /></RoleRouter>} />
              <Route path="/buyer/marketplace" element={<RoleRouter allowedRoles={["buyer"]}><Marketplace /></RoleRouter>} />
              <Route path="/buyer/jobs" element={<RoleRouter allowedRoles={["buyer"]}><FreelanceJobs /></RoleRouter>} />
              <Route path="/buyer/deliveries" element={<RoleRouter allowedRoles={["buyer"]}><BuyerDeliveries /></RoleRouter>} />
              <Route path="/buyer/settings" element={<RoleRouter allowedRoles={["buyer"]}><BuyerSettings /></RoleRouter>} />

              {/* Seller routes (seller role only — public /seller/:userId profile stays open) */}
              <Route path="/seller" element={<RoleRouter allowedRoles={["seller"]}><SellerDashboard /></RoleRouter>} />
              <Route path="/seller/:userId" element={<SellerProfilePage />} />
              <Route path="/seller/products" element={<RoleRouter allowedRoles={["seller"]}><SellerProducts /></RoleRouter>} />
              <Route path="/seller/add-product" element={<RoleRouter allowedRoles={["seller"]}><SellerAddProduct /></RoleRouter>} />
              <Route path="/seller/edit-product/:id" element={<RoleRouter allowedRoles={["seller"]}><SellerEditProduct /></RoleRouter>} />
              <Route path="/seller/orders" element={<RoleRouter allowedRoles={["seller"]}><SellerOrders /></RoleRouter>} />
              <Route path="/seller/escrow" element={<RoleRouter allowedRoles={["seller"]}><SellerEscrow /></RoleRouter>} />
              <Route path="/seller/messages" element={<RoleRouter allowedRoles={["seller"]}><SellerMessages /></RoleRouter>} />
              <Route path="/seller/offers" element={<RoleRouter allowedRoles={["seller"]}><SellerOffers /></RoleRouter>} />
              <Route path="/seller/customers" element={<RoleRouter allowedRoles={["seller"]}><SellerCustomers /></RoleRouter>} />
              <Route path="/seller/earnings" element={<RoleRouter allowedRoles={["seller"]}><SellerEarnings /></RoleRouter>} />
              <Route path="/seller/withdrawals" element={<RoleRouter allowedRoles={["seller"]}><SellerWithdrawals /></RoleRouter>} />
              <Route path="/seller/delivery" element={<RoleRouter allowedRoles={["seller"]}><SellerDelivery /></RoleRouter>} />
              <Route path="/seller/analytics" element={<RoleRouter allowedRoles={["seller"]}><SellerAnalytics /></RoleRouter>} />
              <Route path="/seller/reviews" element={<RoleRouter allowedRoles={["seller"]}><SellerReviews /></RoleRouter>} />
              <Route path="/seller/promotions" element={<RoleRouter allowedRoles={["seller"]}><SellerPromotions /></RoleRouter>} />
              <Route path="/seller/kyc" element={<RoleRouter allowedRoles={["seller"]}><SellerKYC /></RoleRouter>} />
              <Route path="/seller/store" element={<RoleRouter allowedRoles={["seller"]}><SellerStore /></RoleRouter>} />
              <Route path="/seller/notifications" element={<RoleRouter allowedRoles={["seller"]}><SellerNotifications /></RoleRouter>} />
              <Route path="/seller/settings" element={<RoleRouter allowedRoles={["seller"]}><SellerSettings /></RoleRouter>} />
              <Route path="/seller/help" element={<RoleRouter allowedRoles={["seller"]}><SellerHelp /></RoleRouter>} />

              {/* Admin routes */}
              <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
              <Route path="/admin/users" element={<RequireAdmin><AdminUsers /></RequireAdmin>} />
              <Route path="/admin/sellers" element={<RequireAdmin><AdminSellers /></RequireAdmin>} />
              <Route path="/admin/products" element={<RequireAdmin><AdminProducts /></RequireAdmin>} />
              <Route path="/admin/orders" element={<RequireAdmin><AdminOrders /></RequireAdmin>} />
              <Route path="/admin/payments" element={<RequireAdmin><AdminPayments /></RequireAdmin>} />
              <Route path="/admin/escrow" element={<RequireAdmin><AdminEscrow /></RequireAdmin>} />
              <Route path="/admin/wallets" element={<RequireAdmin><AdminWallets /></RequireAdmin>} />
              <Route path="/admin/withdrawals" element={<RequireAdmin><AdminWithdrawals /></RequireAdmin>} />
              <Route path="/admin/deliveries" element={<RequireAdmin><AdminDeliveries /></RequireAdmin>} />
              <Route path="/admin/disputes" element={<RequireAdmin><AdminDisputes /></RequireAdmin>} />
              <Route path="/admin/ai" element={<RequireAdmin><AdminAI /></RequireAdmin>} />
              <Route path="/admin/owner" element={<RequireAdmin><AdminOwner /></RequireAdmin>} />
              <Route path="/admin/kyc" element={<RequireAdmin><AdminKYC /></RequireAdmin>} />
              <Route path="/admin/messages" element={<RequireAdmin><AdminMessages /></RequireAdmin>} />
              <Route path="/admin/reviews" element={<RequireAdmin><AdminReviews /></RequireAdmin>} />
              <Route path="/admin/reports" element={<RequireAdmin><AdminReports /></RequireAdmin>} />
              <Route path="/admin/jobs" element={<RequireAdmin><AdminJobs /></RequireAdmin>} />
              <Route path="/admin/categories" element={<RequireAdmin><AdminCategories /></RequireAdmin>} />
              <Route path="/admin/analytics" element={<RequireAdmin><AdminAnalytics /></RequireAdmin>} />
              <Route path="/admin/revenue" element={<RequireAdmin><AdminRevenue /></RequireAdmin>} />
              <Route path="/admin/system" element={<RequireAdmin><AdminSystem /></RequireAdmin>} />
              <Route path="/admin/settings" element={<RequireAdmin><AdminSettings /></RequireAdmin>} />
              <Route path="/admin/notifications" element={<RequireAdmin><AdminNotifications /></RequireAdmin>} />
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
