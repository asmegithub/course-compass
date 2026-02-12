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
import InstructorDashboard from "./pages/dashboard/InstructorDashboard";
import InstructorCourseCreate from "./pages/dashboard/InstructorCourseCreate";
import InstructorCourseDetail from "./pages/dashboard/InstructorCourseDetail";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
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
    <Route path="/dashboard/*" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentDashboard /></ProtectedRoute>} />

    {/* Instructor routes */}
    <Route path="/instructor" element={<ProtectedRoute allowedRoles={['INSTRUCTOR']}><InstructorDashboard /></ProtectedRoute>} />
    <Route path="/instructor/courses/new" element={<ProtectedRoute allowedRoles={['INSTRUCTOR']}><InstructorCourseCreate /></ProtectedRoute>} />
    <Route path="/instructor/courses/:courseId" element={<ProtectedRoute allowedRoles={['INSTRUCTOR']}><InstructorCourseDetail /></ProtectedRoute>} />
    <Route path="/instructor/courses/:courseId/edit" element={<ProtectedRoute allowedRoles={['INSTRUCTOR']}><InstructorCourseCreate /></ProtectedRoute>} />
    <Route path="/instructor/*" element={<ProtectedRoute allowedRoles={['INSTRUCTOR']}><InstructorDashboard /></ProtectedRoute>} />

    {/* Admin routes */}
    <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
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
