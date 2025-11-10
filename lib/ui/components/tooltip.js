'use client';


import { cn } from "../lib/utils.js";
import { jsx, jsxs } from "react/jsx-runtime";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

//#region src/components/tooltip.tsx
function TooltipProvider({ delayDuration = 0,...props }) {
	return /* @__PURE__ */ jsx(TooltipPrimitive.Provider, {
		"data-slot": "tooltip-provider",
		delayDuration,
		...props
	});
}
function Tooltip({ ...props }) {
	return /* @__PURE__ */ jsx(TooltipProvider, { children: /* @__PURE__ */ jsx(TooltipPrimitive.Root, {
		"data-slot": "tooltip",
		...props
	}) });
}
function TooltipTrigger({ ...props }) {
	return /* @__PURE__ */ jsx(TooltipPrimitive.Trigger, {
		"data-slot": "tooltip-trigger",
		...props
	});
}
function TooltipContent({ className, sideOffset = 0, collisionPadding = 8, container, children,...props }) {
	return /* @__PURE__ */ jsx(TooltipPrimitive.Portal, {
		container: container ?? document.body,
		children: /* @__PURE__ */ jsxs(TooltipPrimitive.Content, {
			"data-slot": "tooltip-content",
			sideOffset,
			collisionPadding,
			className: cn("animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-[2147483647] w-fit origin-(--radix-tooltip-content-transform-origin) rounded-sm bg-neutral-950 dark:bg-neutral-800 px-3 py-1.5 text-xs text-white", className),
			...props,
			children: [children, /* @__PURE__ */ jsx(TooltipPrimitive.Arrow, { className: "z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] bg-neutral-950 dark:bg-neutral-800 fill-neutral-950 dark:fill-neutral-800" })]
		})
	});
}

//#endregion
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };