import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import Index from "./pages/Index";
import Courses from "./pages/Courses";
import Categories from "./pages/Categories";
import CourseDetail from "./pages/CourseDetail";
import Checkout from "./pages/Checkout";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import Learn from "./pages/Learn";
import Auth from "./pages/Auth";
import Referrals from "./pages/Referrals";
import NotFound from "./pages/NotFound";
import Cart from "./pages/Cart";
import StudentDashboard from "./pages/dashboard/StudentDashboard";
import StudentPaymentHistory from "./pages/dashboard/StudentPaymentHistory";
import StudentReferralWithdrawals from "./pages/dashboard/StudentReferralWithdrawals";
import StudentCertificates from "./pages/dashboard/StudentCertificates";
import StudentWishlist from "./pages/dashboard/StudentWishlist";
import StudentNotifications from "./pages/dashboard/StudentNotifications";
import StudentInstructorApplication from "./pages/dashboard/StudentInstructorApplication";
import StudentQuizHistory from "./pages/dashboard/StudentQuizHistory";
import InstructorDashboard from "./pages/dashboard/InstructorDashboard";
import InstructorCourseCreate from "./pages/dashboard/InstructorCourseCreate";
import InstructorCourseDetail from "./pages/dashboard/InstructorCourseDetail";
import InstructorStudents from "./pages/dashboard/InstructorStudents";
import InstructorEarnings from "./pages/dashboard/InstructorEarnings";
import InstructorPayouts from "./pages/dashboard/InstructorPayouts";
import InstructorSettings from "./pages/dashboard/InstructorSettings";
import InstructorReviews from "./pages/dashboard/InstructorReviews";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import AdminUsers from "./pages/dashboard/AdminUsers";
import AdminApprovals from "./pages/dashboard/AdminApprovals";
import AdminCategories from "./pages/dashboard/AdminCategories";
import AdminCoupons from "./pages/dashboard/AdminCoupons";
import AdminPayments from "./pages/dashboard/AdminPayments";
import AdminAuditLogs from "./pages/dashboard/AdminAuditLogs";
import AdminEmailLogs from "./pages/dashboard/AdminEmailLogs";
import AdminSettings from "./pages/dashboard/AdminSettings";
import AdminCertificates from "./pages/dashboard/AdminCertificates";
import AdminInstructorVerifications from "./pages/dashboard/AdminInstructorVerifications";
import AdminNotifications from "./pages/dashboard/AdminNotifications";
import AdminPayouts from "./pages/dashboard/AdminPayouts";
import AdminManualPayments from "./pages/dashboard/AdminManualPayments";
import AdminRbac from "./pages/dashboard/AdminRbac";
import { ReactNode } from "react";
import { useContentProtection } from "@/hooks/use-content-protection";
import ContentProtectionOverlay from "@/components/security/ContentProtectionOverlay";

const queryClient = new QueryClient();

const ProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  allowedRoles: string[];
}) => {
  const { user, isLoggedIn } = useAuth();
  const { isContentObscured, isDevtoolsOpen } = useContentProtection({
    enabled: isLoggedIn,
    detectDevtools: true,
    blockPrint: true,
    blockSelection: true,
  });
  if (!isLoggedIn) return <Navigate to="/auth" replace />;
  const normalizedRole = user?.role?.startsWith("ROLE_")
    ? user.role.slice(5)
    : user?.role;
  if (!normalizedRole || !allowedRoles.includes(normalizedRole))
    return <Navigate to="/" replace />;
  return (
    <>
      {isContentObscured && (
        <ContentProtectionOverlay isDevtoolsOpen={isDevtoolsOpen} />
      )}
      {children}
    </>
  );
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/categories" element={<Categories />} />
    <Route path="/courses" element={<Courses />} />
    <Route path="/cart" element={<Cart />} />
    <Route path="/cart/checkout/success" element={<CheckoutSuccess />} />
    <Route path="/courses/:slug" element={<CourseDetail />} />
    <Route path="/courses/:slug/checkout" element={<Checkout />} />
    <Route
      path="/courses/:slug/checkout/success"
      element={<CheckoutSuccess />}
    />
    <Route path="/courses/:slug/learn" element={<Learn />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/referrals" element={<Referrals />} />

    {/* Student routes */}
    <Route
      path="/dashboard"
      element={
        <ProtectedRoute allowedRoles={["STUDENT"]}>
          <StudentDashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/payments"
      element={
        <ProtectedRoute allowedRoles={["STUDENT"]}>
          <StudentPaymentHistory />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/referral-withdrawals"
      element={
        <ProtectedRoute allowedRoles={["STUDENT"]}>
          <StudentReferralWithdrawals />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/certificates"
      element={
        <ProtectedRoute allowedRoles={["STUDENT"]}>
          <StudentCertificates />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/quiz-history"
      element={
        <ProtectedRoute allowedRoles={["STUDENT"]}>
          <StudentQuizHistory />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/wishlist"
      element={
        <ProtectedRoute allowedRoles={["STUDENT"]}>
          <StudentWishlist />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/notifications"
      element={
        <ProtectedRoute allowedRoles={["STUDENT"]}>
          <StudentNotifications />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/become-instructor"
      element={
        <ProtectedRoute allowedRoles={["STUDENT"]}>
          <StudentInstructorApplication />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/*"
      element={
        <ProtectedRoute allowedRoles={["STUDENT"]}>
          <StudentDashboard />
        </ProtectedRoute>
      }
    />

    {/* Instructor routes */}
    <Route
      path="/instructor"
      element={
        <ProtectedRoute allowedRoles={["INSTRUCTOR"]}>
          <InstructorDashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/instructor/courses/new"
      element={
        <ProtectedRoute allowedRoles={["INSTRUCTOR"]}>
          <InstructorCourseCreate />
        </ProtectedRoute>
      }
    />
    <Route
      path="/instructor/courses/:courseId"
      element={
        <ProtectedRoute allowedRoles={["INSTRUCTOR"]}>
          <InstructorCourseDetail />
        </ProtectedRoute>
      }
    />
    <Route
      path="/instructor/courses/:courseId/edit"
      element={
        <ProtectedRoute allowedRoles={["INSTRUCTOR"]}>
          <InstructorCourseCreate />
        </ProtectedRoute>
      }
    />
    <Route
      path="/instructor/students"
      element={
        <ProtectedRoute allowedRoles={["INSTRUCTOR"]}>
          <InstructorStudents />
        </ProtectedRoute>
      }
    />
    <Route
      path="/instructor/reviews"
      element={
        <ProtectedRoute allowedRoles={["INSTRUCTOR"]}>
          <InstructorReviews />
        </ProtectedRoute>
      }
    />
    <Route
      path="/instructor/earnings"
      element={
        <ProtectedRoute allowedRoles={["INSTRUCTOR"]}>
          <InstructorEarnings />
        </ProtectedRoute>
      }
    />
    <Route
      path="/instructor/payouts"
      element={
        <ProtectedRoute allowedRoles={["INSTRUCTOR"]}>
          <InstructorPayouts />
        </ProtectedRoute>
      }
    />
    <Route
      path="/instructor/settings"
      element={
        <ProtectedRoute allowedRoles={["INSTRUCTOR"]}>
          <InstructorSettings />
        </ProtectedRoute>
      }
    />
    <Route
      path="/instructor/*"
      element={
        <ProtectedRoute allowedRoles={["INSTRUCTOR"]}>
          <InstructorDashboard />
        </ProtectedRoute>
      }
    />

    {/* Admin routes */}
    <Route
      path="/admin"
      element={
        <ProtectedRoute allowedRoles={["ADMIN"]}>
          <AdminDashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/notifications"
      element={
        <ProtectedRoute allowedRoles={["ADMIN"]}>
          <AdminNotifications />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/users"
      element={
        <ProtectedRoute allowedRoles={["ADMIN"]}>
          <AdminUsers />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/approvals"
      element={
        <ProtectedRoute allowedRoles={["ADMIN"]}>
          <AdminApprovals />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/instructor-verifications"
      element={
        <ProtectedRoute allowedRoles={["ADMIN"]}>
          <AdminInstructorVerifications />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/categories"
      element={
        <ProtectedRoute allowedRoles={["ADMIN"]}>
          <AdminCategories />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/coupons"
      element={
        <ProtectedRoute allowedRoles={["ADMIN"]}>
          <AdminCoupons />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/certificates"
      element={
        <ProtectedRoute allowedRoles={["ADMIN"]}>
          <AdminCertificates />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/payments"
      element={
        <ProtectedRoute allowedRoles={["ADMIN"]}>
          <AdminPayments />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/manual-payments"
      element={
        <ProtectedRoute allowedRoles={["ADMIN"]}>
          <AdminManualPayments />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/payouts"
      element={
        <ProtectedRoute allowedRoles={["ADMIN"]}>
          <AdminPayouts />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/audit-logs"
      element={
        <ProtectedRoute allowedRoles={["ADMIN"]}>
          <AdminAuditLogs />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/email-logs"
      element={
        <ProtectedRoute allowedRoles={["ADMIN"]}>
          <AdminEmailLogs />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/rbac"
      element={
        <ProtectedRoute allowedRoles={["ADMIN"]}>
          <AdminRbac />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/settings"
      element={
        <ProtectedRoute allowedRoles={["ADMIN"]}>
          <AdminSettings />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/*"
      element={
        <ProtectedRoute allowedRoles={["ADMIN"]}>
          <AdminDashboard />
        </ProtectedRoute>
      }
    />

    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <AppRoutes />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
