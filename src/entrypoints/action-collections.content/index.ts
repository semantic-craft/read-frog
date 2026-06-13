import {
  ACTION_COLLECTION_EXTENSION_SOURCE,
  ACTION_COLLECTION_PAGE_SOURCE,
  OPEN_ACTION_COLLECTION_INSTALL_ACK_TYPE,
  OPEN_ACTION_COLLECTION_INSTALL_REQUEST_TYPE,
} from "@read-frog/definitions"
import { defineContentScript } from "#imports"
import { env } from "@/env"
import { sendMessage } from "@/utils/message"

export default defineContentScript({
  matches: env.WXT_OFFICIAL_SITE_ORIGINS.map((origin: string) => `${origin}/*`),
  main() {
    window.addEventListener("message", async (event) => {
      // postMessage can come from anyone, so validate the source and origin.
      if (event.source !== window || event.origin !== window.location.origin) {
        return
      }

      const { source, type } = event.data || {}
      if (
        source !== ACTION_COLLECTION_PAGE_SOURCE
        || type !== OPEN_ACTION_COLLECTION_INSTALL_REQUEST_TYPE
      ) {
        return
      }

      const requestId = typeof event.data.requestId === "string" ? event.data.requestId : ""
      const collectionId = typeof event.data.id === "number" ? event.data.id : null
      if (!requestId || collectionId == null) {
        return
      }

      // Acknowledge so the page knows the extension is installed.
      window.postMessage({
        source: ACTION_COLLECTION_EXTENSION_SOURCE,
        type: OPEN_ACTION_COLLECTION_INSTALL_ACK_TYPE,
        requestId,
      }, window.location.origin)

      // Hand off to the background to open the options page and start the install flow.
      await sendMessage("requestActionCollectionInstall", { collectionId })
    })
  },
})
