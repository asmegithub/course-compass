import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import StudentDashboard from "./pages/dashboard/StudentDashboard";
import StudentInstructorApplication from "./pages/dashboard/StudentInstructorApplication";
import InstructorDashboard from "./pages/dashboard/InstructorDashboard";
import InstructorCourseCreate from "./pages/dashboard/InstructorCourseCreate";
import InstructorCourseDetail from "./pages/dashboard/InstructorCourseDetail";
import InstructorStudents from "./pages/dashboard/InstructorStudents";
import InstructorEarnings from "./pages/dashboard/InstructorEarnings";
import InstructorPayouts from "./pages/dashboard/InstructorPayouts";
import InstructorSettings from "./pages/dashboard/InstructorSettings";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import AdminUsers from "./pages/dashboard/AdminUsers";
import AdminApprovals from "./pages/dashboard/AdminApprovals";
import AdminCategories from "./pages/dashboard/AdminCategories";
import AdminCoupons from "./pages/dashboard/AdminCoupons";
import AdminPayments from "./pages/dashboard/AdminPayments";
import AdminAuditLogs from "./pages/dashboard/AdminAuditLogs";
import AdminEmailLogs from "./pages/dashboard/AdminEmailLogs";
import AdminSettings from "./pages/dashboard/AdminSettings";
import AdminInstructorVerifications from "./pages/dashboard/AdminInstructorVerifications";
import { ReactNode } from "react";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, allowedRoles }: { children: ReactNode; allowedRoles: string[] }) => {
  const { user, isLoggedIn } = useAuth();
  if (!isLoggedIn) return <Navigate to="/auth" replace />;
  if (!allowedRoles.includes(user!.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/courses" element={<Courses />} />
    <Route path="/courses/:slug" element={<CourseDetail />} />
    <Route path="/auth" element={<Auth />} />

    {/* Student routes */}
    <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentDashboard /></ProtectedRoute>} />
    <Route path="/dashboard/become-instructor" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentInstructorApplication /></ProtectedRoute>} />
    <Route path="/dashboard/*" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentDashboard /></ProtectedRoute>} />

    {/* Instructor routes */}
    <Route path="/instructor" element={<ProtectedRoute allowedRoles={['INSTRUCTOR']}><InstructorDashboard /></ProtectedRoute>} />
    <Route path="/instructor/courses/new" element={<ProtectedRoute allowedRoles={['INSTRUCTOR']}><InstructorCourseCreate /></ProtectedRoute>} />
    <Route path="/instructor/courses/:courseId" element={<ProtectedRoute allowedRoles={['INSTRUCTOR']}><InstructorCourseDetail /></ProtectedRoute>} />
    <Route path="/instructor/courses/:courseId/edit" element={<ProtectedRoute allowedRoles={['INSTRUCTOR']}><InstructorCourseCreate /></ProtectedRoute>} />
    <Route path="/instructor/students" element={<ProtectedRoute allowedRoles={['INSTRUCTOR']}><InstructorStudents /></ProtectedRoute>} />
    <Route path="/instructor/earnings" element={<ProtectedRoute allowedRoles={['INSTRUCTOR']}><InstructorEarnings /></ProtectedRoute>} />
    <Route path="/instructor/payouts" element={<ProtectedRoute allowedRoles={['INSTRUCTOR']}><InstructorPayouts /></ProtectedRoute>} />
    <Route path="/instructor/settings" element={<ProtectedRoute allowedRoles={['INSTRUCTOR']}><InstructorSettings /></ProtectedRoute>} />
    <Route path="/instructor/*" element={<ProtectedRoute allowedRoles={['INSTRUCTOR']}><InstructorDashboard /></ProtectedRoute>} />

    {/* Admin routes */}
    <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
    <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminUsers /></ProtectedRoute>} />
    <Route path="/admin/approvals" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminApprovals /></ProtectedRoute>} />
    <Route path="/admin/instructor-verifications" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminInstructorVerifications /></ProtectedRoute>} />
    <Route path="/admin/categories" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminCategories /></ProtectedRoute>} />
    <Route path="/admin/coupons" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminCoupons /></ProtectedRoute>} />
    <Route path="/admin/payments" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminPayments /></ProtectedRoute>} />
    <Route path="/admin/audit-logs" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminAuditLogs /></ProtectedRoute>} />
    <Route path="/admin/email-logs" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminEmailLogs /></ProtectedRoute>} />
    <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminSettings /></ProtectedRoute>} />
    <Route path="/admin/*" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />

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
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
