import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import AuthPage from "@/pages/auth-page";
import CadastroPage from "@/pages/cadastro";
import VSLPage from "@/pages/vsl";
import AdminLogin from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin/dashboard";
import Dashboard from "@/pages/dashboard";
import PacientesPage from "@/pages/dashboard/pacientes";
import ConsultaPage from "@/pages/dashboard/consulta";
import PrescricoesPage from "@/pages/dashboard/prescricoes";
import MemedOficialPage from "@/pages/dashboard/memed-oficial";
import LogsPage from "@/pages/dashboard/logs";
import PlanosPage from "@/pages/dashboard/planos";
import SuccessPage from "@/pages/dashboard/success";
import PerfilPage from "@/pages/dashboard/perfil";
import PrivacyPolicyPage from "@/pages/privacy-policy";
import TermsOfServicePage from "@/pages/terms-of-service";
import EmailVerificationPage from "@/pages/dashboard/verificacao";
import VerifyEmailPage from "@/pages/verify-email";
import HistoryPage from "@/pages/history";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";
import { useScrollToTop } from "@/hooks/useScrollToTop";

function Router() {
  // Hook para resetar o scroll para o topo sempre que a rota mudar
  useScrollToTop();
  
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/vsl" component={VSLPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/cadastro" component={CadastroPage} />
      <Route path="/privacy-policy" component={PrivacyPolicyPage} />
      <Route path="/terms-of-service" component={TermsOfServicePage} />
      <Route path="/verify-email" component={VerifyEmailPage} />
      
      {/* Nova rota de histórico com suporte a parâmetro de sessão */}
      <Route path="/history">
        {() => (
          <ProtectedRoute>
            <HistoryPage />
          </ProtectedRoute>
        )}
      </Route>
      
      {/* Rotas de administrador */}
      <Route path="/admin" component={AdminLogin} />
      <Route path="/admin/dashboard">
        {() => (
          <AdminProtectedRoute>
            <AdminDashboard />
          </AdminProtectedRoute>
        )}
      </Route>
      
      {/* Redirecionar /dashboard para /dashboard/consulta */}
      <Route path="/dashboard">
        {() => {
          window.location.href = '/dashboard/consulta';
          return null;
        }}
      </Route>
      
      {/* Rota de verificação de email */}
      <Route path="/dashboard/verificacao">
        {() => (
          <ProtectedRoute>
            <EmailVerificationPage />
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/dashboard/pacientes">
        {() => (
          <ProtectedRoute>
            <PacientesPage />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/dashboard/consulta">
        {() => (
          <ProtectedRoute>
            <ConsultaPage />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/dashboard/prescricoes">
        {() => (
          <ProtectedRoute>
            <MemedOficialPage />
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/dashboard/logs">
        {() => (
          <ProtectedRoute>
            <LogsPage />
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/dashboard/planos">
        {() => (
          <ProtectedRoute>
            <PlanosPage />
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/dashboard/success/:prodId">
        {() => (
          <ProtectedRoute>
            <SuccessPage />
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/dashboard/perfil">
        {() => (
          <ProtectedRoute>
            <PerfilPage />
          </ProtectedRoute>
        )}
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <ThemeProvider>
            <Toaster />
            <Router />
          </ThemeProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
