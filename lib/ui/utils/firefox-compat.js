//#region src/utils/firefox-compat.ts
const firefoxOutsideGuards = /* @__PURE__ */ new Set();
const MAX_DEPTH = 10;
function getIsFirefoxExtensionEnv() {
	if (typeof navigator === "undefined" || typeof window === "undefined") return false;
	if (!/firefox/i.test(navigator.userAgent)) return false;
	if (window.location.protocol === "moz-extension:") return true;
	const browserRuntimeId = globalThis?.browser?.runtime?.id;
	if (typeof browserRuntimeId === "string" && browserRuntimeId.length > 0) return true;
	return false;
}
function registerFirefoxOutsideGuard(guard) {
	firefoxOutsideGuards.add(guard);
}
function unregisterFirefoxOutsideGuard(guard) {
	firefoxOutsideGuards.delete(guard);
}
function getComposedEventPath(event) {
	if (typeof event.composedPath === "function") return event.composedPath();
	const path = [];
	let current = event.target ?? null;
	while (current) {
		path.push(current);
		if (current instanceof Node && current.parentNode) current = current.parentNode;
		else break;
	}
	if (!path.includes(window)) path.push(window);
	return path;
}
function elementMatchesSelector(element, selector) {
	if (!selector) return false;
	try {
		if (element.matches(selector)) return true;
	} catch {}
	try {
		return Boolean(element.closest(selector));
	} catch {
		return false;
	}
}
function shouldPreventByGuards(event) {
	if (firefoxOutsideGuards.size === 0) return true;
	for (const guard of firefoxOutsideGuards) try {
		if (guard(event)) return true;
	} catch {
		return true;
	}
	return false;
}
function stopEventChain(event, depth = 0) {
	if (!event || depth > MAX_DEPTH) return;
	event.preventDefault();
	event.stopPropagation();
	if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
	const fromOriginal = event.originalEvent;
	if (fromOriginal && fromOriginal !== event) stopEventChain(fromOriginal, depth + 1);
	const fromDetail = event.detail?.originalEvent;
	if (fromDetail && fromDetail !== event && fromDetail !== fromOriginal) stopEventChain(fromDetail, depth + 1);
}
function preventDismiss(event) {
	const radixEvent = event;
	if (!shouldPreventByGuards(radixEvent)) return;
	stopEventChain(radixEvent);
}
function getFirefoxExtensionRoot() {
	if (typeof document === "undefined") return void 0;
	return document.getElementById("root") ?? void 0;
}

//#endregion
export { elementMatchesSelector, getComposedEventPath, getFirefoxExtensionRoot, getIsFirefoxExtensionEnv, preventDismiss, registerFirefoxOutsideGuard, unregisterFirefoxOutsideGuard };