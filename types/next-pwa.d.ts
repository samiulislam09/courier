declare module 'next-pwa' {
  import { NextConfig } from 'next';
  
  interface PWAConfig {
    dest?: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
    sw?: string;
    scope?: string;
    runtimeCaching?: unknown[];
    publicExcludes?: string[];
    buildExcludes?: (string | RegExp)[];
    cacheOnFrontEndNav?: boolean;
    fallbacks?: {
      image?: string;
      document?: string;
      font?: string;
      audio?: string;
      video?: string;
    };
    cacheStartUrl?: boolean;
    dynamicStartUrl?: boolean;
    dynamicStartUrlRedirect?: string;
    reloadOnOnline?: boolean;
    customWorkerDir?: string;
    customWorkerSrc?: string;
    customWorkerDest?: string;
    customWorkerPrefix?: string;
  }

  export default function withPWA(config?: PWAConfig): (nextConfig: NextConfig) => NextConfig;
}
