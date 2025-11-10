'use client';


import { cn } from "../lib/utils.js";
import { getFirefoxExtensionRoot, getIsFirefoxExtensionEnv, preventDismiss } from "../utils/firefox-compat.js";
import { useFirefoxRadixOpenController } from "../utils/firefox-radix.js";
import * as React from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { IconCheck, IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import * as SelectPrimitive from "@radix-ui/react-select";

//#region src/components/select.tsx
const isFirefoxExtensionEnv = getIsFirefoxExtensionEnv();
function Select({ ...props }) {
	if (isFirefoxExtensionEnv) return /* @__PURE__ */ jsx(SelectFirefox, { ...props });
	return /* @__PURE__ */ jsx(SelectPrimitive.Root, {
		"data-slot": "select",
		...props
	});
}
function SelectGroup({ ...props }) {
	return /* @__PURE__ */ jsx(SelectPrimitive.Group, {
		"data-slot": "select-group",
		...props
	});
}
function SelectValue({ ...props }) {
	return /* @__PURE__ */ jsx(SelectPrimitive.Value, {
		"data-slot": "select-value",
		...props
	});
}
function SelectTrigger({ className, size = "default", hideChevron = false, children,...props }) {
	return /* @__PURE__ */ jsxs(SelectPrimitive.Trigger, {
		"data-slot": "select-trigger",
		"data-size": size,
		className: cn("cursor-pointer border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-input/30 hover:bg-input/50 flex w-fit items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4", className),
		...props,
		children: [children, !hideChevron && /* @__PURE__ */ jsx(SelectPrimitive.Icon, { children: /* @__PURE__ */ jsx(IconChevronDown, { className: "h-4 w-4 opacity-50" }) })]
	});
}
function SelectContent({ className, children, position = "popper", container,...props }) {
	if (isFirefoxExtensionEnv) return /* @__PURE__ */ jsx(SelectContentFirefox, {
		className,
		position,
		container,
		...props,
		children
	});
	return /* @__PURE__ */ jsx(SelectPrimitive.Portal, {
		container: container ?? void 0,
		children: /* @__PURE__ */ jsxs(SelectPrimitive.Content, {
			"data-slot": "select-content",
			className: cn("bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border shadow-md", position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1", "z-[2147483647]", className),
			position,
			...props,
			children: [
				/* @__PURE__ */ jsx(SelectScrollUpButton, {}),
				/* @__PURE__ */ jsx(SelectPrimitive.Viewport, {
					className: cn("p-1", position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1"),
					children
				}),
				/* @__PURE__ */ jsx(SelectScrollDownButton, {})
			]
		})
	});
}
function SelectLabel({ className,...props }) {
	return /* @__PURE__ */ jsx(SelectPrimitive.Label, {
		"data-slot": "select-label",
		className: cn("text-muted-foreground px-2 py-1.5 text-xs", className),
		...props
	});
}
function SelectItem({ className, children,...props }) {
	return /* @__PURE__ */ jsxs(SelectPrimitive.Item, {
		"data-slot": "select-item",
		className: cn("focus:bg-accent focus:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2", className),
		...props,
		children: [/* @__PURE__ */ jsx("span", {
			className: "absolute right-2 flex size-3.5 items-center justify-center",
			children: /* @__PURE__ */ jsx(SelectPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx(IconCheck, { className: "size-4" }) })
		}), /* @__PURE__ */ jsx(SelectPrimitive.ItemText, { children })]
	});
}
function SelectSeparator({ className,...props }) {
	return /* @__PURE__ */ jsx(SelectPrimitive.Separator, {
		"data-slot": "select-separator",
		className: cn("bg-border pointer-events-none -mx-1 my-1 h-px", className),
		...props
	});
}
function SelectScrollUpButton({ className,...props }) {
	return /* @__PURE__ */ jsx(SelectPrimitive.ScrollUpButton, {
		"data-slot": "select-scroll-up-button",
		className: cn("flex cursor-default items-center justify-center py-1", className),
		...props,
		children: /* @__PURE__ */ jsx(IconChevronUp, { className: "size-4" })
	});
}
function SelectScrollDownButton({ className,...props }) {
	return /* @__PURE__ */ jsx(SelectPrimitive.ScrollDownButton, {
		"data-slot": "select-scroll-down-button",
		className: cn("flex cursor-default items-center justify-center py-1", className),
		...props,
		children: /* @__PURE__ */ jsx(IconChevronDown, { className: "size-4" })
	});
}
function SelectFirefox({ open: controlledOpen, onOpenChange, defaultOpen, onValueChange, children,...rest }) {
	const { isFirefoxMode, rootOpen, rootDefaultOpen, handleOpenChange, grantClosePermission } = useFirefoxRadixOpenController({
		controlledOpen,
		defaultOpen,
		onOpenChange,
		triggerSelectors: ["[data-slot=\"select-trigger\"]"],
		interactiveSelectors: ["[data-slot=\"select-item\"]"],
		contentSelector: "[data-slot=\"select-content\"]"
	});
	const handleValueChange = React.useCallback((value) => {
		if (isFirefoxMode) grantClosePermission();
		onValueChange?.(value);
	}, [
		grantClosePermission,
		isFirefoxMode,
		onValueChange
	]);
	return /* @__PURE__ */ jsx(SelectPrimitive.Root, {
		"data-slot": "select",
		open: rootOpen,
		defaultOpen: rootDefaultOpen,
		onOpenChange: handleOpenChange,
		onValueChange: handleValueChange,
		...rest,
		children
	});
}
function SelectContentFirefox({ className, children, position = "popper", container, onPointerDownOutside, onCloseAutoFocus, collisionBoundary, disablePortal = false,...props }) {
	const pointerDownOutsideHandler = React.useMemo(() => {
		return (event) => {
			preventDismiss(event);
			onPointerDownOutside?.(event);
		};
	}, [onPointerDownOutside]);
	const closeAutoFocusHandler = React.useMemo(() => {
		return (event) => {
			preventDismiss(event);
			onCloseAutoFocus?.(event);
		};
	}, [onCloseAutoFocus]);
	const isInShadowDOM = React.useMemo(() => {
		if (typeof document === "undefined") return false;
		let node = document.activeElement;
		while (node) {
			if (node instanceof ShadowRoot) return true;
			node = node.parentNode || node.host || null;
		}
		return false;
	}, []);
	const firefoxRoot = React.useMemo(() => getFirefoxExtensionRoot() ?? void 0, []);
	const finalCollisionBoundary = isFirefoxExtensionEnv && isInShadowDOM ? collisionBoundary ?? firefoxRoot : collisionBoundary;
	const finalDisablePortal = isFirefoxExtensionEnv && isInShadowDOM ? true : disablePortal;
	const finalContainer = container ?? (isFirefoxExtensionEnv ? firefoxRoot : void 0);
	const content = /* @__PURE__ */ jsxs(SelectPrimitive.Content, {
		"data-slot": "select-content",
		className: cn("bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border shadow-md", position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1", "z-[2147483647]", className),
		position,
		onPointerDownOutside: pointerDownOutsideHandler,
		onCloseAutoFocus: closeAutoFocusHandler,
		collisionBoundary: finalCollisionBoundary,
		...props,
		children: [
			/* @__PURE__ */ jsx(SelectScrollUpButton, {}),
			/* @__PURE__ */ jsx(SelectPrimitive.Viewport, {
				className: cn("p-1", position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1"),
				children
			}),
			/* @__PURE__ */ jsx(SelectScrollDownButton, {})
		]
	});
	if (finalDisablePortal) return content;
	return /* @__PURE__ */ jsx(SelectPrimitive.Portal, {
		container: finalContainer,
		children: content
	});
}

//#endregion
export { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger, SelectValue };