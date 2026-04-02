# COOLEX Unified Selector

## Project Overview

HVAC equipment selection platform for COOLEX (by RIC). Engineers and dealers use it to:
1. Select HVAC equipment through a 7-step guided wizard
2. Manage projects with units, revisions, and submittals
3. Generate PDF submittal documents
4. Admin: manage users and pricing

**Current state**: Phase 1 complete — fully functional frontend with mock data. No real backend, database, or authentication yet.

**Demo credentials** (any password works):
- `admin@coolex.com` — admin role (sees /admin routes, pricing in options)
- `engineer@coolex.com` — engineer role
- `dealer@coolex.com` — dealer role (pricing hidden)

## Tech Stack

- **Next.js 16.1.6** (App Router, Turbopack) with **React 19.2.3**
- **TypeScript 5** (strict mode)
- **Tailwind CSS v4** — CSS-first config via `@tailwindcss/postcss` plugin, NOT v3
- **shadcn/ui** — Radix primitives in `components/ui/`, configured via `components.json`
- **Zustand 5** — global state (5 stores, persisted to localStorage)
- **TanStack Query v5** — data fetching/caching layer
- **React Hook Form 7 + Zod 4** — form state and validation
- **Framer Motion 12** — animations
- **@react-pdf/renderer 4** — client-side PDF generation
- **Lucide React** — icons

## Commands

```bash
npm run dev      # Start dev server (Turbopack) → http://localhost:3000
npm run build    # Production build
npm run start    # Serve production build
npm run lint     # ESLint (Next.js core-web-vitals + TypeScript)
```

No test framework is set up yet. No `.env` files needed — all data is mocked.

## Architecture

```
coolex-unified/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (fonts, metadata, Providers)
│   ├── page.tsx                  # Root redirect
│   ├── providers.tsx             # QueryClient + TooltipProvider (client)
│   ├── globals.css               # Tailwind v4 theme, CSS vars, brand colors
│   ├── (auth)/                   # Unauthenticated routes
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (app)/                    # Authenticated app shell (Sidebar + TopBar)
│   │   ├── layout.tsx            # Auth guard, sidebar layout
│   │   ├── dashboard/page.tsx
│   │   ├── projects/page.tsx
│   │   ├── projects/[id]/page.tsx
│   │   └── select/page.tsx       # 7-step selection wizard
│   ├── (admin)/                  # Admin-only (RoleGuard)
│   │   ├── layout.tsx
│   │   └── admin/{users,pricing}/page.tsx
│   └── api/mock/                 # Mock API endpoints (GET only)
│       ├── product-groups/route.ts
│       ├── product-series/route.ts
│       ├── results/route.ts
│       ├── options/route.ts
│       ├── projects/route.ts
│       └── users/route.ts
├── components/
│   ├── ui/                       # shadcn/ui primitives (button, dialog, table, etc.)
│   ├── layout/                   # Sidebar, TopBar, RoleGuard, CommandPalette
│   ├── auth/                     # LoginForm, RegisterForm
│   ├── dashboard/                # StatsCards, RecentProjectsList
│   ├── selection/                # 7-step wizard components
│   │   ├── SelectionStepper.tsx  # Step indicator + navigation
│   │   ├── ProjectInfoForm.tsx   # Step 1
│   │   ├── ProductGroupGrid.tsx  # Step 2
│   │   ├── SeriesGrid.tsx        # Step 3
│   │   ├── DesignConditionsForm.tsx # Step 4
│   │   ├── ResultsTable.tsx      # Step 5
│   │   ├── OptionsConfigurator.tsx # Step 6
│   │   └── SubmittalPreview.tsx  # Step 7
│   ├── projects/                 # ProjectListTable, RevisionHistoryPanel, SelectionSheet*
│   ├── submittal/                # SubmittalPDF, CombinedSubmittalPDF (@react-pdf)
│   └── admin/                    # PriceListManager, UserManagementTable
├── lib/
│   ├── stores/                   # Zustand stores
│   │   ├── auth-store.ts         # Login/logout, user state
│   │   ├── selection-store.ts    # 7-step wizard state machine
│   │   ├── projects-store.ts     # Projects CRUD, units, revisions
│   │   ├── ui-store.ts           # Sidebar state, theme
│   │   └── unit-store.ts         # Imperial/metric toggle
│   ├── mock-data/                # Hardcoded product + user data
│   │   ├── product-groups.ts     # 8 product groups
│   │   ├── product-series.ts     # 16 series
│   │   ├── models.ts             # Router: seriesId → model array
│   │   ├── ngw-models.ts         # NGW fan coil units (10 models)
│   │   ├── acsc-models.ts        # ACSC air-cooled screw chillers (34 models)
│   │   ├── {chcc,ngcc,pngc,pngf}-models.ts  # Other product model files
│   │   ├── options.ts            # Equipment options/accessories
│   │   ├── projects.ts           # Sample projects
│   │   ├── users.ts              # Mock user accounts
│   │   └── countries.ts          # Country list
│   ├── nomenclature.ts           # Model number decoder engine
│   ├── utils.ts                  # cn() — clsx + tailwind-merge
│   └── utils/
│       ├── capacity.ts           # Capacity calculation helpers
│       ├── pdf.ts                # PDF generation utilities
│       └── unit-conversions.ts   # Imperial ↔ metric conversions
├── hooks/                        # React Query hooks
│   ├── useProjects.ts
│   ├── useSelection.ts           # useModels, useOptions, useProductGroups, etc.
│   └── useUsers.ts
├── types/                        # TypeScript type definitions
│   ├── product.ts                # ProductGroup, ProductSeries, Model
│   ├── project.ts                # Project, Unit, Revision
│   ├── selection.ts              # SelectionBasis, DesignConditionsFormData
│   ├── submittal.ts              # SubmittalSnapshot
│   └── user.ts                   # User, UserRole
├── proxy.ts                      # Next.js middleware (auth cookie check)
├── next.config.ts                # Turbopack enabled
├── postcss.config.mjs            # @tailwindcss/postcss
├── components.json               # shadcn/ui config
└── public/                       # Logo, brand assets, images
```

