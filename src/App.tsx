import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/auth/authContext";
import { ProtectedRoute, PublicOnlyRoute } from "@/auth/authGuard";
import Index from "./pages/Index";
import MergePage from "./pages/MergePage";
import SplitPage from "./pages/SplitPage";
import CompressPage from "./pages/CompressPage";
import ConvertPage from "./pages/ConvertPage";
import PdfToWordPage from "./pages/PdfToWordPage";
import WordToPdfPage from "./pages/WordToPdfPage";
import PdfToExcelPage from "./pages/PdfToExcelPage";
import ExcelToPdfPage from "./pages/ExcelToPdfPage";
import PdfToImagePage from "./pages/PdfToImagePage";
import ImageToPdfPage from "./pages/ImageToPdfPage";
import OcrPage from "./pages/OcrPage";
import WatermarkPage from "./pages/WatermarkPage";
import ProtectPage from "./pages/ProtectPage";
import RotatePage from "./pages/RotatePage";
import ReorderPage from "./pages/ReorderPage";
import AboutPage from "./pages/AboutPage";
import BlogPage from "./pages/BlogPage";
import PricingPage from "./pages/PricingPage";
import ContactPage from "./pages/ContactPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import CookiePage from "./pages/CookiePage";
import NotFound from "./pages/NotFound";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
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
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
