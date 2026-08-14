import Adw from "gi://Adw";
import Gtk from "gi://Gtk";
import Gdk from "gi://Gdk";
import Gio from "gi://Gio";
import { ColorControl } from "./types.js";

export function createSpinRow(
  settings: Gio.Settings,
  title: string,
  subtitle: string | null,
  key: string,
  lower: number,
  upper: number,
  step: number = 1,
): Adw.SpinRow {
  const row = new Adw.SpinRow({
    title,
    subtitle: subtitle ?? null,
    adjustment: new Gtk.Adjustment({
      lower,
      upper,
      step_increment: step,
    }),
  });
  settings.bind(key, row, "value", Gio.SettingsBindFlags.DEFAULT);
  return row;
}

export function createSwitchRow(
  settings: Gio.Settings,
  title: string,
  subtitle: string | null,
  key: string,
): Adw.SwitchRow {
  const row = new Adw.SwitchRow({
    title,
    subtitle: subtitle ?? null,
  });
  settings.bind(key, row, "active", Gio.SettingsBindFlags.DEFAULT);
  return row;
}

export function createColorRow(
  settings: Gio.Settings,
  title: string,
  subtitle: string | null,
  key: string,
): { row: Adw.ActionRow; control: ColorControl } {
  const row = new Adw.ActionRow({
    title,
    subtitle: subtitle ?? null,
  });

  const rgba = new Gdk.RGBA();
  rgba.parse(settings.get_string(key));

  let colourWidget: Gtk.Widget;
  let control: ColorControl;

  const GtkAny = Gtk as any;

  if (GtkAny.ColorDialogButton) {
    const dialog = new Gtk.ColorDialog();
    const button = new Gtk.ColorDialogButton({ dialog });
    button.rgba = rgba;
    button.connect("notify::rgba", () => {
      settings.set_string(key, button.rgba.to_string());
    });
    colourWidget = button;
    control = {
      setRgba: (newRgba: Gdk.RGBA) => {
        button.rgba = newRgba;
      },
    };
  } else {
    const button = new Gtk.ColorButton();
    button.set_rgba(rgba);
    button.connect("color-set", () => {
      settings.set_string(key, button.get_rgba().to_string());
    });
    colourWidget = button;
    control = {
      setRgba: (newRgba: Gdk.RGBA) => {
        button.set_rgba(newRgba);
      },
    };
  }

  colourWidget.valign = Gtk.Align.CENTER;
  row.add_suffix(colourWidget);

  return { row, control };
}
