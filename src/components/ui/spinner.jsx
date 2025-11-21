import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "../../lib/utils"

const spinnerVariants = cva("animate-spin rounded-full border-2 border-current border-t-transparent", {
  variants: {
    size: {
      default: "h-4 w-4",
      sm: "h-3 w-3",
      lg: "h-6 w-6",
      xl: "h-8 w-8",
    },
  },
  defaultVariants: {
    size: "default",
  },
})

const Spinner = React.forwardRef(({ className, size, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(spinnerVariants({ size }), className)}
      {...props}
    />
  )
})
Spinner.displayName = "Spinner"

export { Spinner, spinnerVariants }

