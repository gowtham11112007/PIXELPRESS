---
name: supabase-workflow
description: >-
  Use this skill when the user asks to integrate, mock, or work with the Supabase database/backend in the project.
---

# Supabase Workflow

This skill outlines how to interact with Supabase within the PIXELPRESS project.

## 1. Supabase Client Setup

Always ensure that a Supabase client is properly instantiated. Check for a file like `src/lib/supabase.js` or `src/utils/supabase.js`. If it doesn't exist, you can create it:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

## 2. Environment Variables

Make sure the `.env` files in `CUSTOMER` and `SELLER` contain the necessary keys:
`VITE_SUPABASE_URL`
`VITE_SUPABASE_ANON_KEY`

If they are missing and you are testing locally without real keys, advise the user to fill them in, or use a mocked backend approach for UI development.

## 3. Data Fetching

When fetching data, use standard Supabase JS methods. For example:

```javascript
const { data, error } = await supabase
  .from('your_table')
  .select('*')
```

Handle `error` appropriately in the UI (e.g., displaying an error state or a toast notification).
