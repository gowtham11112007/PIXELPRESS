---
name: scaffold-route
description: Use this skill when the user asks to create a new page, route, or screen in either the CUSTOMER or SELLER application.
---
# Scaffold Route

This skill ensures that new pages/routes are created consistently using the project's tech stack (React Router DOM v7, Tailwind CSS, Framer Motion).

## Instructions

1. **Determine the Application**: Identify whether the route belongs in the `CUSTOMER` or `SELLER` directory.
2. **Create the Component**: 
   - Navigate to the appropriate `src/pages/` or `src/routes/` folder.
   - Create a functional React component.
   - Use `framer-motion` for basic page-load animations (e.g., a simple fade-in) if it enhances the UX.
3. **Styling**: Use Tailwind CSS for all styling. If merging classes is needed, utilize `clsx` and `twMerge` (typically combined as `cn`).
4. **Update the Router**: Add the new component to the main router configuration file (e.g., `App.jsx`, `main.jsx`, or a dedicated router file).
5. **Verify**: Ensure the route is accessible and the UI renders without errors.
