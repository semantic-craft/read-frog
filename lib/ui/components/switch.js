'use client';


import { cn } from "../lib/utils.js";
import { cva } from "class-variance-authority";
import "react";
import { jsx } from "react/jsx-runtime";
import * as SwitchPrimitive from "@radix-ui/react-switch";

//#region src/components/switch.tsx
const switchVariants = cva("peer focus-visible:ring-ring focus-visible:ring-offset-background data-[state=unchecked]:bg-input inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50", {
	variants: { variant: {
		default: "data-[state=checked]:bg-primary",
		monochrome: "data-[state=checked]:bg-monochrome"
	} },
	defaultVariants: { variant: "default" }
});
function Switch({ className, variant,...props }) {
	return /* @__PURE__ */ jsx(SwitchPrimitive.Root, {
		"data-slot": "switch",
		className: cn(switchVariants({
			variant,
			className
		})),
		...props,
		children: /* @__PURE__ */ jsx(SwitchPrimitive.Thumb, {
			"data-slot": "switch-thumb",
			className: cn("bg-background pointer-events-none block h-4 w-4 rounded-full shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0")
		})
	});
}

//#endregion
export { Switch, switchVariants };