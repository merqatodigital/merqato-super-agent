/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional MERQATO FastAPI base URL, e.g. http://localhost:8000 */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.png" {
  const src: string;
  export default src;
}

declare module "*.jpg" {
  const src: string;
  export default src;
}
