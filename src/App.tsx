import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import AppLayout from "@/components/AppLayout";
import LoginPage from "@/pages/LoginPage";
import Dashboard from "@/pages/Dashboard";
import BrandIntelligence from "@/pages/BrandIntelligence";
import ContentStudio from "@/pages/ContentStudio";
import BlogWorkflow from "@/pages/BlogWorkflow";
import Analytics from "@/pages/Analytics";
import CalendarView from "@/pages/CalendarView";
import ContentLibrary from "@/pages/ContentLibrary";
import CampaignWizard from "@/pages/CampaignWizard";
import CampaignDetail from "@/pages/CampaignDetail";
import Campaigns from "@/pages/Campaigns";
import SettingsPage from "@/pages/SettingsPage";
import EditorialPlanning from "@/pages/EditorialPlanning";
import PerformanceDashboard from "@/pages/PerformanceDashboard";
import EmailDistribution from "@/pages/EmailDistribution";
import CommentResponse from "@/pages/CommentResponse";
import StrategicIdeas from "@/pages/StrategicIdeas";

import NotFound from "./pages/NotFound.tsx";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function AuthenticatedApp() {
  const auth = useAuth();

  if (auth.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!auth.user) {
    return <LoginPage onSignIn={auth.signIn} onSignUp={auth.signUp} />;
  }

  return (
    <AppLayout user={auth.user} profile={auth.profile} roles={auth.roles} onSignOut={auth.signOut} isAdmin={auth.isAdmin} isEditor={auth.isEditor}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/ideas" element={<StrategicIdeas />} />
        <Route path="/studio" element={<ContentStudio />} />
        <Route path="/editorial" element={<EditorialPlanning />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<SettingsPage />} />
        {/* Redirects for merged/removed pages */}
        <Route path="/performance" element={<Navigate to="/analytics" replace />} />
        <Route path="/strategy" element={<Navigate to="/ideas" replace />} />
        <Route path="/calendar" element={<Navigate to="/editorial" replace />} />
        {/* Pages still accessible via direct URL */}
        <Route path="/brand" element={<BrandIntelligence />} />
        <Route path="/blog" element={<BlogWorkflow />} />
        <Route path="/content" element={<ContentLibrary />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/campaigns/new" element={<CampaignWizard />} />
        <Route path="/campaigns/:id" element={<CampaignDetail />} />
        <Route path="/email" element={<EmailDistribution />} />
        <Route path="/comments" element={<CommentResponse />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<AuthenticatedApp />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
