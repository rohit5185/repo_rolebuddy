import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import path from "path";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  reloadOnOnline: true,
  // Disable service worker in development to prevent stale-cache issues
  disable: process.env.NODE_ENV === "development",
  // Custom worker extends the generated SW with push event handlers
  customWorkerSrc: "worker",
  // Custom offline fallback page
  fallbacks: {
    document: "/offline"
  },
  workboxOptions: {
    // Don't cache backend API calls (always network-first for live data)
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts",
          expiration: {
            maxEntries: 4,
            maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
          }
        }
      },
      {
        // Auth pages - NetworkFirst so login always has fresh state
        urlPattern: /^https?:\/\/[^/]+\/(?:login|signup|auth).*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "auth-pages",
          networkTimeoutSeconds: 8,
          expiration: {
            maxEntries: 5,
            maxAgeSeconds: 60 * 60 // 1 hour
          }
        }
      },
      {
        // App pages — NetworkFirst with offline fallback
        urlPattern: /^https?:\/\/[^/]+\/(?:dashboard|chat|discovery|profile|onboarding).*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "app-pages",
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 30,
            maxAgeSeconds: 24 * 60 * 60 // 24 hours
          }
        }
      },
      {
        // Static Next.js assets — cache forever (they're content-hashed)
        urlPattern: /^\/_next\/static\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "next-static",
          expiration: {
            maxEntries: 250,
            maxAgeSeconds: 365 * 24 * 60 * 60
          }
        }
      },
      {
        // Next.js image optimization
        urlPattern: /^\/_next\/image\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "next-images",
          expiration: {
            maxEntries: 60,
            maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
          }
        }
      },
      {
        // PWA icons & manifest
        urlPattern: /^\/(?:icons|logo\.png|manifest\.json|apple-touch-icon\.png|favicon.*)/i,
        handler: "CacheFirst",
        options: {
          cacheName: "pwa-assets",
          expiration: {
            maxEntries: 30,
            maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
          }
        }
      }
    ]
  }
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  // Prevent Next.js from scanning the monorepo root for lockfiles
  outputFileTracingRoot: path.join(__dirname),
};

export default withPWA(nextConfig);
