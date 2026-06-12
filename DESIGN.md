# Fyredocs Design System

Single reference for tokens, components, and usage rules. Tokens live in
`src/index.css` (CSS variables) and are mapped in `tailwind.config.ts`.

## Color

**Never use raw Tailwind palette classes** (`text-green-600`, `bg-red-500/10`, …).
Use semantic tokens:

| Intent | Classes |
|---|---|
| Brand / primary action | `bg-primary text-primary-foreground hover:bg-primary-hover`, ramp via `brand-50…950` |
| Success | `text-success`, `bg-success-subtle text-success-subtle-foreground` |
| Warning | `text-warning`, `bg-warning-subtle text-warning-subtle-foreground` |
| Error | `text-destructive`, `bg-destructive-subtle text-destructive-subtle-foreground` |
| Info | `text-info`, `bg-info-subtle text-info-subtle-foreground` |
| Tool categories | `text-category-{organize\|optimize\|convert-to\|convert-from\|libreoffice\|edit\|security}` + `bg-category-*-subtle` (via `NAV_GROUPS[].styles` in `src/config/navigation.ts`) |
| Charts | `hsl(var(--chart-1…6))`, `--chart-success/warning/danger` — never literal hsl/hex in Recharts props |

Solid status fills (`bg-success`) are for emphasis only; default to subtle fills for badges/chips.
All `*` / `*-subtle-foreground` pairs pass WCAG AA (4.5:1) in both modes — verified; keep it that way when tuning.

**Guardrail** (run before merging UI work):

```sh
grep -rEn "text-(red|green|yellow|orange|blue|purple|teal|cyan|amber|emerald|rose|pink|violet|indigo|sky|lime)-[0-9]" src --include='*.tsx' --include='*.ts'
```

Allowlist: `src/components/ui/toast.tsx` (stock shadcn destructive close button).

## Typography

Use `<Heading>` / `<Text>` from `src/components/ui/typography.tsx`:

- `Heading level="display|h1|h2|h3|h4"` — `responsive` prop steps down one level below `md:`.
- `Text variant="body-lg|body|body-sm|caption|overline"` with `tone="default|muted|subtle"`.
- Raw utilities (`text-h2`, `text-body-sm`) exist for edge cases inside compact components.
- Don't hand-roll `text-4xl font-bold` headings.

## Spacing & layout standards

- Page sections: `py-12` / `py-16`. Card padding: `p-6` (compact: `p-4`).
- Stack gaps: `gap-2 / 4 / 6 / 8`; inline gaps: `gap-1.5 / 2 / 3`.
- Forms: `space-y-2` within a field, `space-y-6` between sections.
- Dialogs: use the `size` prop on `DialogContent` (`sm | md | lg | 2xl`) — no ad-hoc `max-w-*`.
- Radius: cards/dialogs `rounded-xl`, marketing tiles `rounded-2xl`, inputs/buttons `rounded-md`.
- Shadows: `shadow-xs/sm/md/lg`; `shadow-brand` only on the primary CTA.

## Motion

- Durations: `duration-fast` (120ms) / `duration-base` (200ms) / `duration-slow` (320ms); easing `ease-out-expo`.
- No universal transitions — add `transition-colors` (etc.) per component.
- Framer Motion is wrapped in `<MotionConfig reducedMotion="user">`; CSS honors `prefers-reduced-motion`.

## Buttons

- `default` = brand solid + `shadow-brand`. `gradient` exists for hero CTAs only.
- Don't bolt `bg-gradient-primary` onto Button via className — use `variant="gradient"`.
- Sizes: `xs | sm | default | lg | xl | icon`.

## Feedback components (`src/components/common/`)

- `StatusBadge` — job/upload states (`queued|processing|completed|failed|expired`). Don't hand-roll status pills.
- `EmptyState` / `ErrorState` (with `onRetry`) / `LoadingState` (`Spinner`, `PageLoading`, `CardSkeleton`, `TableSkeleton`).
- `PageHeader` — title/description/actions/breadcrumb for every top-level page.
- `ConfirmDialog` — destructive confirmations; async-aware.
- Toasts via `src/lib/toast.ts` (success 3.5s, error 6s). Async outcomes only — inline validation never toasts.

## Command palette

`CommandPaletteProvider` is mounted in `Layout`; ⌘K / `/` opens it. Tool entries derive from
`src/config/tools.ts` (`keywords` field feeds search). New pages/tools should be reachable from it.

## Focus & a11y

- Focus style: `focus-visible:ring-2 ring-ring ring-offset-2 ring-offset-background`.
- Icon-only buttons need `aria-label`. Decorative icons get `aria-hidden`.
- New color pairs must pass 4.5:1 in light and dark.
