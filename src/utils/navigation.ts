import { browser } from "#imports"

export async function openOptionsPage(hash?: string) {
  await browser.tabs.create({
    active: true,
    url: browser.runtime.getURL(`/options.html${hash ?? ""}`),
  })
}
