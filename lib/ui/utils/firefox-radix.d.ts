//#region src/utils/firefox-radix.d.ts
interface Options {
  controlledOpen?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  isEnabled?: boolean;
  triggerSelectors: string[];
  interactiveSelectors?: string[];
  contentSelector: string;
}
interface Result {
  isFirefoxMode: boolean;
  rootOpen: boolean | undefined;
  rootDefaultOpen: boolean | undefined;
  handleOpenChange: (open: boolean) => void;
  grantClosePermission: () => void;
}
declare function useFirefoxRadixOpenController(options: Options): Result;
//#endregion
export { useFirefoxRadixOpenController };