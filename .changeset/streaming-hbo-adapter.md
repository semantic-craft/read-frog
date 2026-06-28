---
"@read-frog/extension": patch
---

Add HBO Max / Max as a second streaming subtitle adapter on the shared framework. It captures HBO's official WebVTT subtitle requests (and DASH manifests listing segmented WebVTT tracks), then reuses the same source/target selection and bilingual alignment as the Netflix adapter — no new plumbing, just one more adapter in the registry.
