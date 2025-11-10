import * as React from "react";
import * as react_jsx_runtime47 from "react/jsx-runtime";
import * as PopoverPrimitive from "@radix-ui/react-popover";

//#region src/components/popover.d.ts
declare const Popover: React.FC<PopoverPrimitive.PopoverProps>;
declare const PopoverTrigger: React.ForwardRefExoticComponent<PopoverPrimitive.PopoverTriggerProps & React.RefAttributes<HTMLButtonElement>>;
declare function PopoverContent({
  ref,
  className,
  align,
  sideOffset,
  ...props
}: React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & {
  ref?: React.RefObject<React.ComponentRef<typeof PopoverPrimitive.Content> | null>;
}): react_jsx_runtime47.JSX.Element;
declare namespace PopoverContent {
  var displayName: string | undefined;
}
declare const PopoverClose: React.ForwardRefExoticComponent<PopoverPrimitive.PopoverCloseProps & React.RefAttributes<HTMLButtonElement>>;
//#endregion
export { Popover, PopoverClose, PopoverContent, PopoverTrigger };