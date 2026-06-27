// Renance CBT Service Worker
const CACHE_NAME = 'renancecbt-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/login.html',
  '/dashboard.html',
  '/leaderboard.html',
  '/pdf.html',
  '/live-quizzes.html',
  '/create-quiz.html',
  '/admin.html',
  '/logo.png',
  '/manifest.json',
  '/env-loader.js',
  '/cbt-ai-bridge.js',
];

// Install — cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch — network first, fall back to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip Supabase API calls — always use network
  if (event.request.url.includes('supabase.co') || 
      event.request.url.includes('api.groq.com') ||
      event.request.url.includes('generativelanguage')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and cache successful responses
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone).catch(() => {});
          });
        }
        return response;
      })
      .catch(() => {
        // Fall back to cache
        return caches.match(event.request).then((cached) => {
          return cached || caches.match('/');
        });
      })
  );
});
