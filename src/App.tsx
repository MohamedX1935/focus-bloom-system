import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import Index from "./pages/Index";
import Habitudes from "./pages/Habitudes";
import Priere from "./pages/Priere";
import Sport from "./pages/Sport";
import Productivite from "./pages/Productivite";
import Finances from "./pages/Finances";
import Sommeil from "./pages/Sommeil";
import Ecran from "./pages/Ecran";
import Objectifs from "./pages/Objectifs";
import Statistiques from "./pages/Statistiques";
import Parametres from "./pages/Parametres";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/habitudes" element={<Habitudes />} />
        <Route path="/priere" element={<Priere />} />
        <Route path="/sport" element={<Sport />} />
        <Route path="/productivite" element={<Productivite />} />
        <Route path="/finances" element={<Finances />} />
        <Route path="/sommeil" element={<Sommeil />} />
        <Route path="/ecran" element={<Ecran />} />
        <Route path="/objectifs" element={<Objectifs />} />
        <Route path="/statistiques" element={<Statistiques />} />
        <Route path="/parametres" element={<Parametres />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

function AuthRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <Auth />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthRoute />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
