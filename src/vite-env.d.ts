/// <reference types="vite/client" />

// Allow CSS module imports
declare module '*.css' {
  const styles: Record<string, string>;
  export default styles;
}

// Allow image imports
declare module '*.svg' { const src: string; export default src; }
declare module '*.png' { const src: string; export default src; }
declare module '*.jpg' { const src: string; export default src; }
declare module '*.webp' { const src: string; export default src; }
