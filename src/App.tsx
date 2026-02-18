import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Index from "./pages/Index";
import MyQueue from "./pages/MyQueue";
import LinkUp from "./pages/LinkUp";
import Friends from "./pages/Friends";
import ShowDetail from "./pages/ShowDetail";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import EmailPreview from "./pages/EmailPreview";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/queue" element={<MyQueue />} />
            <Route path="/linkup" element={<LinkUp />} />
            <Route path="/friends" element={<Friends />} />
            <Route path="/show/:type/:id" element={<ShowDetail />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/email-preview" element={<EmailPreview />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
