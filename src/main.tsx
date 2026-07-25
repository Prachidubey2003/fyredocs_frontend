import { createRoot } from "react-dom/client";
// Inter is self-hosted rather than loaded from fonts.googleapis.com: the edge
// CSP is same-origin (style-src/font-src 'self'), so the Google Fonts link
// silently failed and the app fell back to a system font. Bundling it also
// drops two cross-origin round trips from first paint.
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
