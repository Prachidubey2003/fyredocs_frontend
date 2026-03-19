import { lazy, Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/auth/authContext";
import { ThemeProvider } from "next-themes";
import { ProtectedRoute, PublicOnlyRoute } from "@/auth/authGuard";
import { PageSkeleton } from "@/components/common/PageSkeleton";

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
const AboutPage = lazy(() => import("./pages/AboutPage"));
const BlogPage = lazy(() => import("./pages/BlogPage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const CookiePage = lazy(() => import("./pages/CookiePage"));
const AllToolsPage = lazy(() => import("./pages/AllToolsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const SignIn = lazy(() => import("./pages/auth/SignIn"));
const SignUp = lazy(() => import("./pages/auth/SignUp"));

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<PageSkeleton />}>
              <Routes>
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
                </Route>
                <Route path="/all-tools" element={<AllToolsPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/cookies" element={<CookiePage />} />
                <Route element={<PublicOnlyRoute />}>
                  <Route path="/signin" element={<SignIn />} />
                  <Route path="/signup" element={<SignUp />} />
                </Route>
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
  </HelmetProvider>
);

export default App;
