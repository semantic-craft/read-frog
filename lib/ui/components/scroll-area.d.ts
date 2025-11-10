import * as React from "react";
import * as react_jsx_runtime64 from "react/jsx-runtime";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";

//#region src/components/scroll-area.d.ts
declare function ScrollArea({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root>): react_jsx_runtime64.JSX.Element;
declare function ScrollBar({
  className,
  orientation,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>): react_jsx_runtime64.JSX.Element;
//#endregion
export { ScrollArea, ScrollBar };