import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
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
import SettingsPage from "@/pages/SettingsPage";
import EditorialPlanning from "@/pages/EditorialPlanning";
import PerformanceDashboard from "@/pages/PerformanceDashboard";
import EmailDistribution from "@/pages/EmailDistribution";
import CommentResponse from "@/pages/CommentResponse";
import StrategicIdeas from "@/pages/StrategicIdeas";
import UnsubscribePage from "@/pages/UnsubscribePage";
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
        <Route path="/strategy" element={<StrategicIdeas />} />
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
        <Route path="/comments" element={<CommentResponse />} />
        <Route path="/settings" element={<SettingsPage />} />
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
          <Route path="/unsubscribe" element={<UnsubscribePage />} />
          <Route path="*" element={<AuthenticatedApp />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
