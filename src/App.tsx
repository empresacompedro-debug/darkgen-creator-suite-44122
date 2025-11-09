import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Layout } from "./components/Layout";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import CanaisSimilares from "./pages/CanaisSimilares";
import AnaliseCanais from "./pages/AnaliseCanais";
import NicheFinder from "./pages/NicheFinder";
import Brainstorm from "./pages/Brainstorm";
import CriadorConteudo from "./pages/CriadorConteudo";
import TitulosVirais from "./pages/TitulosVirais";
import TradutorRoteiros from "./pages/TradutorRoteiros";
import MonitoramentoConcorrentes from "./pages/MonitoramentoConcorrentes";
import PromptsParaCenas from "./pages/PromptsParaCenas";
import PromptsThumbnail from "./pages/PromptsThumbnail";
import GeradorImagens from "./pages/GeradorImagens";
import OtimizadorVideo from "./pages/OtimizadorVideo";
import OtimizadorDescricao from "./pages/OtimizadorDescricao";
import GuiaEdicao from "./pages/GuiaEdicao";
import ConversorSRT from "./pages/ConversorSRT";
import DivisorTexto from "./pages/DivisorTexto";
import SubNicheHunter from "./pages/SubNicheHunter";
import TitleAnalysis from "./pages/TitleAnalysis";
import Configuracoes from "./pages/Configuracoes";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import AdminPanel from "./pages/AdminPanel";
import AuditLogs from "./pages/AuditLogs";
import PaymentSettings from "./pages/PaymentSettings";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
            <Layout>
              <Routes>
                <Route path="/" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/canais-similares" element={
                  <ProtectedRoute>
                    <CanaisSimilares />
                  </ProtectedRoute>
                } />
                <Route path="/analise-canais" element={
                  <ProtectedRoute>
                    <AnaliseCanais />
                  </ProtectedRoute>
                } />
                <Route path="/niche-finder" element={
                  <ProtectedRoute>
                    <NicheFinder />
                  </ProtectedRoute>
                } />
                <Route path="/monitoramento-concorrentes" element={
                  <ProtectedRoute>
                    <MonitoramentoConcorrentes />
                  </ProtectedRoute>
                } />
                <Route path="/brainstorm" element={
                  <ProtectedRoute>
                    <Brainstorm />
                  </ProtectedRoute>
                } />
                <Route path="/criador-conteudo" element={
                  <ProtectedRoute>
                    <CriadorConteudo />
                  </ProtectedRoute>
                } />
                <Route path="/titulos-virais" element={
                  <ProtectedRoute>
                    <TitulosVirais />
                  </ProtectedRoute>
                } />
                <Route path="/tradutor-roteiros" element={
                  <ProtectedRoute>
                    <TradutorRoteiros />
                  </ProtectedRoute>
                } />
                <Route path="/prompts-cenas" element={
                  <ProtectedRoute>
                    <PromptsParaCenas />
                  </ProtectedRoute>
                } />
                <Route path="/prompts-thumbnail" element={
                  <ProtectedRoute>
                    <PromptsThumbnail />
                  </ProtectedRoute>
                } />
                <Route path="/gerador-imagens" element={
                  <ProtectedRoute>
                    <GeradorImagens />
                  </ProtectedRoute>
                } />
                <Route path="/otimizador-video" element={
                  <ProtectedRoute>
                    <OtimizadorVideo />
                  </ProtectedRoute>
                } />
                <Route path="/otimizador-descricao" element={
                  <ProtectedRoute>
                    <OtimizadorDescricao />
                  </ProtectedRoute>
                } />
                <Route path="/guia-edicao" element={
                  <ProtectedRoute>
                    <GuiaEdicao />
                  </ProtectedRoute>
                } />
                <Route path="/conversor-srt" element={
                  <ProtectedRoute>
                    <ConversorSRT />
                  </ProtectedRoute>
                } />
                <Route path="/divisor-texto" element={
                  <ProtectedRoute>
                    <DivisorTexto />
                  </ProtectedRoute>
                } />
                <Route path="/sub-niche-hunter" element={
                  <ProtectedRoute>
                    <SubNicheHunter />
                  </ProtectedRoute>
                } />
                <Route path="/title-analysis" element={
                  <ProtectedRoute>
                    <TitleAnalysis />
                  </ProtectedRoute>
                } />
                <Route path="/configuracoes" element={
                  <ProtectedRoute>
                    <Configuracoes />
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute>
                    <AdminPanel />
                  </ProtectedRoute>
                } />
                <Route path="/admin/pagamentos" element={
                  <ProtectedRoute>
                    <PaymentSettings />
                  </ProtectedRoute>
                } />
                <Route path="/admin/audit-logs" element={
                  <ProtectedRoute>
                    <AuditLogs />
                  </ProtectedRoute>
                } />
                <Route path="/auth" element={<Auth />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
