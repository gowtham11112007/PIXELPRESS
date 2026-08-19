---
name: enforce-code-quality
description: Use this skill to run code quality checks (linting) using oxlint before completing major tasks, as specified in GEMINI.md.
---
# Enforce Code Quality

Whenever a coding task is completed (especially if multiple files were modified or new features were added), you MUST run the linting process to ensure code quality aligns with the PIXELPRESS standards.

## Instructions

1. **Identify the Scope**: Determine if the changes were made in the `CUSTOMER` app, the `SELLER` app, or both.
2. **Run Linter**: 
   - Navigate into the respective directory.
   - Run `npm run lint` (which triggers `oxlint` as per the project guidelines).
3. **Resolve Errors**: If the linter reports any errors or warnings, fix them automatically or manually before informing the user that the task is complete.
4. **Final Verification**: Ensure the changes don't break the build (run `npm run build` if significant structural changes were made).
