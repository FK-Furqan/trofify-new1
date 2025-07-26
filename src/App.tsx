import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DarkModeProvider } from "@/components/DarkModeProvider";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <DarkModeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/home" element={<Index />} />
            <Route path="/feed" element={<Index />} />
            <Route path="/messages" element={<Index />} />
            <Route path="/profile" element={<Index />} />
            <Route path="/network" element={<Index />} />
            <Route path="/events" element={<Index />} />
            <Route path="/competitions" element={<Index />} />
            <Route path="/venues" element={<Index />} />
            <Route path="/saved" element={<Index />} />
            <Route path="/settings" element={<Index />} />
            <Route path="/search" element={<Index />} />
            <Route path="/reels" element={<Index />} />
            <Route path="/notifications" element={<Index />} />
            {/* Catch-all route - redirect to home instead of showing 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </DarkModeProvider>
);

export default App;
