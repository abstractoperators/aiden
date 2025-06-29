import { RefreshCcw } from "lucide-react";
import { Button } from "./button";

export default function RefreshButton({
  onClick,
  disabled,
}: {
  onClick: () => void,
  disabled: boolean,
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      disabled={disabled}
      className="shrink-0"
    >
      <RefreshCcw className={disabled ? "animate-spin" : ""} />
    </Button>
  )
}