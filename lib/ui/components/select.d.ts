import * as React from "react";
import * as react_jsx_runtime93 from "react/jsx-runtime";
import * as SelectPrimitive from "@radix-ui/react-select";

//#region src/components/select.d.ts
declare function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>): react_jsx_runtime93.JSX.Element;
declare function SelectGroup({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>): react_jsx_runtime93.JSX.Element;
declare function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>): react_jsx_runtime93.JSX.Element;
declare function SelectTrigger({
  className,
  size,
  hideChevron,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: 'sm' | 'default';
  hideChevron?: boolean;
}): react_jsx_runtime93.JSX.Element;
declare function SelectContent({
  className,
  children,
  position,
  container,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content> & {
  container?: HTMLElement | null;
}): react_jsx_runtime93.JSX.Element;
declare function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>): react_jsx_runtime93.JSX.Element;
declare function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>): react_jsx_runtime93.JSX.Element;
declare function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>): react_jsx_runtime93.JSX.Element;
declare function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>): react_jsx_runtime93.JSX.Element;
declare function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>): react_jsx_runtime93.JSX.Element;
//#endregion
export { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger, SelectValue };