/**
 * MathAR Kids - Service Worker
 * Cache app shell for offline support
 */

const CACHE = 'mathAR-v1';

// Assets to cache immediately
const ASSETS = [
    '/',
    '/index.html',
    '/state.js',
    '/ar-engine.js'
];

// Cache external CDN
const EXTERNAL = [
    'https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js',
    'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap'
];

// Install event - cache assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE).then(cache => {
            return cache.addAll(ASSETS);
        })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            // Cache hit - return response
            if (response) {
                return response;
            }

            // Clone the request
            const fetchRequest = event.request.clone();

            return fetch(fetchRequest).then(response => {
                // Check if valid response
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                // Clone the response
                const responseToCache = response.clone();

                // Cache the new response
                caches.open(CACHE).then(cache => {
                    cache.put(event.request, responseToCache);
                });

                return response;
            });
        })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
