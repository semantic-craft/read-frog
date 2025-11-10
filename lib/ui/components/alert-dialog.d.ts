import { buttonVariants } from "./button.js";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { VariantProps } from "class-variance-authority";
import * as React from "react";
import * as react_jsx_runtime82 from "react/jsx-runtime";

//#region src/components/alert-dialog.d.ts
declare function AlertDialog({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Root>): react_jsx_runtime82.JSX.Element;
declare function AlertDialogTrigger({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>): react_jsx_runtime82.JSX.Element;
declare function AlertDialogPortal({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Portal>): react_jsx_runtime82.JSX.Element;
declare function AlertDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>): react_jsx_runtime82.JSX.Element;
declare function AlertDialogContent({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content>): react_jsx_runtime82.JSX.Element;
declare function AlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<'div'>): react_jsx_runtime82.JSX.Element;
declare function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<'div'>): react_jsx_runtime82.JSX.Element;
declare function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>): react_jsx_runtime82.JSX.Element;
declare function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>): react_jsx_runtime82.JSX.Element;
declare function AlertDialogAction({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action> & {
  variant?: VariantProps<typeof buttonVariants>['variant'];
}): react_jsx_runtime82.JSX.Element;
declare function AlertDialogCancel({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>): react_jsx_runtime82.JSX.Element;
//#endregion
export { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, AlertDialogPortal, AlertDialogTitle, AlertDialogTrigger };