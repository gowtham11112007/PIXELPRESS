---
name: manage-dev-servers
description: >-
  Use this skill when the user asks to start, stop, or manage the local development servers for the CUSTOMER or SELLER applications.
---

# Manage Dev Servers

This project contains two distinct Vite frontend applications: `CUSTOMER` and `SELLER`.

## Starting the Servers

To start the dev servers for both applications simultaneously, run the following command from the project root:

```bash
# Start CUSTOMER in the background
cd CUSTOMER && npm run dev &
# Start SELLER in the background
cd ../SELLER && npm run dev &
```
*(Alternatively, you can start them in separate terminal sessions if requested.)*

## Verifying

Wait a few seconds for Vite to output the local URLs (usually `http://localhost:5173` and `http://localhost:5174`).
Ensure there are no build or syntax errors in the terminal output.

## Installing Dependencies

If the servers fail to start due to missing dependencies, you may need to run `npm install` in the respective directories:

```bash
cd CUSTOMER && npm install
cd ../SELLER && npm install
```
