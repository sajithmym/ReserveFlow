import { Armchair, CarFront, Monitor, Presentation, Shapes } from "lucide-react";
import { CATEGORY_STYLES } from "@/config/settings";
export function ResourceVisual({
  category,
  compact = false,
}: {
  category: string;
  compact?: boolean;
}) {
  const style = CATEGORY_STYLES[category] ?? "other";
  const Icon =
    category === "Meeting room"
      ? Presentation
      : category === "Equipment"
        ? Monitor
        : category === "Workspace"
          ? Armchair
          : category === "Vehicle"
            ? CarFront
            : Shapes;
  return (
    <div className={`resource-visual ${style} ${compact ? "compact" : ""}`} aria-hidden="true">
      <div className="visual-grid" />
      <div className="visual-orbit" />
      <div className="visual-orbit second" />
      <div className="visual-icon">
        <Icon size={compact ? 20 : 38} strokeWidth={1.4} />
      </div>
      {!compact && (
        <>
          <span className="visual-small-dot" />
          <span className="visual-label">{category}</span>
        </>
      )}
    </div>
  );
}
