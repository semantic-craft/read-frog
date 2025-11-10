import * as React from "react";
import * as react_jsx_runtime60 from "react/jsx-runtime";
import * as HoverCardPrimitive from "@radix-ui/react-hover-card";

//#region src/components/hover-card.d.ts
declare function HoverCard({
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Root>): react_jsx_runtime60.JSX.Element;
declare function HoverCardTrigger({
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Trigger>): react_jsx_runtime60.JSX.Element;
declare function HoverCardContent({
  className,
  align,
  sideOffset,
  container,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Content> & {
  container?: HTMLElement | null;
}): react_jsx_runtime60.JSX.Element;
//#endregion
export { HoverCard, HoverCardContent, HoverCardTrigger };