import { elementMatchesSelector, getComposedEventPath, getIsFirefoxExtensionEnv, registerFirefoxOutsideGuard, unregisterFirefoxOutsideGuard } from "./firefox-compat.js";
import * as React from "react";

//#region src/utils/firefox-radix.ts
const ESCAPE_KEY = "Escape";
const CLOSE_PERMISSION_MS = 400;
const JUST_OPENED_DEBOUNCE_MS = 250;
function toElement(target) {
	if (!target) return null;
	return target instanceof Element ? target : null;
}
function pathMatchesSelector(path, selectors) {
	if (selectors.length === 0) return false;
	for (const entry of path) {
		if (!(entry instanceof Element)) continue;
		for (const selector of selectors) if (elementMatchesSelector(entry, selector)) return true;
	}
	return false;
}
function matchesAnySelector(target, selectors, path) {
	if (target) {
		for (const selector of selectors) if (elementMatchesSelector(target, selector)) return true;
	}
	return pathMatchesSelector(path, selectors);
}
function useFirefoxRadixOpenController(options) {
	const { controlledOpen, defaultOpen = false, onOpenChange, isEnabled = true, triggerSelectors, interactiveSelectors = [], contentSelector } = options;
	const isFirefoxMode = React.useMemo(() => getIsFirefoxExtensionEnv(), []) && isEnabled;
	const isControlled = controlledOpen !== void 0;
	const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
	const open = isControlled ? controlledOpen : uncontrolledOpen;
	const openRef = React.useRef(open ?? false);
	const justOpenedRef = React.useRef(false);
	const allowCloseRef = React.useRef(false);
	const debounceTimeoutRef = React.useRef(void 0);
	const allowCloseTimeoutRef = React.useRef(void 0);
	const clearDebounce = React.useCallback(() => {
		if (debounceTimeoutRef.current !== void 0) {
			window.clearTimeout(debounceTimeoutRef.current);
			debounceTimeoutRef.current = void 0;
		}
	}, []);
	const clearAllowCloseTimeout = React.useCallback(() => {
		if (allowCloseTimeoutRef.current !== void 0) {
			window.clearTimeout(allowCloseTimeoutRef.current);
			allowCloseTimeoutRef.current = void 0;
		}
	}, []);
	const grantClosePermission = React.useCallback(() => {
		allowCloseRef.current = true;
		if (allowCloseTimeoutRef.current !== void 0) window.clearTimeout(allowCloseTimeoutRef.current);
		allowCloseTimeoutRef.current = window.setTimeout(() => {
			allowCloseRef.current = false;
			allowCloseTimeoutRef.current = void 0;
		}, CLOSE_PERMISSION_MS);
	}, []);
	const setOpenState = React.useCallback((next) => {
		if (!isControlled) setUncontrolledOpen(next);
	}, [isControlled]);
	const handleOpenChange = React.useCallback((next) => {
		if (!isFirefoxMode) {
			onOpenChange?.(next);
			setOpenState(next);
			return;
		}
		if (next) {
			openRef.current = true;
			justOpenedRef.current = true;
			allowCloseRef.current = false;
			clearAllowCloseTimeout();
			clearDebounce();
			setOpenState(true);
			onOpenChange?.(true);
			debounceTimeoutRef.current = window.setTimeout(() => {
				justOpenedRef.current = false;
				debounceTimeoutRef.current = void 0;
			}, JUST_OPENED_DEBOUNCE_MS);
			return;
		}
		if (justOpenedRef.current || !allowCloseRef.current) {
			openRef.current = true;
			setOpenState(true);
			return;
		}
		allowCloseRef.current = false;
		clearAllowCloseTimeout();
		openRef.current = false;
		setOpenState(false);
		onOpenChange?.(false);
	}, [
		clearAllowCloseTimeout,
		clearDebounce,
		isFirefoxMode,
		onOpenChange,
		setOpenState
	]);
	React.useEffect(() => {
		openRef.current = open ?? false;
	}, [open]);
	React.useLayoutEffect(() => {
		if (!isFirefoxMode) return;
		const guard = (_event) => {
			if (!openRef.current) return false;
			if (justOpenedRef.current) return true;
			return !allowCloseRef.current;
		};
		registerFirefoxOutsideGuard(guard);
		return () => {
			unregisterFirefoxOutsideGuard(guard);
		};
	}, [isFirefoxMode]);
	React.useEffect(() => {
		if (!isFirefoxMode) return;
		return () => {
			clearDebounce();
			clearAllowCloseTimeout();
		};
	}, [
		clearAllowCloseTimeout,
		clearDebounce,
		isFirefoxMode
	]);
	React.useEffect(() => {
		if (!isFirefoxMode) return;
		const handlePointerDown = (event) => {
			const path = getComposedEventPath(event);
			const target = toElement(event.target);
			const isTriggerHit = matchesAnySelector(target, triggerSelectors, path);
			const isInteractiveHit = matchesAnySelector(target, interactiveSelectors, path);
			if (isTriggerHit || isInteractiveHit) {
				if (openRef.current) grantClosePermission();
				return;
			}
			if (!openRef.current || justOpenedRef.current) return;
			if (!matchesAnySelector(target, [contentSelector], path)) grantClosePermission();
		};
		const handleKeyDown = (event) => {
			if (event.key !== ESCAPE_KEY) return;
			if (!openRef.current) return;
			grantClosePermission();
			event.stopPropagation();
			if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
			event.preventDefault();
		};
		window.addEventListener("pointerdown", handlePointerDown, true);
		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("pointerdown", handlePointerDown, true);
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [
		contentSelector,
		grantClosePermission,
		interactiveSelectors,
		isFirefoxMode,
		triggerSelectors
	]);
	return {
		isFirefoxMode,
		rootOpen: isFirefoxMode ? open ?? false : controlledOpen,
		rootDefaultOpen: isFirefoxMode ? void 0 : defaultOpen,
		handleOpenChange,
		grantClosePermission
	};
}

//#endregion
export { useFirefoxRadixOpenController };