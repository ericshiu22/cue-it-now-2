import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import SplashScreen from "@/components/SplashScreen";
import Index from "./pages/Index";
import MyQueue from "./pages/MyQueue";
import Friends from "./pages/Friends";
import ShowDetail from "./pages/ShowDetail";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import SubscriptionHub from "./pages/SubscriptionHub";
import LiveSports from "./pages/LiveSports";
import EmailPreview from "./pages/EmailPreview";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AnimatePresence>
            {showSplash && (
              <SplashScreen onComplete={() => setShowSplash(false)} />
            )}
          </AnimatePresence>
          {!showSplash && (
            <BrowserRouter>
              <Navbar />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/queue" element={<MyQueue />} />
                <Route path="/friends" element={<Friends />} />
                <Route path="/show/:type/:id" element={<ShowDetail />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/live-sports" element={<LiveSports />} />
                <Route path="/subscriptions" element={<SubscriptionHub />} />
                <Route path="/email-preview" element={<EmailPreview />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          )}
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
