name: "Session Storage Translation State Sync"
description: |
  Implement persistent page translation state using chrome.storage.session to survive service worker restarts

---

## Goal

**Feature Goal**: Replace in-memory translation state Map with chrome.storage.session as the single source of truth to ensure translation state survives service worker sleep/wake cycles

**Deliverable**: Simplified translation state management system using only session storage and one-time messages (no ports, no in-memory Map) that maintains per-tab translation state across service worker restarts

**Success Definition**:
- Translation state persists when service worker goes to sleep (after 30s inactivity) and wakes up
- All content scripts (host.content, side.content) maintain correct translation state after service worker restart
- Popup shows correct translation status for each tab
- State changes from any trigger point (popup button, keyboard shortcut, touch gesture, floating button) propagate to all contexts
- Tab closure properly cleans up persisted state

## User Persona

**Target User**: Read Frog extension users who enable page translation

**Use Case**: User enables page translation on a tab, then switches to another tab for 30+ seconds (causing service worker to sleep). When they return to the translated tab, translation state should still be correct.

**User Journey**:
1. User opens a webpage and enables page translation via popup/shortcut/gesture
2. Page translates successfully
3. User switches to another tab or minimizes browser for 30+ seconds
4. Service worker goes to sleep (in-memory state cleared)
5. User returns to the translated tab
6. **Expected**: Translation state is maintained (page stays translated or user can toggle it correctly)
7. **Current Bug**: State is lost, UI may show incorrect status

**Pain Points Addressed**:
- Service worker sleep causes state loss (current Map-based implementation)
- Unnecessary complexity with port connections and reconnection logic
- Over-engineered dual-state system (Map + Storage sync issues)
- Inconsistent UI state between popup and content scripts

## Why

- **Service Worker Lifecycle Issue**: Chrome extension service workers in Manifest V3 automatically terminate after 30 seconds of inactivity. The current implementation stores translation state in an in-memory `Map<number, { enabled: boolean, ports: Browser.runtime.Port[] }>` which is completely cleared when the service worker terminates.

- **Unnecessary Complexity**: The current port-based architecture adds complexity without real benefits:
  - Ports disconnect on service worker restart, requiring reconnection logic
  - Storing ports in memory alongside state creates dual-state management
  - Performance benefits of in-memory Map are negligible (user operations are infrequent)
  - @webext-core/messaging provides simpler one-time message API that auto-wakes service workers

- **State Synchronization**: Multiple extension contexts need access to translation state:
  - Background service worker: Maintains central state
  - Popup: Shows current tab's translation status
  - host.content: Executes translation and responds to keyboard shortcuts
  - side.content: Shows floating translation toggle button
  - All must stay synchronized even after service worker restarts

- **KISS Principle**: A single source of truth (session storage) is simpler and more maintainable than syncing between Map and storage. User actions (toggle translation) happen infrequently (~0.1/second max), so async storage reads/writes have zero perceptible performance impact.

## What

Implement a session storage-based translation state management system that:

### Functional Requirements

1. **Persist Translation State**: Store per-tab translation enabled/disabled status in `chrome.storage.session`
   - Key format: `session:translationState.${tabId}`
   - Value: `{ enabled: boolean }`
   - Cleared automatically when browser session ends (desired behavior)
   - **Session storage is the ONLY source of truth** (no Map, no caching)

2. **Message-Based Communication**: Use @webext-core/messaging exclusively (eliminate ports)
   - Background → Content scripts: Use `sendMessage(type, data, tabId)` to target specific tabs
   - Content scripts → Background: Use `sendMessage(type, data)` to update state
   - Popup → Background: Use `sendMessage(type, data)` to query/update state
   - All messages are one-time (auto-wake service worker, no reconnection needed)

3. **All Trigger Points**: Support existing translation triggers
   - Popup: Translate button click
   - host.content: Keyboard shortcut, 4-finger touch gesture, auto-translate on page load
   - side.content: Floating button click
   - All read from and write to session storage via background messages

4. **Cleanup**: Remove session storage entries when tabs close
   - Listen to `browser.tabs.onRemoved` event
   - Delete `session:translationState.${tabId}` for closed tabs

### Technical Requirements

1. **Messaging Protocol**: Update existing message handlers (no new message types needed)
   - Keep: `getEnablePageTranslation` - returns boolean from storage
   - Keep: `setEnablePageTranslation` - writes to storage and notifies tab
   - Keep: `setEnablePageTranslationOnContentScript` - extracts tabId from sender
   - Keep: `resetPageTranslationOnNavigation` - for auto-translate logic
   - No new messages needed (existing protocol sufficient)

