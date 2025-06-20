import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import PinjamAlat from "./pages/PinjamAlat";
import NotFound from "./pages/NotFound";
import StudentAuth from "./pages/StudentAuth";
import StudentRegister from "./pages/StudentRegister";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherAuth from "./pages/TeacherAuth";
import TeacherRegister from "./pages/TeacherRegister";
import TeacherDashboard from "./pages/TeacherDashboard";
import PendingAccount from "./pages/PendingAccount";
import RejectedAccount from "./pages/RejectedAccount";
import PinjamAlatPage from "./pages/PinjamAlatPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          
          {/* Admin Routes */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin" element={<AdminDashboard />} />
          
          {/* Student Routes */}
          <Route path="/student-auth" element={<StudentAuth />} />
          <Route path="/student-register" element={<StudentRegister />} />
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          
          {/* Teacher Routes */}
          <Route path="/teacher-auth" element={<TeacherAuth />} />
          <Route path="/teacher-register" element={<TeacherRegister />} />
          <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
          
          {/* Shared Routes */}
          <Route path="/pending-account" element={<PendingAccount />} />
          <Route path="/rejected-account" element={<RejectedAccount />} />
          <Route path="/pinjam-alat" element={<PinjamAlatPage />} />
          
          {/* Legacy Routes for Compatibility */}
          <Route path="/register" element={<StudentRegister />} />
          <Route path="/dashboard" element={<StudentDashboard />} />
          <Route path="/pinjam" element={<PinjamAlatPage />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
