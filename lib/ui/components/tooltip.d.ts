import * as react_jsx_runtime143 from "react/jsx-runtime";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

//#region src/components/tooltip.d.ts
declare function TooltipProvider({
  delayDuration,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>): react_jsx_runtime143.JSX.Element;
declare function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>): react_jsx_runtime143.JSX.Element;
declare function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>): react_jsx_runtime143.JSX.Element;
declare function TooltipContent({
  className,
  sideOffset,
  collisionPadding,
  container,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content> & {
  container?: HTMLElement | null;
  collisionPadding?: number;
}): react_jsx_runtime143.JSX.Element;
//#endregion
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };