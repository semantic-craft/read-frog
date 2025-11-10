import * as React from "react";
import * as react_jsx_runtime22 from "react/jsx-runtime";
import * as DialogPrimitive from "@radix-ui/react-dialog";

//#region src/components/dialog.d.ts
declare function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>): react_jsx_runtime22.JSX.Element;
declare function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>): react_jsx_runtime22.JSX.Element;
declare function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>): react_jsx_runtime22.JSX.Element;
declare function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>): react_jsx_runtime22.JSX.Element;
declare function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>): react_jsx_runtime22.JSX.Element;
declare function DialogContent({
  className,
  children,
  showCloseButton,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
}): react_jsx_runtime22.JSX.Element;
declare function DialogHeader({
  className,
  ...props
}: React.ComponentProps<'div'>): react_jsx_runtime22.JSX.Element;
declare function DialogFooter({
  className,
  ...props
}: React.ComponentProps<'div'>): react_jsx_runtime22.JSX.Element;
declare function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>): react_jsx_runtime22.JSX.Element;
declare function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>): react_jsx_runtime22.JSX.Element;
//#endregion
export { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger };