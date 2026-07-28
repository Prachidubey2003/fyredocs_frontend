// Tailwind theme. This file MAPS tokens; it does not define them.
//
// The single source of truth for colour values is the CSS custom properties in
// src/index.css — every colour here reads a var(), which is what makes light/dark
// switching work without duplicating the palette. Changing a colour means editing
// index.css, not this file.
//
// DESIGN.md is the binding contract for how these tokens may be used: raw
// Tailwind palette classes (bg-blue-500 and the like) are prohibited, chart
// colours must come from src/components/admin/chartTheme.ts rather than literal
// hsl/hex values, and a new colour pair must clear 4.5:1 contrast in both modes.
// DESIGN.md ships a grep command to check the first of those before merging.
//
// Note the legacy tool colours below are aliased to category tokens as part of a
// migration that is still IN PROGRESS — they are not a second palette to add to.
import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        display: ["3.5rem", { lineHeight: "1.1", letterSpacing: "-0.025em", fontWeight: "700" }],
        h1: ["2.25rem", { lineHeight: "1.15", letterSpacing: "-0.02em", fontWeight: "700" }],
        h2: ["1.75rem", { lineHeight: "1.2", letterSpacing: "-0.015em", fontWeight: "600" }],
        h3: ["1.375rem", { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "600" }],
        h4: ["1.125rem", { lineHeight: "1.4", fontWeight: "600" }],
        "body-lg": ["1.125rem", { lineHeight: "1.6" }],
        body: ["0.9375rem", { lineHeight: "1.6" }],
        "body-sm": ["0.875rem", { lineHeight: "1.5" }],
        caption: ["0.75rem", { lineHeight: "1.4" }],
        overline: ["0.6875rem", { lineHeight: "1.3", letterSpacing: "0.08em", fontWeight: "600" }],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        brand: {
          50: "hsl(var(--brand-50))",
          100: "hsl(var(--brand-100))",
          200: "hsl(var(--brand-200))",
          300: "hsl(var(--brand-300))",
          400: "hsl(var(--brand-400))",
          500: "hsl(var(--brand-500))",
          600: "hsl(var(--brand-600))",
          700: "hsl(var(--brand-700))",
          800: "hsl(var(--brand-800))",
          900: "hsl(var(--brand-900))",
          950: "hsl(var(--brand-950))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
          subtle: "hsl(var(--destructive-subtle))",
          "subtle-foreground": "hsl(var(--destructive-subtle-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
          subtle: "hsl(var(--success-subtle))",
          "subtle-foreground": "hsl(var(--success-subtle-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
          subtle: "hsl(var(--warning-subtle))",
          "subtle-foreground": "hsl(var(--warning-subtle-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
          subtle: "hsl(var(--info-subtle))",
          "subtle-foreground": "hsl(var(--info-subtle-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        category: {
          organize: "hsl(var(--cat-organize))",
          "organize-subtle": "hsl(var(--cat-organize-subtle))",
          optimize: "hsl(var(--cat-optimize))",
          "optimize-subtle": "hsl(var(--cat-optimize-subtle))",
          "convert-to": "hsl(var(--cat-convert-to))",
          "convert-to-subtle": "hsl(var(--cat-convert-to-subtle))",
          "convert-from": "hsl(var(--cat-convert-from))",
          "convert-from-subtle": "hsl(var(--cat-convert-from-subtle))",
          libreoffice: "hsl(var(--cat-libreoffice))",
          "libreoffice-subtle": "hsl(var(--cat-libreoffice-subtle))",
          edit: "hsl(var(--cat-edit))",
          "edit-subtle": "hsl(var(--cat-edit-subtle))",
          security: "hsl(var(--cat-security))",
          "security-subtle": "hsl(var(--cat-security-subtle))",
        },
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
          6: "hsl(var(--chart-6))",
          success: "hsl(var(--chart-success))",
          warning: "hsl(var(--chart-warning))",
          danger: "hsl(var(--chart-danger))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Docs panel colors
        docs: {
          panel: "hsl(var(--docs-panel))",
          "panel-foreground": "hsl(var(--docs-panel-foreground))",
          "panel-muted": "hsl(var(--docs-panel-muted))",
          "panel-border": "hsl(var(--docs-panel-border))",
        },
        // Legacy tool colors (aliased to category tokens during migration)
        tool: {
          merge: "hsl(var(--tool-merge))",
          "merge-light": "hsl(var(--tool-merge-light))",
          split: "hsl(var(--tool-split))",
          "split-light": "hsl(var(--tool-split-light))",
          compress: "hsl(var(--tool-compress))",
          "compress-light": "hsl(var(--tool-compress-light))",
          convert: "hsl(var(--tool-convert))",
          "convert-light": "hsl(var(--tool-convert-light))",
          organize: "hsl(var(--tool-organize))",
          "organize-light": "hsl(var(--tool-organize-light))",
          security: "hsl(var(--tool-security))",
          "security-light": "hsl(var(--tool-security-light))",
          ocr: "hsl(var(--tool-ocr))",
          "ocr-light": "hsl(var(--tool-ocr-light))",
          watermark: "hsl(var(--tool-watermark))",
          "watermark-light": "hsl(var(--tool-watermark-light))",
          edit: "hsl(var(--tool-edit))",
          "edit-light": "hsl(var(--tool-edit-light))",
        },
        // State colors
        upload: {
          idle: "hsl(var(--upload-idle))",
          active: "hsl(var(--upload-active))",
          success: "hsl(var(--upload-success))",
          error: "hsl(var(--upload-error))",
        },
        job: {
          queued: "hsl(var(--job-queued))",
          processing: "hsl(var(--job-processing))",
          completed: "hsl(var(--job-completed))",
          failed: "hsl(var(--job-failed))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        brand: "var(--shadow-brand)",
        tool: "var(--shadow-tool)",
      },
      transitionDuration: {
        fast: "var(--duration-fast)",
        base: "var(--duration-base)",
        slow: "var(--duration-slow)",
      },
      transitionTimingFunction: {
        "out-expo": "var(--ease-out)",
        "in-out-quart": "var(--ease-in-out)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
