---
name: generate-component
description: >-
  Use this skill to standardize the creation of new React components, ensuring they are placed in the right directory, use the correct imports, and follow project structure.
---

# Generate Component Workflow

When tasked with creating a new UI component for either the `CUSTOMER` or `SELLER` applications, follow this standardized workflow to ensure consistency.

## 1. Determine Context and Location
- Ask the user (if not specified) whether the component belongs to `CUSTOMER`, `SELLER`, or both (if they share a UI library, though currently they are separate).
- The standard path for new components is `src/components/ui/` for generic components (buttons, inputs) or `src/components/` for feature-specific components.

## 2. Component Scaffolding
Create the component using functional React patterns. Always import `clsx` and `tailwind-merge` if the component accepts custom class names.

### Example Template (`MyComponent.jsx`):
```jsx
import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';

// Utility for merging tailwind classes safely
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function MyComponent({ className, children, ...props }) {
  return (
    <motion.div 
      className={cn("base-mobile-classes md:desktop-classes", className)}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
```

## 3. Post-Creation
- Export the new component from a centralized `index.js` (if one exists in the `components` folder).
- Run the linter using `npm run lint` within the app's directory (e.g., `cd CUSTOMER && npm run lint`) to ensure the new code adheres to oxlint standards.
- If the component is complex, suggest creating a quick usage example in the respective app's main view or a sandbox route.
