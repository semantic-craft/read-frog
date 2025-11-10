import * as React from "react";
import * as react_jsx_runtime32 from "react/jsx-runtime";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";

//#region src/components/dropdown-menu.d.ts
declare function DropdownMenu({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>): react_jsx_runtime32.JSX.Element;
declare function DropdownMenuPortal({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>): react_jsx_runtime32.JSX.Element;
declare function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>): react_jsx_runtime32.JSX.Element;
declare function DropdownMenuContent({
  className,
  sideOffset,
  container,
  disablePortal,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content> & {
  container?: HTMLElement | null;
  disablePortal?: boolean;
}): react_jsx_runtime32.JSX.Element;
declare function DropdownMenuGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Group>): react_jsx_runtime32.JSX.Element;
declare function DropdownMenuItem({
  className,
  inset,
  variant,
  onSelect,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean;
  variant?: 'default' | 'destructive';
}): react_jsx_runtime32.JSX.Element;
declare function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  onSelect,
  onCheckedChange,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>): react_jsx_runtime32.JSX.Element;
declare function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>): react_jsx_runtime32.JSX.Element;
declare function DropdownMenuRadioItem({
  className,
  children,
  onSelect,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>): react_jsx_runtime32.JSX.Element;
declare function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean;
}): react_jsx_runtime32.JSX.Element;
declare function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>): react_jsx_runtime32.JSX.Element;
declare function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<'span'>): react_jsx_runtime32.JSX.Element;
declare function DropdownMenuSub({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>): react_jsx_runtime32.JSX.Element;
declare function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  onSelect,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean;
}): react_jsx_runtime32.JSX.Element;
declare function DropdownMenuSubContent({
  className,
  container,
  disablePortal,
  onPointerDownOutside,
  hideWhenDetached,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent> & {
  container?: HTMLElement | null;
  disablePortal?: boolean;
}): react_jsx_runtime32.JSX.Element;
//#endregion
export { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger };