/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_SCRIPT_URL: string
  readonly VITE_WEBAPP_SECRET: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
