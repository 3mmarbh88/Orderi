/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-afac4cd2'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "whatsapp-icon.svg",
    "revision": "4ca02982c5c5ba80ba2e270aaf7bac48"
  }, {
    "url": "whatsapp-icon.png",
    "revision": "6e5e284767528c9a19ca29d79f8400b4"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "9112bc95f87c38a862cc5dae489b2f40"
  }, {
    "url": "pwa-512x512.png",
    "revision": "6e126d7b95c4257c90e1eb065e614c13"
  }, {
    "url": "pwa-192x192.png",
    "revision": "45b4b2c6aef9ea5b6c439ee460fdc689"
  }, {
    "url": "logo.png",
    "revision": "2d2ca880c4d25ab5da3696e279a0fc66"
  }, {
    "url": "index.html",
    "revision": "eed1a30fe5cb92a248fb5ac73615fb2d"
  }, {
    "url": "icon.svg",
    "revision": "69cc41d936e8cbd5c824f13ce16e753b"
  }, {
    "url": "favicon.ico",
    "revision": "94c2c3276b0c28b3b283caf6b91864f9"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "423816b9939d8c910bfae0ae37facd49"
  }, {
    "url": "assets/workbox-window.prod.es5-BBnX5xw4.js",
    "revision": null
  }, {
    "url": "assets/web-DMAcjRDW.js",
    "revision": null
  }, {
    "url": "assets/web-DDlTrX-R.js",
    "revision": null
  }, {
    "url": "assets/web-Bi34p9tW.js",
    "revision": null
  }, {
    "url": "assets/index-CxT5d2EQ.js",
    "revision": null
  }, {
    "url": "assets/index-ClP9eBXF.css",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "423816b9939d8c910bfae0ae37facd49"
  }, {
    "url": "favicon.ico",
    "revision": "94c2c3276b0c28b3b283caf6b91864f9"
  }, {
    "url": "icon.svg",
    "revision": "69cc41d936e8cbd5c824f13ce16e753b"
  }, {
    "url": "pwa-192x192.png",
    "revision": "45b4b2c6aef9ea5b6c439ee460fdc689"
  }, {
    "url": "pwa-512x512.png",
    "revision": "6e126d7b95c4257c90e1eb065e614c13"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "9112bc95f87c38a862cc5dae489b2f40"
  }, {
    "url": "manifest.webmanifest",
    "revision": "573ab9e22bca4643056f281af763e784"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
