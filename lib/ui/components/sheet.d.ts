import * as React from "react";
import * as react_jsx_runtime0 from "react/jsx-runtime";
import * as SheetPrimitive from "@radix-ui/react-dialog";

//#region src/components/sheet.d.ts
declare function Sheet({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Root>): react_jsx_runtime0.JSX.Element;
declare function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>): react_jsx_runtime0.JSX.Element;
declare function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>): react_jsx_runtime0.JSX.Element;
declare function SheetContent({
  className,
  children,
  side,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: 'top' | 'right' | 'bottom' | 'left';
}): react_jsx_runtime0.JSX.Element;
declare function SheetHeader({
  className,
  ...props
}: React.ComponentProps<'div'>): react_jsx_runtime0.JSX.Element;
declare function SheetFooter({
  className,
  ...props
}: React.ComponentProps<'div'>): react_jsx_runtime0.JSX.Element;
declare function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>): react_jsx_runtime0.JSX.Element;
declare function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>): react_jsx_runtime0.JSX.Element;
//#endregion
export { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger };