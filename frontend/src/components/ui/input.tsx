import * as React from "react"
import { cn } from "../../lib/utils"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-none border-2 border-border bg-background dark:bg-[#0a0a0a] px-4 py-2 text-sm text-foreground dark:text-white placeholder:text-muted-foreground outline-none hover:border-primary/50 focus-visible:ring-0 focus-visible:border-primary transition-colors disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