2. **Storage Pattern**: Follow existing codebase patterns
   - Use WXT storage API: `import { storage } from '#imports'`
   - Use `session:` prefix for session storage keys
   - Type-safe operations with TypeScript generics: `storage.getItem<{ enabled: boolean }>()`

3. **Eliminate Ports**: Remove all port-based communication
   - Remove `browser.runtime.onConnect` listener from background
   - Remove `browser.runtime.connect()` calls from content scripts
   - Replace port messages with `browser.runtime.onMessage` listeners
   - Use `sendMessage(type, data, tabId)` for targeted notifications

### Success Criteria

- [ ] Translation state persists across service worker sleep/wake cycles
- [ ] All trigger points (popup, keyboard shortcut, touch gesture, floating button) correctly update state
- [ ] State changes propagate to all contexts within 100ms
- [ ] Tab closure cleans up session storage within 1 second
- [ ] No memory leaks or orphaned storage entries
- [ ] Manual service worker restart (chrome://extensions terminate button) preserves state
- [ ] Browser restart clears all translation states (session storage behavior)

## All Needed Context

### Context Completeness Check

_This PRP provides complete context for implementing translation state persistence without prior knowledge of the Read Frog codebase. It includes specific file paths, code patterns to follow, library usage examples, and external documentation references._

### Documentation & References

```yaml
# Chrome Extension API Documentation
- url: https://developer.chrome.com/docs/extensions/reference/api/storage
  why: Complete chrome.storage API reference, session storage characteristics
  critical: |
    - chrome.storage.session has 10MB limit (1MB in Chrome <112)
    - Cleared when browser session ends or extension reloads
    - By default restricted to trusted contexts (service worker, popup, options)
    - Use setAccessLevel() to enable content script access if needed
  section: storage.session

- url: https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle
  why: Understanding when and why service workers terminate
  critical: |
    - Service workers terminate after 30 seconds of inactivity
    - All in-memory state (Maps, variables, ports) is completely lost
    - Chrome 110+ events reset the idle timer
    - Design for resilience against unexpected termination
  section: lifecycle

- url: https://developer.chrome.com/docs/extensions/develop/migrate/to-service-workers
  why: Patterns for replacing global variables with chrome.storage
  critical: |
    - Don't use global variables for state in service workers
    - Use chrome.storage.local or chrome.storage.session instead
    - Event listeners must be registered synchronously at top level
  section: persist-data

- url: https://developer.chrome.com/docs/extensions/develop/concepts/messaging
  why: Message passing patterns between extension contexts
  critical: |
    - One-time messages auto-wake service worker (reliable)
    - Long-lived ports disconnect when service worker terminates
    - Use sendMessage for state queries, ports for streaming data
  section: connect

# Codebase Patterns to Follow

- file: apps/extension/src/utils/session-cache/session-cache-group.ts
  why: Reference for session storage usage patterns in this codebase
  pattern: |
    - Uses `session:${prefix}_${key}` naming convention
    - Stores both data and metadata (timestamps)
    - Implements cleanup logic (removeItems)
    - Type-safe with generics: storage.getItem<T>()
  gotcha: This codebase already uses WXT storage abstraction, not chrome.storage directly

- file: apps/extension/src/utils/message.ts
  why: Central message protocol definition using @webext-core/messaging
  pattern: |
    - Define all messages in ProtocolMap interface
    - Function signature: (data: T) => ReturnType
    - void = fire-and-forget, Promise<T> = async response
    - Export: const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>()
  gotcha: Messages auto-wake service worker; no reconnection logic needed

- file: apps/extension/src/entrypoints/background/translation-signal.ts
  why: Current translation state management implementation (NEEDS MODIFICATION)
  pattern: Current broken pattern using in-memory Map
  gotcha: |
    - Line 11: Map is lost when service worker sleeps
    - Line 34: ports array stored in memory, also lost on restart
    - No storage persistence implemented
    - This is the main file to modify

- file: apps/extension/src/utils/atoms/storage-adapter.ts
  why: Storage helper with Zod validation pattern
  pattern: |
    - Wrapper around WXT storage API
    - Validates with Zod schemas before set/get
    - Implements watch() for storage change listeners
    - Automatic `local:` prefix application
  gotcha: Only handles local storage, not session storage (need to adapt pattern)

- file: apps/extension/src/utils/backup/storage.ts
  why: Example of storage cleanup patterns (removeItems, metadata management)
  pattern: |
    - Tracks list of storage keys in separate entry
    - Bulk deletion with storage.removeItems()
    - Metadata stored separately with setMeta/getMeta
    - Automatic cleanup of old entries
  gotcha: Uses local storage, but cleanup pattern applies to session storage too

# Translation Trigger Points (from codebase analysis)

- file: apps/extension/src/entrypoints/popup/components/translate-button.tsx
  why: Popup trigger point - user clicks translate button
  pattern: |
    Line 34-39: sendMessage('setEnablePageTranslation', { tabId, enabled })
    Gets current tab ID from browser.tabs.query({ active: true, currentWindow: true })
  gotcha: Popup may close before message is processed; ensure async handling

- file: apps/extension/src/entrypoints/host.content/translation-control/bind-translation-shortcut.ts
  why: Keyboard shortcut trigger point
  pattern: |
    Line 16-37: hotkeys() listener toggles pageTranslationManager.start()/stop()
    Calls pageTranslationManager directly (doesn't go through background)
  gotcha: Must sendMessage to background to persist state change

- file: apps/extension/src/entrypoints/host.content/translation-control/page-translation.ts
  why: Touch gesture trigger and manager implementation
  pattern: |
    Line 141-194: 4-finger touch gesture detection
    Line 78-80: sendMessage('setEnablePageTranslationOnContentScript', { enabled })
    Line 92-95: Listens to port messages (STATUS_PUSH) from background
  gotcha: Port disconnects on service worker restart; need reconnection or switch to messages

- file: apps/extension/src/entrypoints/side.content/components/floating-button/translate-button.tsx
  why: Side panel floating button trigger point
  pattern: |
    Line 20-38: onClick sends setEnablePageTranslationOnContentScript message
    No validation before sending (unlike popup)
  gotcha: Must handle same validation as popup for consistency

- file: apps/extension/src/entrypoints/host.content/index.tsx
  why: Auto-translate on page load trigger
  pattern: |
    Line 106-108: Checks shouldEnableAutoTranslation() and calls manager.start()
    Line 90-95: Port message listener for STATUS_PUSH
  gotcha: Auto-translate must check session storage for existing state first
```

### Current Codebase Tree (Relevant Files)

```
apps/extension/src/
├── entrypoints/
│   ├── background/
│   │   ├── index.ts                          # Service worker entry point
│   │   ├── translation-signal.ts             # MAIN FILE TO MODIFY - translation state management
│   │   ├── translation-queues.ts             # Translation request queue (references config)
│   │   └── config.ts                         # Config initialization pattern (reference for state init)
│   ├── popup/
│   │   └── components/
│   │       └── translate-button.tsx          # Popup translation toggle trigger
│   ├── host.content/
│   │   ├── index.tsx                         # Host content script entry
│   │   ├── translation-control/
│   │   │   ├── bind-translation-shortcut.ts  # Keyboard shortcut trigger
│   │   │   └── page-translation.ts           # Touch gesture trigger, translation manager
│   │   └── ...
│   └── side.content/
│       ├── index.tsx                         # Side panel entry
│       └── components/
│           └── floating-button/
│               └── translate-button.tsx      # Floating button trigger
├── utils/
│   ├── message.ts                            # MODIFY - add new message types
│   ├── atoms/
│   │   └── storage-adapter.ts                # Reference for storage patterns
│   ├── session-cache/
│   │   ├── session-cache-group.ts            # Reference for session storage usage
│   │   └── session-cache-group-registry.ts   # Reference for cleanup patterns
│   ├── backup/
│   │   └── storage.ts                        # Reference for metadata and bulk operations
│   └── constants/
│       └── config.ts                         # Config constants (add translation state constants)
└── types/
    └── ...
```

### Desired Codebase Tree (Files to Add/Modify)

```
apps/extension/src/
├── entrypoints/background/
│   └── translation-signal.ts                 # MODIFY: Add session storage persistence
├── utils/
│   ├── message.ts                            # MODIFY: Add getTranslationState, setTranslationState messages
│   ├── translation/
│   │   └── state-manager.ts                  # CREATE: Translation state manager utility (optional abstraction)
│   └── constants/
│       └── storage-keys.ts                   # CREATE: Translation storage key constants (optional)
└── types/
    └── translation.ts                        # CREATE: Translation state types (optional, can use inline)
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: WXT storage API auto-imports
// Read Frog uses WXT framework, not raw chrome.storage
import { storage } from '#imports'  // Not: import chrome from 'chrome'

// Pattern: Prefix-based storage areas
await storage.getItem('local:config')    // Local storage
await storage.getItem('session:cache')   // Session storage

// CRITICAL: @webext-core/messaging patterns
// ProtocolMap uses function syntax, NOT object syntax
interface ProtocolMap {
  getMessage: (data: { id: number }) => string  // ✓ Correct
  // getMessage: { data: { id: number }, return: string }  // ✗ Wrong
}

// Return types: void = fire-and-forget, T = sync response, Promise<T> = async
getState: () => boolean                    // Sync return
setState: (data: T) => void               // Fire-and-forget
fetchData: (data: T) => Promise<R>        // Async operation

// CRITICAL: Service worker event listener registration
// Must be registered synchronously at top level, not inside async functions
// ✓ Correct:
browser.runtime.onConnect.addListener(handleConnect)

// ✗ Wrong:
async function init() {
  browser.runtime.onConnect.addListener(handleConnect)  // May not register in time
}

// CRITICAL: Storage watch pattern for reactive updates
// From storage-adapter.ts pattern:
const unwatch = storage.watch<T>('local:key', (newValue) => {
  if (newValue !== null) callback(newValue)
})
// Must return unwatch function for cleanup

// CRITICAL: Tab ID extraction from message sender
onMessage('someMessage', (msg) => {
  const tabId = msg.sender?.tab?.id  // Use optional chaining
  if (typeof tabId !== 'number') {
    logger.error('No valid tabId')
    return
  }
  // Use tabId safely
})

// GOTCHA: Port naming convention
// This codebase uses `translation` prefix for port names
browser.runtime.connect({ name: 'translation-host.content' })
browser.runtime.connect({ name: 'translation-side.content' })

// Check port name with startsWith:
if (port.name.startsWith('translation')) {
  // Handle translation port
}

// GOTCHA: Logger usage
// This codebase uses custom logger, not console.log
import { logger } from '@/utils/logger'
logger.info('message', data)
logger.error('error message', error)
// Not: console.log() or console.error()

// GOTCHA: Config storage key constant
import { CONFIG_STORAGE_KEY } from '@/utils/constants/config'
// Value is 'config', used as `local:${CONFIG_STORAGE_KEY}`

// GOTCHA: Session storage cleanup on tab close
// Must listen to tabs.onRemoved to prevent orphaned entries
browser.tabs.onRemoved.addListener(async (tabId) => {
  await storage.removeItem(`session:translationState.${tabId}`)
})

// PERFORMANCE: Batch storage operations
// Use Promise.all for parallel operations:
await Promise.all([
  storage.setItem(key1, value1),
  storage.setItem(key2, value2),
])

// Don't:
await storage.setItem(key1, value1)
await storage.setItem(key2, value2)  // Sequential, slower
```

## Implementation Blueprint

### Data Models and Structure

```typescript
// Translation state type
interface TranslationState {
  enabled: boolean
}

// Storage key format
// Key: `session:translationState.${tabId}`
// Value: { enabled: boolean }

// Example storage entries:
// session:translationState.123 → { enabled: true }
// session:translationState.456 → { enabled: false }

// NO in-memory Map - session storage is the single source of truth
```

### Implementation Tasks (Ordered by Dependencies)

```yaml
Task 1: REWRITE translation-signal.ts with simplified storage-only architecture
  - MODIFY: apps/extension/src/entrypoints/background/translation-signal.ts
  - IMPLEMENT: Replace entire file with simplified session storage implementation
  - DEPENDENCIES: None
  - STEPS:
      a) REMOVE browser.runtime.onConnect listener (eliminate ports)
      b) REMOVE tabPageTranslationState Map (no in-memory cache)
      c) KEEP existing onMessage handlers, modify to use storage:
         - getEnablePageTranslation: Read from session storage
         - setEnablePageTranslation: Write to storage + notify tab
         - setEnablePageTranslationOnContentScript: Extract tabId from sender + write
         - resetPageTranslationOnNavigation: Check auto-translate + write
      d) ADD browser.tabs.onRemoved listener for cleanup
      e) ADD helper functions: getTranslationState(), setTranslationState()
  - PATTERN: Direct storage read/write, no caching layer
  - CODE_STRUCTURE:
      ```typescript
      export function translationMessage() {
        // Message handlers (use existing protocol)
        onMessage('getEnablePageTranslation', async (msg) => {
          return await getTranslationState(msg.data.tabId)
        })

        onMessage('setEnablePageTranslation', async (msg) => {
          await setTranslationState(msg.data.tabId, msg.data.enabled)
        })

        // ... other handlers

        // Helper functions
        async function getTranslationState(tabId: number): Promise<boolean> {
          const state = await storage.getItem<{ enabled: boolean }>(
            `session:translationState.${tabId}`
          )
          return state?.enabled ?? false
        }

        async function setTranslationState(tabId: number, enabled: boolean) {
          await storage.setItem(`session:translationState.${tabId}`, { enabled })
          // Notify content script using sendMessage with tabId
          void sendMessage('translationStateChanged', { enabled }, tabId)
        }

        // Cleanup
        browser.tabs.onRemoved.addListener(async (tabId) => {
          await storage.removeItem(`session:translationState.${tabId}`)
        })
      }
      ```
  - GOTCHA: Use sendMessage(type, data, tabId) NOT browser.tabs.sendMessage()
  - PLACEMENT: Complete rewrite of translation-signal.ts (~50 lines total)

Task 2: ADD new message type for state change notifications
  - MODIFY: apps/extension/src/utils/message.ts
  - IMPLEMENT: Add one new message type for background → content notifications
  - DEPENDENCIES: None (can be done in parallel with Task 1)
  - CODE:
      # Line ~17, add after existing translation state messages:
      translationStateChanged: (data: { enabled: boolean }) => void
  - PATTERN: void return type (fire-and-forget notification)
  - NAMING: Use camelCase, matches @webext-core/messaging convention
  - PLACEMENT: Group with translation-related messages
  - USAGE: Background sends to specific tab: sendMessage('translationStateChanged', { enabled }, tabId)

Task 3: SIMPLIFY host.content to remove ports and use messages
  - MODIFY: apps/extension/src/entrypoints/host.content/index.tsx
  - IMPLEMENT: Replace port connection with message listener
  - DEPENDENCIES: Task 1, Task 2
  - STEPS:
      a) REMOVE port connection code (lines 82-95)
         - Delete: const port = browser.runtime.connect(...)
         - Delete: port.onMessage.addListener(...)
         - Delete: port.postMessage({ type: 'REQUEST_STATUS' })

      b) ADD message listener for state changes
         - Use onMessage from @webext-core/messaging
         - Listen for 'translationStateChanged' message
         - Update manager: enabled ? manager.start() : manager.stop()

      c) MODIFY initialization to query state
         - Remove port-based initialization
         - Query current tab ID (may need to pass from context or store)
         - Call sendMessage('getEnablePageTranslation', { tabId })
         - Start manager if enabled

      d) KEEP keyboard shortcut and touch gesture handlers unchanged
         - They already call sendMessage('setEnablePageTranslationOnContentScript')
         - Background will handle storage (Task 1)
  - PATTERN:
      ```typescript
      // Listen for state changes from background
      const removeListener = onMessage('translationStateChanged', (msg) => {
        const { enabled } = msg.data
        enabled ? manager.start() : manager.stop()
      })

      // Clean up on unmount (if needed)
      // return () => removeListener()
      ```
  - GOTCHA: Content script may not have easy access to tabId; might need workaround
  - PLACEMENT: Replace port code with message listener, ~10 lines

Task 4: SIMPLIFY side.content to remove ports and use messages
  - MODIFY: apps/extension/src/entrypoints/side.content/index.tsx
  - IMPLEMENT: Same pattern as host.content
  - DEPENDENCIES: Task 1, Task 2
  - STEPS:
      a) REMOVE buildTranslationPort() function entirely
      b) REMOVE port atom: translationPortAtom
      c) ADD message listener:
         - onMessage('translationStateChanged', (msg) => {
             store.set(enablePageTranslationAtom, msg.data.enabled)
           })
      d) MODIFY initialization if needed
         - Query state on mount: sendMessage('getEnablePageTranslation', { tabId })
         - Update enablePageTranslationAtom
  - PATTERN: Same as Task 3, adapted for Jotai atoms
  - PLACEMENT: Remove buildTranslationPort(), add message listener

Task 5: VERIFY popup already works (no changes needed)
  - FILE: apps/extension/src/entrypoints/popup/main.tsx
  - VERIFY: Existing code already uses sendMessage correctly
  - DEPENDENCIES: Task 1
  - STEPS:
      a) Confirm line 52-55 uses sendMessage('getEnablePageTranslation', { tabId })
         - Background will now read from session storage (Task 1)
         - No changes needed to popup code

      b) Confirm translate-button.tsx line 34 uses sendMessage('setEnablePageTranslation')
         - Background will write to session storage (Task 1)
         - No changes needed to button code
  - RESULT: Popup requires NO CHANGES (existing messages work with new storage backend)
  - VALIDATION: Test popup after Task 1 is complete
  - CREATE: apps/extension/src/utils/constants/storage-keys.ts
  - IMPLEMENT: Export translation storage key prefix
  - DEPENDENCIES: None (optional cleanup task)
  - CODE:
      export const TRANSLATION_STATE_KEY_PREFIX = 'session:translationState' as const
      export const getTranslationStateKey = (tabId: number) =>
        `${TRANSLATION_STATE_KEY_PREFIX}.${tabId}` as const
  - PATTERN: Follow CONFIG_STORAGE_KEY pattern from utils/constants/config.ts
  - USAGE: Import in translation-signal.ts and use instead of string literals
  - PLACEMENT: New file in utils/constants/
  - NOTE: Optional - can use string literals directly if preferred
```

### Implementation Patterns & Key Details

```typescript
// Pattern 1: Reading translation state (background)
async function getTranslationState(tabId: number): Promise<boolean> {
  const state = await storage.getItem<{ enabled: boolean }>(
    `session:translationState.${tabId}`
  )
  return state?.enabled ?? false
}

// Pattern 2: Writing translation state (background)
async function setTranslationState(tabId: number, enabled: boolean) {
  // Save to session storage
  await storage.setItem(`session:translationState.${tabId}`, { enabled })

  // Notify content script in that specific tab
  // CRITICAL: Use sendMessage(type, data, tabId) NOT browser.tabs.sendMessage()
  void sendMessage('translationStateChanged', { enabled }, tabId)
}

// Pattern 3: Cleanup on tab close (background)
browser.tabs.onRemoved.addListener(async (tabId) => {
  await storage.removeItem(`session:translationState.${tabId}`)
})

// Pattern 4: Message handler with sender tab ID extraction (background)
onMessage('setEnablePageTranslationOnContentScript', async (msg) => {
  const tabId = msg.sender?.tab?.id
  const { enabled } = msg.data

  // CRITICAL: Validate tabId is number before using
  if (typeof tabId === 'number') {
    await setTranslationState(tabId, enabled)
  } else {
    logger.error('Invalid tabId in setEnablePageTranslationOnContentScript', msg)
  }
})

// Pattern 5: Listening for state changes (content script)
// In host.content or side.content
const removeListener = onMessage('translationStateChanged', (msg) => {
  const { enabled } = msg.data
  // Update translation manager
  enabled ? manager.start() : manager.stop()
})

// Clean up on unmount (if needed)
// return () => removeListener()

// Pattern 6: Complete background implementation (translation-signal.ts)
export function translationMessage() {
  // === Message Handlers ===
  onMessage('getEnablePageTranslation', async (msg) => {
    const { tabId } = msg.data
    return await getTranslationState(tabId)
  })

  onMessage('setEnablePageTranslation', async (msg) => {
    const { tabId, enabled } = msg.data
    await setTranslationState(tabId, enabled)
  })

  onMessage('setEnablePageTranslationOnContentScript', async (msg) => {
    const tabId = msg.sender?.tab?.id
    const { enabled } = msg.data
    if (typeof tabId === 'number') {
      await setTranslationState(tabId, enabled)
    }
  })

  onMessage('resetPageTranslationOnNavigation', async (msg) => {
    const tabId = msg.sender?.tab?.id
    const { url } = msg.data
    if (typeof tabId === 'number') {
      const config = await storage.getItem<Config>(`local:${CONFIG_STORAGE_KEY}`)
      if (!config) return
      const shouldEnable = await shouldEnableAutoTranslation(url, config)
      await setTranslationState(tabId, shouldEnable)
    }
  })

  // === Helper Functions ===
  async function getTranslationState(tabId: number): Promise<boolean> {
    const state = await storage.getItem<{ enabled: boolean }>(
      `session:translationState.${tabId}`
    )
    return state?.enabled ?? false
  }

  async function setTranslationState(tabId: number, enabled: boolean) {
    await storage.setItem(`session:translationState.${tabId}`, { enabled })
    void sendMessage('translationStateChanged', { enabled }, tabId)
  }

  // === Cleanup ===
  browser.tabs.onRemoved.addListener(async (tabId) => {
    await storage.removeItem(`session:translationState.${tabId}`)
  })
}

// Pattern 7: Content script initialization (host.content/side.content)
// Note: Getting tabId in content script requires a workaround
// Content scripts can't directly access their tab ID in all contexts

// Option A: Store tabId when available and use it
let currentTabId: number | undefined

// Listen for state changes
const removeListener = onMessage('translationStateChanged', (msg) => {
  const { enabled } = msg.data
  enabled ? manager.start() : manager.stop()
})

// If you need to query initial state, you might need to:
// 1. Have background send tabId in response to a query
// 2. Use chrome.runtime.sendMessage and extract tabId from sender in background
// 3. Accept that content scripts react to changes rather than query initial state
```

### Integration Points

```yaml
STORAGE:
  - area: chrome.storage.session
  - keys:
      - "session:translationState.${tabId}" → { enabled: boolean }
  - cleanup: On tab close (browser.tabs.onRemoved)
  - NO tracking of active tab IDs (not needed, just check storage when needed)

MESSAGING:
  - protocol: @webext-core/messaging (defineExtensionMessaging)
  - new_messages:
      - translationStateChanged: Notify content script of state change (void return)
  - existing_messages: Keep and modify implementation
      - getEnablePageTranslation: Read from session storage
      - setEnablePageTranslation: Write to session storage + notify tab
      - setEnablePageTranslationOnContentScript: Extract sender tabId + write to storage
      - resetPageTranslationOnNavigation: Auto-translate check + write to storage

EVENTS:
  - browser.runtime.onMessage: One-time messages for all communication
  - browser.tabs.onRemoved: Cleanup storage on tab close
  - NO browser.runtime.onConnect (ports eliminated)
  - NO port.onDisconnect (ports eliminated)

ARCHITECTURE:
  - Background: Message handlers + session storage (no Map, no ports)
  - Content scripts: Message listeners (no ports, no reconnection logic)
  - Popup: Existing message-based communication (no changes needed)
  - State flow: Popup/Content → Background (writes storage + notifies) → Content (receives notification)
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Type check translation-signal.ts
pnpm type-check

# Lint modified files
pnpm lint

# Expected: Zero errors. Fix any type errors or linting issues before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run existing tests to ensure no regressions
pnpm --filter=@read-frog/extension test

# Create new test file: apps/extension/src/entrypoints/background/__tests__/translation-signal.test.ts
# Test scenarios:
#   1. State persistence after Map clear (simulated service worker restart)
#   2. State restoration from session storage
#   3. Tab closure cleanup
#   4. Message handler responses
#   5. Port disconnection recovery

# Run new tests
pnpm --filter=@read-frog/extension test translation-signal

# Expected: All tests pass
```

### Level 3: Manual Integration Testing

```bash
# Build extension
pnpm --filter=@read-frog/extension build

# Load extension in Chrome
# 1. Go to chrome://extensions
# 2. Enable Developer Mode
# 3. Click "Load unpacked"
# 4. Select apps/extension/.output/chrome-mv3

# Test Scenario 1: Service worker restart
#   1. Open a webpage
#   2. Enable page translation via popup
#   3. Verify page translates
#   4. Open chrome://extensions
#   5. Click "Inspect views: service worker"
#   6. In DevTools, go to Application > Service Workers
#   7. Click "Terminate" button to kill service worker
#   8. Wait for service worker to restart
#   9. Verify translation state is still enabled (check popup)
#   10. Toggle translation off/on in popup
#   11. Verify state persists across another service worker restart

# Test Scenario 2: Port disconnection
#   1. Enable translation on a tab
#   2. Monitor DevTools console for port disconnect messages
#   3. Terminate service worker manually
#   4. Verify content script reconnects and maintains correct state
#   5. Check for error-free reconnection in logs

# Test Scenario 3: Multi-trigger consistency
#   1. Enable translation via popup button
#   2. Verify floating button (side panel) shows correct state
#   3. Disable via keyboard shortcut
#   4. Verify popup and floating button both reflect disabled state
#   5. Enable via touch gesture (if on touch device) or floating button
#   6. Verify popup reflects enabled state

# Test Scenario 4: Tab closure cleanup
#   1. Enable translation on 3 different tabs (record tab IDs)
#   2. Open chrome://extensions and inspect service worker
#   3. In console: await chrome.storage.session.get()
#   4. Verify translation state entries exist for all 3 tabs
#   5. Close one tab
#   6. Check storage again: await chrome.storage.session.get()
#   7. Verify that tab's translation state is removed
#   8. Close browser and reopen
#   9. Verify all session storage is cleared (expected behavior)

# Test Scenario 5: Auto-translate interaction
#   1. Add a domain to auto-translate patterns (popup settings)
#   2. Open a page matching that domain
#   3. Verify translation auto-starts
#   4. Terminate service worker
#   5. Reload the page
#   6. Verify auto-translate still works
#   7. Manually disable translation on that page
#   8. Reload page again
#   9. Verify manual state overrides auto-translate on reload

# Expected Results:
#   - Translation state persists across service worker restarts
#   - All trigger points work correctly and sync state
#   - No orphaned storage entries after tab closure
#   - No console errors in service worker or content scripts
#   - Port reconnection happens smoothly without user-visible issues
```

### Level 4: Performance & Stress Testing

```bash
# Test Scenario 1: Many tabs
#   1. Open 20 tabs
#   2. Enable translation on all 20 tabs via popup
#   3. Verify state sync happens within 100ms for each
#   4. Terminate service worker
#   5. Verify all 20 tabs restore state correctly
#   6. Close all tabs
#   7. Check storage is cleaned up: await chrome.storage.session.get()

# Test Scenario 2: Rapid state changes
#   1. Open a tab, enable translation
#   2. Rapidly toggle translation on/off 20 times via popup
#   3. Verify final state matches popup UI
#   4. Verify content script state matches
#   5. Check console for race condition errors

# Test Scenario 3: Long-running session
#   1. Enable translation on a tab
#   2. Leave browser open for 5+ minutes (service worker will sleep multiple times)
#   3. Return to tab and toggle translation
#   4. Verify state still works correctly
#   5. Check DevTools console for any reconnection errors

# Expected Results:
#   - No memory leaks or unbounded storage growth
#   - Performance stays consistent with many tabs
#   - No race conditions in rapid state changes
#   - Service worker sleep/wake cycles don't cause issues
```

## Final Validation Checklist

### Technical Validation

- [ ] Type checking passes: `pnpm type-check`
- [ ] Linting passes: `pnpm lint`
- [ ] All existing tests pass: `pnpm test`
- [ ] New tests created and passing for translation state persistence
- [ ] No TypeScript errors in modified files
- [ ] No console errors in service worker or content scripts

### Feature Validation

- [ ] Translation state persists across service worker restarts (manual terminate test)
- [ ] All trigger points work correctly:
  - [ ] Popup translate button
  - [ ] Keyboard shortcut (host.content)
  - [ ] 4-finger touch gesture (host.content)
  - [ ] Floating button (side.content)
  - [ ] Auto-translate on page load
- [ ] State synchronizes across contexts within 100ms
- [ ] Tab closure removes session storage entries
- [ ] Browser restart clears all session storage (expected behavior)
- [ ] Port disconnection triggers state recovery
- [ ] Multiple tabs maintain independent states correctly

### Code Quality Validation

- [ ] Follows existing codebase patterns:
  - [ ] Uses WXT storage API (`import { storage } from '#imports'`)
  - [ ] Uses @webext-core/messaging for all messages
  - [ ] Uses `logger` instead of console.log
  - [ ] Follows TypeScript strict mode guidelines
- [ ] No global variables for state (uses Map + session storage)
- [ ] Proper error handling with try-catch
- [ ] Tab ID validation (typeof tabId === 'number')
- [ ] Optional chaining for sender info (msg.sender?.tab?.id)
- [ ] Storage key constants used (if created)

### Edge Cases Validated

- [ ] Service worker terminates mid-operation: State still persists
- [ ] Content script injected after service worker restart: Gets correct state
- [ ] Tab reloaded: Translation state reset to auto-translate logic
- [ ] Extension update: State cleared (fresh start)
- [ ] Port message sent to closed tab: Error handled gracefully
- [ ] Storage quota exceeded (unlikely with 10MB limit): Error handling implemented

### Performance Validation

- [ ] 20+ tabs with translation enabled: No performance degradation
- [ ] Rapid toggle (20x): No race conditions or errors
- [ ] Long-running session (5+ min): Service worker sleep/wake works correctly
- [ ] Storage read/write operations complete within 50ms
- [ ] No orphaned storage entries after extensive use

---

## Anti-Patterns to Avoid

- ❌ Don't use in-memory Map for state (lost on service worker restart)
- ❌ Don't use ports for communication (adds unnecessary complexity)
- ❌ Don't sync between Map and storage (dual-state anti-pattern)
- ❌ Don't forget to clean up storage on tab close (orphaned entries)
- ❌ Don't use console.log (use logger from '@/utils/logger')
- ❌ Don't use chrome.storage directly (use WXT storage API: `import { storage } from '#imports'`)
- ❌ Don't use browser.tabs.sendMessage() (use sendMessage(type, data, tabId) from @webext-core/messaging)
- ❌ Don't register event listeners inside async functions (register at top level)
- ❌ Don't skip tabId validation (check typeof tabId === 'number')
- ❌ Don't assume service worker is always alive (design for restarts)
- ❌ Don't over-engineer with caching when storage is fast enough

---

## Confidence Score: 9.5/10

**Rationale for Very High Confidence:**
- **Simplified architecture** (no Map, no ports) reduces implementation risk
- Complete codebase analysis with specific file paths and line numbers
- @webext-core/messaging usage is well-established in codebase
- Session storage patterns already exist (session-cache demonstrates approach)
- Clear trigger points identified with existing code references
- Chrome extension service worker lifecycle is well-documented
- **KISS principle applied**: Single source of truth (storage only)
- **Fewer moving parts**: ~50 lines of background code vs 100+ with Map+ports

**Potential Risks (0.5 point deduction):**
- Content scripts may need workaround to get their own tabId for initial state query (low impact - can rely on state change notifications instead)
- Testing complexity: Manual testing requires service worker termination (not automated)

**Mitigation Strategies:**
- Content scripts react to state changes rather than querying initial state (simpler pattern)
- Add extensive logging for debugging service worker lifecycle
- Create manual testing checklist for validation
- Session storage is inherently persistent across service worker restarts (no special handling needed)
