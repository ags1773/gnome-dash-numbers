import { ExtensionPreferences } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";
import Adw from "gi://Adw";
import Gtk from "gi://Gtk";
import Gdk from "gi://Gdk";
import Gio from "gi://Gio";

export default class DashNumbersPrefs extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    const settings = this.getSettings();
    const page = new Adw.PreferencesPage();

    const createSpinRow = (title, key, lower, upper, step = 1) => {
      const row = new Adw.SpinRow({
        title,
        adjustment: new Gtk.Adjustment({
          lower,
          upper,
          step_increment: step,
        }),
      });
      settings.bind(key, row, "value", Gio.SettingsBindFlags.DEFAULT);
      return row;
    };

    const createSwitchRow = (title, subtitle, key) => {
      const row = new Adw.SwitchRow({
        title,
        subtitle: subtitle || null,
      });
      settings.bind(key, row, "active", Gio.SettingsBindFlags.DEFAULT);
      return row;
    };

    const colourButtons = {};

    const addColourRow = (group, title, key) => {
      const row = new Adw.ActionRow({ title });
      const rgba = new Gdk.RGBA();
      rgba.parse(settings.get_string(key));

      let colourButton;
      if (Gtk.ColorDialogButton) {
        const dialog = new Gtk.ColorDialog();
        colourButton = new Gtk.ColorDialogButton({ dialog });
        colourButton.rgba = rgba;
        colourButton.connect("notify::rgba", () => {
          settings.set_string(key, colourButton.rgba.to_string());
        });
      } else {
        colourButton = new Gtk.ColorButton();
        colourButton.set_rgba(rgba);
        colourButton.connect("color-set", () => {
          settings.set_string(key, colourButton.get_rgba().to_string());
        });
      }

      colourButton.valign = Gtk.Align.CENTER;
      row.add_suffix(colourButton);
      group.add(row);

      colourButtons[key] = colourButton;
    };

    // Colours Group
    const colourGroup = new Adw.PreferencesGroup({ title: "Colours" });
    page.add(colourGroup);

    const colourSettings = [
      ["Light Mode Background", "bg-color-light"],
      ["Light Mode Text", "text-color-light"],
      ["Light Mode Border", "border-color-light"],
      ["Dark Mode Background", "bg-color-dark"],
      ["Dark Mode Text", "text-color-dark"],
      ["Dark Mode Border", "border-color-dark"],
    ];

    colourSettings.forEach(([title, key]) =>
      addColourRow(colourGroup, title, key),
    );

    // Layout & Sizing Group
    const sizeGroup = new Adw.PreferencesGroup({ title: "Sizing" });
    page.add(sizeGroup);

    sizeGroup.add(createSpinRow("Font Size (px)", "font-size", 8, 40));
    sizeGroup.add(createSpinRow("X-Axis Offset (px)", "x-offset", -200, 200));
    sizeGroup.add(createSpinRow("Y-Axis Offset (px)", "y-offset", -200, 200));
    sizeGroup.add(createSpinRow("Horizontal Padding (px)", "x-padding", 0, 40));
    sizeGroup.add(createSpinRow("Vertical Padding (px)", "y-padding", 0, 40));

    // Border Styling Group
    const borderGroup = new Adw.PreferencesGroup({ title: "Border Styling" });
    page.add(borderGroup);

    borderGroup.add(createSpinRow("Border Width (px)", "border-width", 0, 20));
    borderGroup.add(
      createSpinRow("Border Radius (px)", "border-radius", 0, 50),
    );
    borderGroup.add(
      createSwitchRow(
        "Enable Neon Glow",
        "Requires Border Width > 0",
        "neon-border",
      ),
    );

    // Reset Group
    const resetGroup = new Adw.PreferencesGroup();
    page.add(resetGroup);

    const resetActionRow = new Adw.ActionRow({ title: "Reset settings" });
    const resetButton = new Gtk.Button({
      label: "Reset to Defaults",
      valign: Gtk.Align.CENTER,
      css_classes: ["destructive-action"],
    });

    resetButton.connect("clicked", () => {
      const keysToReset = [
        "bg-color-light",
        "text-color-light",
        "border-color-light",
        "bg-color-dark",
        "text-color-dark",
        "border-color-dark",
        "font-size",
        "x-offset",
        "y-offset",
        "x-padding",
        "y-padding",
        "border-width",
        "border-radius",
        "neon-border",
      ];

      keysToReset.forEach((key) => settings.reset(key));

      // Refresh colour picker buttons manually
      Object.entries(colourButtons).forEach(([key, btn]) => {
        const rgba = new Gdk.RGBA();
        rgba.parse(settings.get_string(key));
        if (btn.set_rgba) {
          btn.set_rgba(rgba);
        } else {
          btn.rgba = rgba;
        }
      });
    });

    resetActionRow.add_suffix(resetButton);
    resetGroup.add(resetActionRow);

    window.add(page);
  }
}
