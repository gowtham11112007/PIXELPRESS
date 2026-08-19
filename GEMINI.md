---
description: Global rules and guidelines for the PIXELPRESS project (React, Vite, Tailwind, Supabase).
---

# PIXELPRESS Project Guidelines

## Tech Stack
- **Frontend Framework**: React 19
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + `clsx` and `tailwind-merge` for class merging.
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Routing**: React Router DOM (v7)
- **Backend/BaaS**: Supabase

## Coding Standards
1. **Functional Components**: Use functional components with React Hooks.
2. **Tailwind Best Practices**: 
   - Group related Tailwind classes together.
   - Use `clsx` and `twMerge` (typically combined into a `cn` utility) when dynamically constructing class names or passing `className` props.
3. **Supabase**: 
   - Keep Supabase client initialization in a central utility file.
   - Use environment variables for Supabase URL and Anon Key (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
4. **Project Structure**:
   - The repository contains two separate frontend applications: `CUSTOMER` and `SELLER`.
   - When modifying code, ensure you are in the correct directory depending on whether you are working on the customer-facing or seller-facing app.
5. **Linting**:
   - The project uses `oxlint`. Make sure to run `npm run lint` before completing tasks to ensure code quality.

## Component Structure
- Prefer small, reusable components.
- Use `framer-motion` for smooth UI transitions where appropriate, but avoid over-animating basic elements.
