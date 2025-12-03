import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/components/admin/AuthProvider";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import NotFound from "./pages/NotFound";
import PowerAdminLogin from "./pages/PowerAdminLogin";
import Dashboard from "./pages/admin/Dashboard";
import Ventas from "./pages/admin/Ventas";
import Compras from "./pages/admin/Compras";
import Stock from "./pages/admin/Stock";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Power Admin Routes */}
            <Route path="/" element={<PowerAdminLogin />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/ventas" element={<Ventas />} />
                <Route path="/compras" element={<Compras />} />
                <Route path="/stock" element={<Stock />} />
              </Route>
            </Route>
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
