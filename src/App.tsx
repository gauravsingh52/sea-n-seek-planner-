import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TripProvider } from "@/contexts/TripContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Itinerary from "./pages/Itinerary";
import SavedTrips from "./pages/SavedTrips";
import SharedTrip from "./pages/SharedTrip";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function RouteScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <TripProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <RouteScrollToTop />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<ProtectedRoute requireAuth={false}><Login /></ProtectedRoute>} />
              <Route path="/signup" element={<ProtectedRoute requireAuth={false}><Signup /></ProtectedRoute>} />
              <Route path="/itinerary" element={<ProtectedRoute><Itinerary /></ProtectedRoute>} />
              <Route path="/saved" element={<ProtectedRoute><SavedTrips /></ProtectedRoute>} />
              <Route path="/trip/:shareCode" element={<SharedTrip />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TripProvider>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
