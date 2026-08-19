---
description: Standards for git commits, branching, and PR descriptions to maintain a clean workflow.
---

# Git Workflow & Commit Standards

To maintain a clean and readable history across the PIXELPRESS monorepo, follow these git guidelines when committing changes or managing branches.

## 1. Commit Message Format
Use Conventional Commits. The format is: `<type>(<scope>): <subject>`

**Types:**
- `feat`: A new feature
- `fix`: A bug fix
- `ui`: Styling or layout changes
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `chore`: Updating build tasks, package manager configs, etc.

**Scopes:**
Use the app name (`customer` or `seller`) or `global` if the change affects both.

**Examples:**
- `feat(customer): add shopping cart slide-over`
- `ui(seller): update dashboard layout for mobile`
- `fix(global): resolve tailwind merge conflicts`

## 2. Pre-Commit Checklist
Before finalizing a commit, ensure the following:
- You have run `npm run lint` in the respective directory (`CUSTOMER` or `SELLER`).
- No console.logs or debugging artifacts are left in the code.
- The UI has been tested for mobile responsiveness if styling was altered.
