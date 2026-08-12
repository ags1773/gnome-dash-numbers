import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import St from "gi://St";
import Gio from "gi://Gio";
import GLib from "gi://GLib";
export default class DashNumbers extends Extension {
  constructor(metadata) {
    super(metadata);
    this._indicators = [];
    this._showingId = null;
    this._hidingId = null;
    this._startupCompleteId = null;
    this._settingsChangedId = null;
    this._timeoutId = null;
  }

  enable() {
    this._settings = this.getSettings();
    this._shellSettings = new Gio.Settings({ schema_id: "org.gnome.shell" });
    this._interfaceSettings = new Gio.Settings({
      schema_id: "org.gnome.desktop.interface",
    });

    this._showingId = Main.overview.connect("showing", () =>
      this._scheduleShowNumbers(),
    );
    this._hidingId = Main.overview.connect("hiding", () => this._hideNumbers());

    this._settingsChangedId = this._settings.connect("changed", () => {
      if (Main.overview.visible) this._scheduleShowNumbers();
    });

    if (Main.layoutManager._startingUp) {
      this._startupCompleteId = Main.layoutManager.connect(
        "startup-complete",
        () => {
          if (Main.overview.visible) this._scheduleShowNumbers();
        },
      );
    } else if (Main.overview.visible) {
      this._scheduleShowNumbers();
    }
  }

  disable() {
    if (this._showingId) Main.overview.disconnect(this._showingId);
    if (this._hidingId) Main.overview.disconnect(this._hidingId);

    if (this._startupCompleteId) {
      Main.layoutManager.disconnect(this._startupCompleteId);
      this._startupCompleteId = null;
    }

    if (this._settingsChangedId) {
      this._settings.disconnect(this._settingsChangedId);
      this._settingsChangedId = null;
    }

    if (this._timeoutId) {
      GLib.source_remove(this._timeoutId);
      this._timeoutId = null;
    }

    this._hideNumbers();
    this._settings = null;
    this._shellSettings = null;
    this._interfaceSettings = null;
  }

  _scheduleShowNumbers() {
    if (this._timeoutId) {
      GLib.source_remove(this._timeoutId);
    }
    this._timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 150, () => {
      this._renderNumbers();
      this._timeoutId = null;
      return GLib.SOURCE_REMOVE;
    });
  }

  _renderNumbers() {
    this._hideNumbers();

    const dashBox = Main.overview.dash?._box;
    if (!dashBox) return;

    const dashItems = dashBox.get_children();
    const favs = this._shellSettings.get_strv("favorite-apps");
    const isDark =
      this._interfaceSettings.get_string("color-scheme") === "prefer-dark";

    const bgColor = isDark
      ? this._settings.get_string("bg-color-dark")
      : this._settings.get_string("bg-color-light");
    const textColor = isDark
      ? this._settings.get_string("text-color-dark")
      : this._settings.get_string("text-color-light");
    const borderColor = isDark
      ? this._settings.get_string("border-color-dark")
      : this._settings.get_string("border-color-light");

    const borderRadius = this._settings.get_int("border-radius");
    const xPadding = this._settings.get_int("x-padding");
    const yPadding = this._settings.get_int("y-padding");
    const fontSize = this._settings.get_int("font-size");
    const xOffset = this._settings.get_int("x-offset");
    const yOffset = this._settings.get_int("y-offset");
    const borderWidth = this._settings.get_int("border-width");
    const isNeon = this._settings.get_boolean("neon-border");

    let styleStr = `background-color: ${bgColor}; color: ${textColor}; border-radius: ${borderRadius}px; padding: ${yPadding}px ${xPadding}px; font-size: ${fontSize}px;`;

    if (borderWidth > 0) {
      styleStr += ` border: ${borderWidth}px solid ${borderColor};`;
      if (isNeon) {
        const glowRadius = Math.max(4, Math.round(borderWidth * 1.5));
        styleStr += ` box-shadow: 0px 0px ${glowRadius}px ${borderColor};`;
      }
    }

    let count = 0;

    for (const item of dashItems) {
      const app = item.child?.app;

      if (!app || typeof app.get_id !== "function") continue;
      if (!favs.includes(app.get_id())) continue;

      count++;
      // if (count > 9) break;

      const indicator = new St.Label({
        text: `${count}`,
        style_class: "dash-number",
        style: styleStr,
      });

      indicator.set_position(0, 0);
      indicator.translation_x = xOffset;
      indicator.translation_y = yOffset;

      item.add_child(indicator);
      this._indicators.push(indicator);
    }
  }

  _hideNumbers() {
    for (const indicator of this._indicators) {
      if (indicator) indicator.destroy();
    }
    this._indicators = [];
  }
}
