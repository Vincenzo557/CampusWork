// ============================================================
// src/main.jsx
// ============================================================
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import AppRoutes from './routes/AppRoutes'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)

// ============================================================
// index.html  (place in project root)
// ============================================================
/*
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CampusWork</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
*/

// ============================================================
// src/index.css  (place in src/)
// ============================================================
/*
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

body {
  font-family: 'Inter', system-ui, sans-serif;
  background-color: #F9F9F8;
  color: #1A1A18;
}

@layer components {
  .btn-primary   { @apply bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed; }
  .btn-secondary { @apply bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors; }
  .btn-success   { @apply bg-success-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-success-700/90 transition-colors; }
  .btn-danger    { @apply bg-danger-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-danger-700/90 transition-colors; }
  .input         { @apply w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 bg-white; }
  .label         { @apply block text-sm text-gray-500 mb-1.5; }
  .card          { @apply bg-white border border-gray-100 rounded-xl p-5; }
  .badge-pending  { @apply text-xs px-2 py-1 rounded-full bg-warning-50 text-warning-700; }
  .badge-accepted { @apply text-xs px-2 py-1 rounded-full bg-green-100 text-green-700; }
  .badge-rejected { @apply text-xs px-2 py-1 rounded-full bg-danger-50 text-danger-700; }
  .badge-open     { @apply text-xs px-2 py-1 rounded-full bg-brand-50 text-brand-500; }
  .badge-closed   { @apply text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500; }
  .badge-conflict { @apply text-xs px-2 py-1 rounded-full bg-warning-50 text-warning-700; }
  .badge-clear    { @apply text-xs px-2 py-1 rounded-full bg-success-50 text-success-700; }
}
*/

// ============================================================
// postcss.config.js  (place in project root)
// ============================================================
/*
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
*/
