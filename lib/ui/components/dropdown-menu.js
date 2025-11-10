'use client';


import { cn } from "../lib/utils.js";
import { getFirefoxExtensionRoot, getIsFirefoxExtensionEnv, preventDismiss } from "../utils/firefox-compat.js";
import { useFirefoxRadixOpenController } from "../utils/firefox-radix.js";
import * as React from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { IconCheck, IconChevronRight, IconCircle } from "@tabler/icons-react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";

//#region src/components/dropdown-menu.tsx
const isFirefoxExtensionEnv = getIsFirefoxExtensionEnv();
const FirefoxDropdownMenuContext = React.createContext({
	isFirefoxMode: false,
	grantClosePermission: () => {}
});
function useFirefoxDropdownContext() {
	return React.use(FirefoxDropdownMenuContext);
}
function DropdownMenu({ ...props }) {
	if (isFirefoxExtensionEnv) return /* @__PURE__ */ jsx(DropdownMenuFirefox, { ...props });
	return /* @__PURE__ */ jsx(DropdownMenuPrimitive.Root, {
		"data-slot": "dropdown-menu",
		...props
	});
}
function DropdownMenuFirefox({ open: controlledOpen, defaultOpen, onOpenChange, children,...props }) {
	const { isFirefoxMode, rootOpen, rootDefaultOpen, handleOpenChange, grantClosePermission } = useFirefoxRadixOpenController({
		controlledOpen,
		defaultOpen,
		onOpenChange,
		triggerSelectors: ["[data-slot=\"dropdown-menu-trigger\"]", "[data-slot=\"dropdown-menu-sub-trigger\"]"],
		interactiveSelectors: [
			"[data-slot=\"dropdown-menu-item\"]",
			"[data-slot=\"dropdown-menu-checkbox-item\"]",
			"[data-slot=\"dropdown-menu-radio-item\"]"
		],
		contentSelector: "[data-slot=\"dropdown-menu-content\"], [data-slot=\"dropdown-menu-sub-content\"]"
	});
	const contextValue = React.useMemo(() => isFirefoxMode ? {
		isFirefoxMode: true,
		grantClosePermission
	} : {
		isFirefoxMode: false,
		grantClosePermission: () => {}
	}, [grantClosePermission, isFirefoxMode]);
	return /* @__PURE__ */ jsx(DropdownMenuPrimitive.Root, {
		"data-slot": "dropdown-menu",
		open: rootOpen,
		defaultOpen: rootDefaultOpen,
		onOpenChange: handleOpenChange,
		...props,
		children: /* @__PURE__ */ jsx(FirefoxDropdownMenuContext, {
			value: contextValue,
			children
		})
	});
}
function DropdownMenuPortal({ ...props }) {
	return /* @__PURE__ */ jsx(DropdownMenuPrimitive.Portal, {
		"data-slot": "dropdown-menu-portal",
		...props
	});
}
function DropdownMenuTrigger({ ...props }) {
	return /* @__PURE__ */ jsx(DropdownMenuPrimitive.Trigger, {
		"data-slot": "dropdown-menu-trigger",
		...props
	});
}
function DropdownMenuContent({ className, sideOffset = 4, container, disablePortal = false,...props }) {
	if (isFirefoxExtensionEnv) return /* @__PURE__ */ jsx(DropdownMenuContentFirefox, {
		className,
		sideOffset,
		container,
		disablePortal,
		...props
	});
	const content = /* @__PURE__ */ jsx(DropdownMenuPrimitive.Content, {
		"data-slot": "dropdown-menu-content",
		sideOffset,
		className: cn("bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md", className),
		...props
	});
	if (disablePortal) return content;
	return /* @__PURE__ */ jsx(DropdownMenuPrimitive.Portal, {
		container: container ?? void 0,
		children: content
	});
}
function DropdownMenuGroup({ ...props }) {
	return /* @__PURE__ */ jsx(DropdownMenuPrimitive.Group, {
		"data-slot": "dropdown-menu-group",
		...props
	});
}
function DropdownMenuItem({ className, inset, variant = "default", onSelect,...props }) {
	if (isFirefoxExtensionEnv) return /* @__PURE__ */ jsx(DropdownMenuItemFirefox, {
		className,
		inset,
		variant,
		onSelect,
		...props
	});
	return /* @__PURE__ */ jsx(DropdownMenuPrimitive.Item, {
		"data-slot": "dropdown-menu-item",
		"data-inset": inset,
		"data-variant": variant,
		className: cn("focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4", className),
		onSelect,
		...props
	});
}
function DropdownMenuCheckboxItem({ className, children, checked, onSelect, onCheckedChange,...props }) {
	if (isFirefoxExtensionEnv) return /* @__PURE__ */ jsx(DropdownMenuCheckboxItemFirefox, {
		className,
		checked,
		onSelect,
		onCheckedChange,
		...props,
		children
	});
	return /* @__PURE__ */ jsxs(DropdownMenuPrimitive.CheckboxItem, {
		"data-slot": "dropdown-menu-checkbox-item",
		className: cn("focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4", className),
		checked,
		onSelect,
		onCheckedChange,
		...props,
		children: [/* @__PURE__ */ jsx("span", {
			className: "pointer-events-none absolute left-2 flex size-3.5 items-center justify-center",
			children: /* @__PURE__ */ jsx(DropdownMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx(IconCheck, { className: "size-4" }) })
		}), children]
	});
}
function DropdownMenuRadioGroup({ ...props }) {
	return /* @__PURE__ */ jsx(DropdownMenuPrimitive.RadioGroup, {
		"data-slot": "dropdown-menu-radio-group",
		...props
	});
}
function DropdownMenuRadioItem({ className, children, onSelect,...props }) {
	if (isFirefoxExtensionEnv) return /* @__PURE__ */ jsx(DropdownMenuRadioItemFirefox, {
		className,
		onSelect,
		...props,
		children
	});
	return /* @__PURE__ */ jsxs(DropdownMenuPrimitive.RadioItem, {
		"data-slot": "dropdown-menu-radio-item",
		className: cn("focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4", className),
		onSelect,
		...props,
		children: [/* @__PURE__ */ jsx("span", {
			className: "pointer-events-none absolute left-2 flex size-3.5 items-center justify-center",
			children: /* @__PURE__ */ jsx(DropdownMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx(IconCircle, { className: "size-2 fill-current" }) })
		}), children]
	});
}
function DropdownMenuLabel({ className, inset,...props }) {
	return /* @__PURE__ */ jsx(DropdownMenuPrimitive.Label, {
		"data-slot": "dropdown-menu-label",
		"data-inset": inset,
		className: cn("px-2 py-1.5 text-sm font-medium data-[inset]:pl-8", className),
		...props
	});
}
function DropdownMenuSeparator({ className,...props }) {
	return /* @__PURE__ */ jsx(DropdownMenuPrimitive.Separator, {
		"data-slot": "dropdown-menu-separator",
		className: cn("bg-border -mx-1 my-1 h-px", className),
		...props
	});
}
function DropdownMenuShortcut({ className,...props }) {
	return /* @__PURE__ */ jsx("span", {
		"data-slot": "dropdown-menu-shortcut",
		className: cn("text-muted-foreground ml-auto text-xs tracking-widest", className),
		...props
	});
}
function DropdownMenuSub({ ...props }) {
	return /* @__PURE__ */ jsx(DropdownMenuPrimitive.Sub, {
		"data-slot": "dropdown-menu-sub",
		...props
	});
}
function DropdownMenuSubTrigger({ className, inset, children, onSelect,...props }) {
	if (isFirefoxExtensionEnv) return /* @__PURE__ */ jsx(DropdownMenuSubTriggerFirefox, {
		className,
		inset,
		onSelect,
		...props,
		children
	});
	return /* @__PURE__ */ jsxs(DropdownMenuPrimitive.SubTrigger, {
		"data-slot": "dropdown-menu-sub-trigger",
		"data-inset": inset,
		className: cn("focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[inset]:pl-8", className),
		onSelect,
		...props,
		children: [children, /* @__PURE__ */ jsx(IconChevronRight, { className: "ml-auto size-4" })]
	});
}
function DropdownMenuSubContent({ className, container, disablePortal, onPointerDownOutside, hideWhenDetached,...props }) {
	if (isFirefoxExtensionEnv) return /* @__PURE__ */ jsx(DropdownMenuSubContentFirefox, {
		className,
		container,
		disablePortal,
		onPointerDownOutside,
		hideWhenDetached,
		...props
	});
	return /* @__PURE__ */ jsx(DropdownMenuPrimitive.SubContent, {
		"data-slot": "dropdown-menu-sub-content",
		className: cn("bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-md border p-1 shadow-lg", className),
		onPointerDownOutside,
		hideWhenDetached,
		...props
	});
}
function DropdownMenuContentFirefox({ className, sideOffset = 4, container, disablePortal = false, onCloseAutoFocus, onPointerDownOutside, onFocusOutside, onInteractOutside, collisionBoundary, hideWhenDetached,...props }) {
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
	const focusOutsideHandler = React.useMemo(() => {
		return (event) => {
			preventDismiss(event);
			onFocusOutside?.(event);
		};
	}, [onFocusOutside]);
	const interactOutsideHandler = React.useMemo(() => {
		return (event) => {
			preventDismiss(event);
			onInteractOutside?.(event);
		};
	}, [onInteractOutside]);
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
	const finalHideWhenDetached = isFirefoxExtensionEnv ? true : hideWhenDetached;
	const content = /* @__PURE__ */ jsx(DropdownMenuPrimitive.Content, {
		"data-slot": "dropdown-menu-content",
		sideOffset,
		className: cn("bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-[2147483647] max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md", className),
		onPointerDownOutside: pointerDownOutsideHandler,
		onCloseAutoFocus: closeAutoFocusHandler,
		onFocusOutside: focusOutsideHandler,
		onInteractOutside: interactOutsideHandler,
		collisionBoundary: finalCollisionBoundary,
		hideWhenDetached: finalHideWhenDetached,
		...props
	});
	if (finalDisablePortal) return content;
	return /* @__PURE__ */ jsx(DropdownMenuPrimitive.Portal, {
		container: finalContainer,
		children: content
	});
}
function DropdownMenuItemFirefox({ className, inset, variant = "default", onSelect,...props }) {
	const { isFirefoxMode, grantClosePermission } = useFirefoxDropdownContext();
	return /* @__PURE__ */ jsx(DropdownMenuPrimitive.Item, {
		"data-slot": "dropdown-menu-item",
		"data-inset": inset,
		"data-variant": variant,
		className: cn("focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4", className),
		onSelect: (event) => {
			if (isFirefoxMode) grantClosePermission();
			onSelect?.(event);
		},
		...props
	});
}
function DropdownMenuCheckboxItemFirefox({ className, children, checked, onSelect, onCheckedChange,...props }) {
	const { isFirefoxMode, grantClosePermission } = useFirefoxDropdownContext();
	return /* @__PURE__ */ jsxs(DropdownMenuPrimitive.CheckboxItem, {
		"data-slot": "dropdown-menu-checkbox-item",
		className: cn("focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4", className),
		checked,
		onSelect: (event) => {
			if (isFirefoxMode) grantClosePermission();
			onSelect?.(event);
		},
		onCheckedChange: (value) => {
			if (isFirefoxMode) grantClosePermission();
			onCheckedChange?.(value);
		},
		...props,
		children: [/* @__PURE__ */ jsx("span", {
			className: "pointer-events-none absolute left-2 flex size-3.5 items-center justify-center",
			children: /* @__PURE__ */ jsx(DropdownMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx(IconCheck, { className: "size-4" }) })
		}), children]
	});
}
function DropdownMenuRadioItemFirefox({ className, children, onSelect,...props }) {
	const { isFirefoxMode, grantClosePermission } = useFirefoxDropdownContext();
	return /* @__PURE__ */ jsxs(DropdownMenuPrimitive.RadioItem, {
		"data-slot": "dropdown-menu-radio-item",
		className: cn("focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4", className),
		onSelect: (event) => {
			if (isFirefoxMode) grantClosePermission();
			onSelect?.(event);
		},
		...props,
		children: [/* @__PURE__ */ jsx("span", {
			className: "pointer-events-none absolute left-2 flex size-3.5 items-center justify-center",
			children: /* @__PURE__ */ jsx(DropdownMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx(IconCircle, { className: "size-2 fill-current" }) })
		}), children]
	});
}
function DropdownMenuSubTriggerFirefox({ className, inset, children, onSelect,...props }) {
	const { isFirefoxMode, grantClosePermission } = useFirefoxDropdownContext();
	return /* @__PURE__ */ jsxs(DropdownMenuPrimitive.SubTrigger, {
		"data-slot": "dropdown-menu-sub-trigger",
		"data-inset": inset,
		className: cn("focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[inset]:pl-8", className),
		onSelect: (event) => {
			if (isFirefoxMode) grantClosePermission();
			onSelect?.(event);
		},
		...props,
		children: [children, /* @__PURE__ */ jsx(IconChevronRight, { className: "ml-auto size-4" })]
	});
}
function DropdownMenuSubContentFirefox({ className, container, disablePortal = false, onPointerDownOutside, hideWhenDetached,...props }) {
	const pointerDownOutsideHandler = React.useMemo(() => {
		return (event) => {
			preventDismiss(event);
			onPointerDownOutside?.(event);
		};
	}, [onPointerDownOutside]);
	const firefoxRoot = React.useMemo(() => getFirefoxExtensionRoot() ?? void 0, []);
	const finalHideWhenDetached = isFirefoxExtensionEnv ? true : hideWhenDetached;
	const finalContainer = container ?? (isFirefoxExtensionEnv ? firefoxRoot : void 0);
	const content = /* @__PURE__ */ jsx(DropdownMenuPrimitive.SubContent, {
		"data-slot": "dropdown-menu-sub-content",
		className: cn("bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-[2147483647] min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-md border p-1 shadow-lg", className),
		onPointerDownOutside: pointerDownOutsideHandler,
		hideWhenDetached: finalHideWhenDetached,
		...props
	});
	if (disablePortal) return content;
	return /* @__PURE__ */ jsx(DropdownMenuPrimitive.Portal, {
		container: finalContainer,
		children: content
	});
}

//#endregion
export { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger };