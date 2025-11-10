'use client';


import { cn } from "../lib/utils.js";
import "react";
import { jsx } from "react/jsx-runtime";
import * as PopoverPrimitive from "@radix-ui/react-popover";

//#region src/components/popover.tsx
const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;
function PopoverContent({ ref, className, align = "center", sideOffset = 4,...props }) {
	return /* @__PURE__ */ jsx(PopoverPrimitive.Portal, { children: /* @__PURE__ */ jsx(PopoverPrimitive.Content, {
		ref,
		align,
		sideOffset,
		side: "bottom",
		className: cn("z-50 min-w-[220px] max-w-[98vw] rounded-lg border bg-fd-popover p-2 text-sm text-fd-popover-foreground shadow-lg focus-visible:outline-none data-[state=closed]:animate-fd-popover-out data-[state=open]:animate-fd-popover-in", className),
		...props
	}) });
}
PopoverContent.displayName = PopoverPrimitive.Content.displayName;
const PopoverClose = PopoverPrimitive.PopoverClose;

//#endregion
export { Popover, PopoverClose, PopoverContent, PopoverTrigger };