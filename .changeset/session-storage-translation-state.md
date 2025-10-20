---
"@read-frog/extension": patch
---

refactor(extension): use session storage for translation state persistence

Replace in-memory Map with chrome.storage.session to ensure translation state survives service worker restarts. Simplifies architecture by removing port-based communication.
