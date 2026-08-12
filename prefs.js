import { ExtensionPreferences } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";
import Adw from "gi://Adw";
import Gtk from "gi://Gtk";
import Gdk from "gi://Gdk";
import Gio from "gi://Gio";

export default class DashNumbersPrefs extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    const settings = this.getSettings();
    const page = new Adw.PreferencesPage();

    const createSpinRow = (title, subtitle, key, lower, upper, step = 1) => {
      const row = new Adw.SpinRow({
        title,
        subtitle: subtitle || null,
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

    const addColourRow = (group, title, subtitle, key) => {
      const row = new Adw.ActionRow({
        title,
        subtitle: subtitle || null,
      });

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
      [
        "Light Mode Background",
        "Background colour used when light theme is active",
        "bg-color-light",
      ],
      [
        "Light Mode Text",
        "Text colour used when light theme is active",
        "text-color-light",
      ],
      [
        "Light Mode Border",
        "Border colour used when light theme is active",
        "border-color-light",
      ],
      [
        "Dark Mode Background",
        "Background colour used when dark theme is active",
        "bg-color-dark",
      ],
      [
        "Dark Mode Text",
        "Text colour used when dark theme is active",
        "text-color-dark",
      ],
      [
        "Dark Mode Border",
        "Border colour used when dark theme is active",
        "border-color-dark",
      ],
    ];

    colourSettings.forEach(([title, subtitle, key]) =>
      addColourRow(colourGroup, title, subtitle, key),
    );

    // Layout & Sizing Group
    const sizeGroup = new Adw.PreferencesGroup({ title: "Layout/Sizing" });
    page.add(sizeGroup);

    sizeGroup.add(
      createSpinRow(
        "Font Size (px)",
        "Adjust the text size of the numbers",
        "font-size",
        8,
        32,
      ),
    );
    sizeGroup.add(
      createSpinRow(
        "Horizontal Offset (px)",
        "Negative values will shift numbers to left relative to the default position",
        "x-offset",
        -100,
        100,
      ),
    );
    sizeGroup.add(
      createSpinRow(
        "Vertical Offset (px)",
        "Negative values will shift numbers to the top relative to the default position",
        "y-offset",
        -100,
        100,
      ),
    );
    sizeGroup.add(
      createSpinRow(
        "Horizontal Padding (px)",
        "Internal padding on left and right sides",
        "x-padding",
        0,
        40,
      ),
    );
    sizeGroup.add(
      createSpinRow(
        "Vertical Padding (px)",
        "Internal padding on top and bottom sides",
        "y-padding",
        0,
        40,
      ),
    );

    // Border Styling Group
    const borderGroup = new Adw.PreferencesGroup({ title: "Border Styling" });
    page.add(borderGroup);

    borderGroup.add(
      createSpinRow(
        "Border Width (px)",
        "Thickness of the border",
        "border-width",
        0,
        10,
      ),
    );
    borderGroup.add(
      createSpinRow(
        "Border Radius (px)",
        "Corner rounding amount. Zero will make it square",
        "border-radius",
        0,
        50,
      ),
    );
    borderGroup.add(
      createSwitchRow(
        "Enable Neon Glow",
        "Adds a glowing outline effect (Requires Border Width > 0)",
        "neon-border",
      ),
    );

    // Reset Group
    const resetGroup = new Adw.PreferencesGroup();
    page.add(resetGroup);

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

      // Manually Refresh colour picker UI buttons
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

    resetRow.add_suffix(resetButton);
    resetGroup.add(resetRow);

    window.add(page);
  }
}
