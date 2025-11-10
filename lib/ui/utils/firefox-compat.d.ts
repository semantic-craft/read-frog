//#region src/utils/firefox-compat.d.ts
/**
 * Firefox WebExtension compatibility helpers shared across UI components.
 */
interface RadixLikeEvent extends Event {
  originalEvent?: RadixLikeEvent;
  detail?: {
    originalEvent?: RadixLikeEvent;
  };
}
type FirefoxOutsideInteractionGuard = (event: RadixLikeEvent) => boolean;
declare function getIsFirefoxExtensionEnv(): boolean;
declare function registerFirefoxOutsideGuard(guard: FirefoxOutsideInteractionGuard): void;
declare function unregisterFirefoxOutsideGuard(guard: FirefoxOutsideInteractionGuard): void;
declare function getComposedEventPath(event: Event): EventTarget[];
declare function elementMatchesSelector(element: Element, selector: string): boolean;
declare function preventDismiss(event: Event): void;
declare function getFirefoxExtensionRoot(): HTMLElement | undefined;
//#endregion
export { FirefoxOutsideInteractionGuard, elementMatchesSelector, getComposedEventPath, getFirefoxExtensionRoot, getIsFirefoxExtensionEnv, preventDismiss, registerFirefoxOutsideGuard, unregisterFirefoxOutsideGuard };