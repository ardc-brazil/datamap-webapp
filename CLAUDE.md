# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DataMap Webapp is a Next.js frontend for a SaaS platform for atmospheric big data and data science research. It communicates with a Python FastAPI backend (Gatekeeper) via an RPC-style architecture.

## Common Commands

```bash
# Development
npm install                     # Install dependencies
npm run dev                     # Development server (http://localhost:3000)
npm run build                   # Production build
npm run start                   # Production server

# Testing
npm run test                    # Run tests once
npm run testing                 # Run tests in watch mode
npm run test:coverage           # Run tests and open coverage report

# Docker
docker build -t datamap-webapp .
docker run -p 3000:3000 datamap-webapp
```

## Architecture

### RPC Communication Pattern

The frontend uses a dual approach for backend communication:

1. **Data Mutations** (create, update, delete):
   - Components call `BFFAPI` gateway methods (`gateways/BFFAPI.ts`)
   - BFF routes (`pages/api/*`) proxy requests to Gatekeeper backend
   - Uses Axios with `lib/rpc.ts` for backend calls

2. **Data Fetching** (read operations):
   - Components use SWR hooks directly with `lib/fetcher.js`
   - Fetcher includes tenancy header automatically
   - Provides caching, real-time updates, and retry logic

### Multi-Tenancy

Tenancy is header-based and managed via Zustand store (`components/TenancyStore.tsx`):
- `X-Datamap-Tenancy` header sent with all requests
- Tenancy format: `{root}/{environment}/{namespace}`
- Persisted in cookies

### Key Directories

- `pages/` - Next.js pages and API routes (BFF layer)
- `pages/api/` - Backend-for-Frontend API routes that proxy to Gatekeeper
- `components/` - React components organized by feature
- `gateways/` - API gateway classes (BFFAPI)
- `lib/` - Shared utilities (rpc, fetcher, auth, dataset operations)
- `hooks/` - Custom React hooks
- `types/` - TypeScript type definitions
- `contants/` - Application constants (organized as `{Category}Constants.ts`)

### Main Routes

- `/app/home` - Dashboard
- `/app/datasets` - Dataset list
- `/app/datasets/[datasetId]` - Dataset details
- `/app/datasets/[datasetId]/versions/[versionName]` - Version details
- `/app/datasets/new` - Create dataset
- `/account/login` - Login page
- `/design-system` - TailwindCSS component showcase

## Technology Stack

- **Framework**: Next.js 14, React 18, TypeScript 5.6
- **State Management**: Zustand (global state), SWR (data fetching)
- **Forms**: Formik with Yup validation
- **Styling**: TailwindCSS 3
- **Authentication**: NextAuth (GitHub, ORCID, Credentials providers)
- **File Upload**: Uppy with TUS protocol
- **Icons**: Material Symbols via react-material-symbols (outlined, weight 200, grade -25)
- **UI Components**: Radix UI (accordion, dialog, scroll-area)

## Environment Setup

Copy `.env.local.template` to `.env.local` and configure:
- `DATAMAP_BASE_URL` - Gatekeeper backend URL
- `DATAMAP_API_KEY` / `DATAMAP_API_SECRET` - API credentials
- `TOKEN_SECRET`, `NEXTAUTH_SECRET` - Auth secrets
- `NEXT_PUBLIC_TUS_SERVICE_ENDPOINT` - File upload endpoint
- OAuth credentials for GitHub and ORCID

## Development Guidelines

- Use Formik for all forms
- Organize constants in `{Category}Constants.ts` files
- Use SWR for data fetching (provides caching and real-time updates)
- Use BFFAPI gateway for data mutations
- Design system reference available at `/design-system/`
