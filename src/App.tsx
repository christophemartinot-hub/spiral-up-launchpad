import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import BrandIntelligence from "@/pages/BrandIntelligence";
import ContentStudio from "@/pages/ContentStudio";
import BlogWorkflow from "@/pages/BlogWorkflow";
import Analytics from "@/pages/Analytics";
import CalendarView from "@/pages/CalendarView";
import ContentLibrary from "@/pages/ContentLibrary";
import CampaignWizard from "@/pages/CampaignWizard";
import CampaignDetail from "@/pages/CampaignDetail";
import SettingsPage from "@/pages/SettingsPage";
import EditorialPlanning from "@/pages/EditorialPlanning";
import PerformanceDashboard from "@/pages/PerformanceDashboard";
import EmailDistribution from "@/pages/EmailDistribution";
import CommentResponse from "@/pages/CommentResponse";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/brand" element={<BrandIntelligence />} />
            <Route path="/studio" element={<ContentStudio />} />
            <Route path="/blog" element={<BlogWorkflow />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/content" element={<ContentLibrary />} />
            <Route path="/campaigns/new" element={<CampaignWizard />} />
            <Route path="/campaigns/:id" element={<CampaignDetail />} />
            <Route path="/editorial" element={<EditorialPlanning />} />
            <Route path="/performance" element={<PerformanceDashboard />} />
            <Route path="/email" element={<EmailDistribution />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
