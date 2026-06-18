import { lazy } from "react";
import { HelmetProvider } from "react-helmet-async";
import { MotionConfig } from "framer-motion";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/auth/authContext";
import { ThemeProvider } from "next-themes";
import { ProtectedRoute, PublicOnlyRoute, RoleRoute } from "@/auth/authGuard";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { Layout } from "@/components/layout/Layout";
import { DocsLayout } from "@/components/layout/DocsLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { UserLayout } from "@/components/layout/UserLayout";
import { getAllTools } from "@/config/tools";

const Index = lazy(() => import("./pages/Index"));
// Single generic tool page — every registry tool routes through it.
const ToolPage = lazy(() => import("./pages/ToolPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const BlogPage = lazy(() => import("./pages/BlogPage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const CookiePage = lazy(() => import("./pages/CookiePage"));
const AllToolsPage = lazy(() => import("./pages/AllToolsPage"));
const DocsIndexPage = lazy(() => import("./pages/docs/DocsIndexPage"));
const DocsPage = lazy(() => import("./pages/docs/DocsPage"));
const DevDocsIndexPage = lazy(() => import("./pages/docs/DevDocsIndexPage"));
const DevDocsPage = lazy(() => import("./pages/docs/DevDocsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const MyFilesPage = lazy(() => import("./pages/MyFilesPage"));
const UserDashboard = lazy(() => import("./pages/app/Dashboard"));
const DocumentsPage = lazy(() => import("./pages/app/DocumentsPage"));
const TrashPage = lazy(() => import("./pages/app/TrashPage"));
const MembersPage = lazy(() => import("./pages/app/MembersPage"));
const ExportsPage = lazy(() => import("./pages/app/ExportsPage"));
const SignIn = lazy(() => import("./pages/auth/SignIn"));
const SignUp = lazy(() => import("./pages/auth/SignUp"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const BusinessPage = lazy(() => import("./pages/admin/BusinessPage"));
const GrowthPage = lazy(() => import("./pages/admin/GrowthPage"));
const EngagementPage = lazy(() => import("./pages/admin/EngagementPage"));
const ReliabilityPage = lazy(() => import("./pages/admin/ReliabilityPage"));
const SystemPage = lazy(() => import("./pages/admin/SystemPage"));
const ServerPerformancePage = lazy(() => import("./pages/admin/ServerPerformancePage"));
const ApiPerformancePage = lazy(() => import("./pages/admin/ApiPerformancePage"));

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
  <MotionConfig reducedMotion="user">
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ErrorBoundary>
              <Routes>
                  <Route element={<Layout />}>
                    <Route path="/" element={<Index />} />
                    <Route path="/all-tools" element={<AllToolsPage />} />
                    <Route path="/tools" element={<AllToolsPage />} />
                    {/* Tool routes are public — backend supports anonymous (guest) usage. */}
                    {getAllTools().map((tool) => (
                      <Route
                        key={tool.id}
                        path={tool.route}
                        element={<ToolPage toolId={tool.id} />}
                      />
                    ))}
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/blog" element={<BlogPage />} />
                    <Route path="/pricing" element={<PricingPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/privacy" element={<PrivacyPage />} />
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/cookies" element={<CookiePage />} />
                    <Route element={<ProtectedRoute />}>
                      <Route path="/my-files" element={<MyFilesPage />} />
                    </Route>
                    <Route element={<PublicOnlyRoute />}>
                      <Route path="/signin" element={<SignIn />} />
                      <Route path="/signup" element={<SignUp />} />
                    </Route>
                    <Route element={<DocsLayout />}>
                      <Route path="/docs" element={<DocsIndexPage />} />
                      <Route path="/docs/:slug" element={<DocsPage />} />
                      <Route element={<RoleRoute allowedRoles={['super-admin']} />}>
                        <Route path="/dev-docs" element={<DevDocsIndexPage />} />
                        <Route path="/dev-docs/:slug" element={<DevDocsPage />} />
                      </Route>
                    </Route>
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Route>
                  {/* Authenticated user workspace — its own shell, outside the marketing layout. */}
                  <Route element={<ProtectedRoute />}>
                    <Route element={<UserLayout />}>
                      <Route path="/app" element={<UserDashboard />} />
                      <Route path="/app/documents" element={<DocumentsPage />} />
                      <Route path="/app/trash" element={<TrashPage />} />
                      <Route path="/app/members" element={<MembersPage />} />
                      <Route path="/app/exports" element={<ExportsPage />} />
                    </Route>
                  </Route>
                  {/* Admin lives in its own shell (sidebar + top bar), outside the marketing layout. */}
                  <Route element={<RoleRoute allowedRoles={['super-admin']} />}>
                    <Route element={<AdminLayout />}>
                      <Route path="/admin/dashboard" element={<AdminDashboard />} />
                      <Route path="/admin/business" element={<BusinessPage />} />
                      <Route path="/admin/growth" element={<GrowthPage />} />
                      <Route path="/admin/engagement" element={<EngagementPage />} />
                      <Route path="/admin/reliability" element={<ReliabilityPage />} />
                      <Route path="/admin/system" element={<SystemPage />} />
                      <Route path="/admin/server-performance" element={<ServerPerformancePage />} />
                      <Route path="/admin/api-performance" element={<ApiPerformancePage />} />
                    </Route>
                  </Route>
              </Routes>
            </ErrorBoundary>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
  </MotionConfig>
  </HelmetProvider>
);

export default App;
