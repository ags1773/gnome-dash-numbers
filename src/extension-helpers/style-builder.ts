import Gio from "gi://Gio";

export function buildStyleString(
  settings: Gio.Settings | null,
  isDark: boolean,
): string {
  if (!settings) return "";

  const bgColor = settings.get_string(
    isDark ? "bg-color-dark" : "bg-color-light",
  );
  const textColor = settings.get_string(
    isDark ? "text-color-dark" : "text-color-light",
  );
  const borderColor = settings.get_string(
    isDark ? "border-color-dark" : "border-color-light",
  );
  const borderRadius = settings.get_int("border-radius");
  const xPadding = settings.get_int("x-padding");
  const yPadding = settings.get_int("y-padding");
  const fontSize = settings.get_int("font-size");
  const borderWidth = settings.get_int("border-width");
  const isNeon = settings.get_boolean("neon-border");

  let style = `background-color: ${bgColor}; color: ${textColor}; border-radius: ${borderRadius}px; padding: ${yPadding}px ${xPadding}px; font-size: ${fontSize}px;`;

  if (borderWidth > 0) {
    style += ` border: ${borderWidth}px solid ${borderColor};`;
    if (isNeon) {
      const glowRadius = Math.max(4, Math.round(borderWidth * 1.5));
      style += ` box-shadow: 0px 0px ${glowRadius}px ${borderColor};`;
    }
  }

  return style;
}