## Coding Conventions

### Naming
- **Files**: `kebab-case.tsx` for utilities; `PascalCase.tsx` for components
- **Components**: PascalCase — `LoginForm`, `SelectionStepper`, `ProjectListTable`
- **Types/interfaces**: PascalCase — `User`, `ProjectStatus`, `DesignConditionsFormData`
- **Functions/variables**: camelCase — `handleSubmit`, `isAuthenticated`
- **Constants**: UPPER_SNAKE_CASE — `MOCK_ACCOUNTS`, `NAV_ITEMS`, `STEPS`
- **Zustand stores**: `use{Feature}Store` — `useAuthStore`, `useSelectionStore`
- **Hooks**: `use{Feature}` — `useProjects`, `useModels`, `useOptions`

### Exports
- **Named exports** for components, stores, utilities, types
- **Default exports** only for route pages (`page.tsx`)
- Path alias: `@/*` maps to project root

### Component Structure
- Almost all components are client components (`"use client"` at top)
- Only `app/layout.tsx` is a server component (for metadata + fonts)
- Zod schemas defined inline in the component that uses them
- Props typed with `interface` (not `type`)

### Styling
- **Tailwind v4** — theme defined in `app/globals.css` via `@theme inline {}` block
- **No `tailwind.config.ts`** — all config is CSS-first
- `cn()` utility (`lib/utils.ts`) for conditional class merging
- `class-variance-authority` for component variants (buttons, badges)
- Brand colors: `--color-coolex-blue: #0057B8`, `--color-coolex-navy: #0A1628`, `--color-coolex-accent: #00A3E0`
- Custom utilities: `.cx-card`, `.cx-stat-number`
- Dark mode: `.dark` class on html, overrides CSS variables

## Key Patterns

### State Management (Zustand)
```typescript
export const useMyStore = create<MyState>()(
  devtools(
    persist(
      (set) => ({ /* state + actions */ }),
      { name: 'coolex-{feature}' }  // localStorage key
    ),
    { name: 'MyStore' }  // DevTools label
  )
);
```
All 5 stores follow this exact pattern: `create` → `devtools` → `persist`.

### Data Fetching (TanStack Query)
```typescript
export function useModels(seriesId: string | null, capacity: number | null) {
  return useQuery<Model[]>({
    queryKey: ['models', seriesId, capacity],
    queryFn: async () => { /* fetch from /api/mock/* */ },
    enabled: !!seriesId && !!capacity,
  });
}
```
Hooks in `hooks/` wrap `useQuery` calls to mock API routes in `app/api/mock/`.

### Forms (React Hook Form + Zod)
```typescript
const schema = z.object({ /* ... */ });
type FormData = z.infer<typeof schema>;

const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
  resolver: zodResolver(schema),
});
```

### PDF Generation
`@react-pdf/renderer` components in `components/submittal/`. Always dynamically imported with `await import(...)` to avoid SSR issues.

### Auth Flow
- Login: `useAuthStore.login()` → sets `isAuthenticated` + `user` in Zustand (persisted to localStorage)
- Route protection: client-side `useEffect` guard in `(app)/layout.tsx` + `RoleGuard` component
- Server-side: `proxy.ts` checks `coolex-auth` cookie for admin routes only

## Gotchas

1. **Tailwind v4, not v3** — No `tailwind.config.ts`. Theme is in `globals.css` `@theme` block. Don't create a tailwind config file.
2. **Next.js 16 middleware** — The file is `proxy.ts` with exported function `proxy`, not the standard `middleware.ts`/`middleware` pattern.
3. **`z.coerce.number()` + `zodResolver`** — Causes type mismatch. Workaround: `resolver: zodResolver(schema) as any`.
4. **All data is mock** — Stores mutate in-memory arrays. Changes are lost on page refresh (except Zustand-persisted state).
5. **No `.env` files** — Nothing is configured via environment variables yet.
6. **No test suite** — No testing framework is configured.
7. **Zustand persistence** — State survives page refreshes via localStorage. Clear storage if you see stale state during development.
8. **`turbopack: {}`** — Required in `next.config.ts` to suppress Turbopack warnings in Next.js 16.

## Product Data

Real product data extracted from Excel files in `/Users/mac/Documents/Coolex Unified/data/`:
- **NGW Fan Coil Units** (10 models): NGW-026 through NGW-100, D3/D4 coil rows
- **ACSC Air-Cooled Screw Chillers** (34 models): ACSC080 through ACSC500
- **Other series**: CHCC, NGCC, PNGC, PNGF (in respective `lib/mock-data/*-models.ts`)

Product hierarchy: **Group** → **Series** → **Model** (defined in `types/product.ts`)

## Future Plans (Phase 2+)

See PRD: `/Users/mac/Documents/Coolex Unified/COOLEX_Unified_Selector_PRD_v1.0.docx`
- Real backend API (replacing mock routes)
- PostgreSQL database
- Authentication (NextAuth)
- Actual HVAC calculation engine
- Real pricing data
