import Adw from "gi://Adw";
import Gtk from "gi://Gtk";
import Gdk from "gi://Gdk";
import Gio from "gi://Gio";
import {
  createSpinRow,
  createSwitchRow,
  createColorRow,
} from "./rows.js";
import { ColorControl } from "./types.js";

interface ColorSettingConfig {
  title: string;
  subtitle: string;
  key: string;
}

const COLOR_SETTINGS: ColorSettingConfig[] = [
  {
    title: "Light Mode Background",
    subtitle: "Background colour used when light theme is active",
    key: "bg-color-light",
  },
  {
    title: "Light Mode Text",
    subtitle: "Text colour used when light theme is active",
    key: "text-color-light",
  },
  {
    title: "Light Mode Border",
    subtitle: "Border colour used when light theme is active",
    key: "border-color-light",
  },
  {
    title: "Dark Mode Background",
    subtitle: "Background colour used when dark theme is active",
    key: "bg-color-dark",
  },
  {
    title: "Dark Mode Text",
    subtitle: "Text colour used when dark theme is active",
    key: "text-color-dark",
  },
  {
    title: "Dark Mode Border",
    subtitle: "Border colour used when dark theme is active",
    key: "border-color-dark",
  },
];

export function buildColoursGroup(
  settings: Gio.Settings,
  colorControls: Map<string, ColorControl>,
): Adw.PreferencesGroup {
  const group = new Adw.PreferencesGroup({ title: "Colours" });

  for (const { title, subtitle, key } of COLOR_SETTINGS) {
    const { row, control } = createColorRow(settings, title, subtitle, key);
    group.add(row);
    colorControls.set(key, control);
  }

  return group;
}

export function buildSizeGroup(settings: Gio.Settings): Adw.PreferencesGroup {
  const group = new Adw.PreferencesGroup({ title: "Layout/Sizing" });

  group.add(
    createSpinRow(
      settings,
      "Font Size (px)",
      "Adjust the text size of the numbers",
      "font-size",
      8,
      32,
    ),
  );
  group.add(
    createSpinRow(
      settings,
      "Horizontal Offset (px)",
      "Negative values will shift numbers to left relative to the default position",
      "x-offset",
      -100,
      100,
    ),
  );
  group.add(
    createSpinRow(
      settings,
      "Vertical Offset (px)",
      "Negative values will shift numbers to the top relative to the default position",
      "y-offset",
      -100,
      100,
    ),
  );
  group.add(
    createSpinRow(
      settings,
      "Horizontal Padding (px)",
      "Internal padding on left and right sides",
      "x-padding",
      0,
      40,
    ),
  );
  group.add(
    createSpinRow(
      settings,
      "Vertical Padding (px)",
      "Internal padding on top and bottom sides",
      "y-padding",
      0,
      40,
    ),
  );

  return group;
}

export function buildBorderGroup(settings: Gio.Settings): Adw.PreferencesGroup {
  const group = new Adw.PreferencesGroup({ title: "Border Styling" });

  group.add(
    createSpinRow(
      settings,
      "Border Width (px)",
      "Thickness of the border",
      "border-width",
      0,
      10,
    ),
  );
  group.add(
    createSpinRow(
      settings,
      "Border Radius (px)",
      "Corner rounding amount. Zero will make it square",
      "border-radius",
      0,
      50,
    ),
  );
  group.add(
    createSwitchRow(
      settings,
      "Enable Neon Glow",
      "Adds a glowing outline effect (Requires Border Width > 0)",
      "neon-border",
    ),
  );

  return group;
}

export function buildResetGroup(
  settings: Gio.Settings,
  colorControls: Map<string, ColorControl>,
): Adw.PreferencesGroup {
  const group = new Adw.PreferencesGroup();

  const resetRow = new Adw.ActionRow({
    title: "Reset all settings to default values",
  });

  const resetButton = new Gtk.Button({
    label: "Reset to Defaults",
    valign: Gtk.Align.CENTER,
    css_classes: ["destructive-action"],
  });

  resetButton.connect("clicked", () => {
    settings.list_keys().forEach((key) => settings.reset(key));

    colorControls.forEach((control, key) => {
      const rgba = new Gdk.RGBA();
      rgba.parse(settings.get_string(key));
      control.setRgba(rgba);
    });
  });

  resetRow.add_suffix(resetButton);
  group.add(resetRow);

  return group;
}
