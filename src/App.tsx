import { lazy, Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/auth/authContext";
import { ThemeProvider } from "next-themes";
import { ProtectedRoute, PublicOnlyRoute, RoleRoute } from "@/auth/authGuard";
import { PageSkeleton } from "@/components/common/PageSkeleton";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { AnimatePresence, motion } from "framer-motion";

const Index = lazy(() => import("./pages/Index"));
const MergePage = lazy(() => import("./pages/MergePage"));
const SplitPage = lazy(() => import("./pages/SplitPage"));
const CompressPage = lazy(() => import("./pages/CompressPage"));
const ConvertPage = lazy(() => import("./pages/ConvertPage"));
const PdfToWordPage = lazy(() => import("./pages/PdfToWordPage"));
const WordToPdfPage = lazy(() => import("./pages/WordToPdfPage"));
const PdfToExcelPage = lazy(() => import("./pages/PdfToExcelPage"));
const ExcelToPdfPage = lazy(() => import("./pages/ExcelToPdfPage"));
const PdfToImagePage = lazy(() => import("./pages/PdfToImagePage"));
const ImageToPdfPage = lazy(() => import("./pages/ImageToPdfPage"));
const OcrPage = lazy(() => import("./pages/OcrPage"));
const WatermarkPage = lazy(() => import("./pages/WatermarkPage"));
const ProtectPage = lazy(() => import("./pages/ProtectPage"));
const RotatePage = lazy(() => import("./pages/RotatePage"));
const ReorderPage = lazy(() => import("./pages/ReorderPage"));
const RemovePagesPage = lazy(() => import("./pages/RemovePagesPage"));
const ExtractPagesPage = lazy(() => import("./pages/ExtractPagesPage"));
const ScanToPdfPage = lazy(() => import("./pages/ScanToPdfPage"));
const PdfToPptPage = lazy(() => import("./pages/PdfToPptPage"));
const PdfToHtmlPage = lazy(() => import("./pages/PdfToHtmlPage"));
const PdfToPdfaPage = lazy(() => import("./pages/PdfToPdfaPage"));
const PowerpointToPdfPage = lazy(() => import("./pages/PowerpointToPdfPage"));
const HtmlToPdfPage = lazy(() => import("./pages/HtmlToPdfPage"));
const RepairPdfPage = lazy(() => import("./pages/RepairPdfPage"));
const PdfToTextPage = lazy(() => import("./pages/PdfToTextPage"));
const UnlockPage = lazy(() => import("./pages/UnlockPage"));
const AddPageNumbersPage = lazy(() => import("./pages/AddPageNumbersPage"));
const SignPdfPage = lazy(() => import("./pages/SignPdfPage"));
const EditPdfPage = lazy(() => import("./pages/EditPdfPage"));
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

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        <Routes location={location}>
          <Route path="/" element={<Index />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/merge" element={<MergePage />} />
            <Route path="/split" element={<SplitPage />} />
            <Route path="/compress" element={<CompressPage />} />
            <Route path="/convert" element={<ConvertPage />} />
            <Route path="/pdf-to-word" element={<PdfToWordPage />} />
            <Route path="/word-to-pdf" element={<WordToPdfPage />} />
            <Route path="/pdf-to-excel" element={<PdfToExcelPage />} />
            <Route path="/excel-to-pdf" element={<ExcelToPdfPage />} />
            <Route path="/pdf-to-image" element={<PdfToImagePage />} />
            <Route path="/image-to-pdf" element={<ImageToPdfPage />} />
            <Route path="/ocr" element={<OcrPage />} />
            <Route path="/watermark" element={<WatermarkPage />} />
            <Route path="/protect" element={<ProtectPage />} />
            <Route path="/rotate" element={<RotatePage />} />
            <Route path="/reorder" element={<ReorderPage />} />
            <Route path="/remove-pages" element={<RemovePagesPage />} />
            <Route path="/extract-pages" element={<ExtractPagesPage />} />
            <Route path="/scan-to-pdf" element={<ScanToPdfPage />} />
            <Route path="/pdf-to-ppt" element={<PdfToPptPage />} />
            <Route path="/pdf-to-html" element={<PdfToHtmlPage />} />
            <Route path="/pdf-to-pdfa" element={<PdfToPdfaPage />} />
            <Route path="/powerpoint-to-pdf" element={<PowerpointToPdfPage />} />
            <Route path="/html-to-pdf" element={<HtmlToPdfPage />} />
            <Route path="/repair-pdf" element={<RepairPdfPage />} />
            <Route path="/pdf-to-text" element={<PdfToTextPage />} />
            <Route path="/unlock" element={<UnlockPage />} />
            <Route path="/add-page-numbers" element={<AddPageNumbersPage />} />
            <Route path="/sign-pdf" element={<SignPdfPage />} />
            <Route path="/edit-pdf" element={<EditPdfPage />} />
          </Route>
          <Route path="/all-tools" element={<AllToolsPage />} />
          <Route path="/docs" element={<DocsIndexPage />} />
          <Route path="/docs/:slug" element={<DocsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/cookies" element={<CookiePage />} />
          <Route element={<RoleRoute allowedRoles={['super-admin']} />}>
            <Route path="/dev-docs" element={<DevDocsIndexPage />} />
            <Route path="/dev-docs/:slug" element={<DevDocsPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/business" element={<BusinessPage />} />
            <Route path="/admin/growth" element={<GrowthPage />} />
            <Route path="/admin/engagement" element={<EngagementPage />} />
            <Route path="/admin/reliability" element={<ReliabilityPage />} />
            <Route path="/admin/system" element={<SystemPage />} />
            <Route path="/admin/server-performance" element={<ServerPerformancePage />} />
            <Route path="/admin/api-performance" element={<ApiPerformancePage />} />
          </Route>
          <Route element={<PublicOnlyRoute />}>
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

const App = () => (
  <HelmetProvider>
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ErrorBoundary>
              <Suspense fallback={<PageSkeleton />}>
                <AnimatedRoutes />
              </Suspense>
            </ErrorBoundary>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
  </HelmetProvider>
);

export default App;
