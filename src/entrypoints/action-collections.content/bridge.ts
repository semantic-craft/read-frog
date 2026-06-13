import { kebabCase } from "case-anything"
import { APP_NAME } from "@/utils/constants/app"

export const ACTION_COLLECTION_PAGE_SOURCE = "read-frog-page" as const
export const ACTION_COLLECTION_EXTENSION_SOURCE = `${kebabCase(APP_NAME)}-ext` as const

// Web page → content script: request to open the extension and install a collection.
export const OPEN_ACTION_COLLECTION_INSTALL_REQUEST_TYPE = "openActionCollectionInstall" as const
// Content script → web page: acknowledge the request (used only to detect the extension).
export const OPEN_ACTION_COLLECTION_INSTALL_ACK_TYPE = "openActionCollectionInstallAck" as const
