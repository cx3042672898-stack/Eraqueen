// EraQueenA+ Service Worker
// 策略：网络优先（保证 GitHub 更新后自动同步），离线时回退缓存
const CACHE_NAME = 'eraqueen-v1';

// 安装时跳过等待，立即激活
self.addEventListener('install', function(e) {
  self.skipWaiting();
});

// 激活时清理旧缓存
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys
          .filter(function(k) { return k !== CACHE_NAME; })
          .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// 请求拦截：网络优先，失败时用缓存
self.addEventListener('fetch', function(e) {
  // 只处理 GET 请求；跳过 API 调用（Anthropic API 等）
  if (e.request.method !== 'GET') return;
  var url = e.request.url;
  if (url.includes('anthropic.com') || url.includes('api.')) return;

  e.respondWith(
    fetch(e.request)
      .then(function(response) {
        // 请求成功：更新缓存并返回
        if (response && response.status === 200) {
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, copy);
          });
        }
        return response;
      })
      .catch(function() {
        // 网络失败：从缓存读取
        return caches.match(e.request);
      })
  );
});
