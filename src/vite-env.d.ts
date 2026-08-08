/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the mongo-service Express backend, e.g. "http://localhost:4000". Replaces VITE_GOOGLE_SCRIPT_URL. */
  readonly VITE_API_URL: string
  readonly VITE_WEBAPP_SECRET: string
  /** No longer used for data (kept only so the Admin Dashboard's "Open Google Sheet" link degrades gracefully to disabled if unset). */
  readonly VITE_GOOGLE_SHEETS_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}