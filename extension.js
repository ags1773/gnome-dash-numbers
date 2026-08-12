import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import St from "gi://St";
import Gio from "gi://Gio";
import GLib from "gi://GLib";
import Clutter from "gi://Clutter";

export default class DashNumbers extends Extension {
  _indicators = [];
  _signalIds = [];
  _timeoutId = null;

  enable() {
    this._settings = this.getSettings();
    this._shellSettings = new Gio.Settings({ schema_id: "org.gnome.shell" });
    this._interfaceSettings = new Gio.Settings({
      schema_id: "org.gnome.desktop.interface",
    });

    this._addSignal(Main.overview, "showing", () =>
      this._scheduleShowNumbers(),
    );
    this._addSignal(Main.overview, "hiding", () => this._hideNumbers());
    this._addSignal(this._settings, "changed", () => this._onSettingsChanged());
    this._addSignal(this._shellSettings, "changed::favorite-apps", () =>
      this._onSettingsChanged(),
    );
    this._addSignal(this._interfaceSettings, "changed::color-scheme", () =>
      this._onSettingsChanged(),
    );

    if (Main.layoutManager._startingUp) {
      this._addSignal(Main.layoutManager, "startup-complete", () => {
        if (Main.overview.visible) this._scheduleShowNumbers();
      });
    } else if (Main.overview.visible) {
      this._scheduleShowNumbers();
    }
  }

  disable() {
    for (const { object, id } of this._signalIds) {
      object.disconnect(id);
    }
    this._signalIds = [];

    if (this._timeoutId) {
      GLib.source_remove(this._timeoutId);
      this._timeoutId = null;
    }

    this._hideNumbers();
    this._settings = null;
    this._shellSettings = null;
    this._interfaceSettings = null;
  }

  _addSignal(object, signal, callback) {
    const id = object.connect(signal, callback);
    this._signalIds.push({ object, id });
  }

  _onSettingsChanged() {
    if (Main.overview.visible) {
      this._scheduleShowNumbers();
    }
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

  _getStyleString(isDark) {
    const bgColor = this._settings.get_string(
      isDark ? "bg-color-dark" : "bg-color-light",
    );
    const textColor = this._settings.get_string(
      isDark ? "text-color-dark" : "text-color-light",
    );
    const borderColor = this._settings.get_string(
      isDark ? "border-color-dark" : "border-color-light",
    );
    const borderRadius = this._settings.get_int("border-radius");
    const xPadding = this._settings.get_int("x-padding");
    const yPadding = this._settings.get_int("y-padding");
    const fontSize = this._settings.get_int("font-size");
    const borderWidth = this._settings.get_int("border-width");
    const isNeon = this._settings.get_boolean("neon-border");

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

  _renderNumbers() {
    this._hideNumbers();

    const dashBox = Main.overview.dash?._box;
    if (!dashBox) return;

    const dashItems = dashBox.get_children();
    const favs = this._shellSettings.get_strv("favorite-apps");
    const isDark =
      this._interfaceSettings.get_string("color-scheme") === "prefer-dark";

    const styleStr = this._getStyleString(isDark);
    const xOffset = this._settings.get_int("x-offset");
    const yOffset = this._settings.get_int("y-offset");
    const favSet = new Set(favs);

    dashItems
      .filter((item) => {
        const appId = item.child?.app?.get_id?.();
        if (!appId) return false;
        return favSet.has(appId);
      })
      .slice(0, 9)
      .forEach((item, index) => {
        const count = index + 1;
        const indicator = new St.Label({
          text: String(count),
          style_class: "dash-number",
          style: styleStr,
          x_expand: false,
          y_expand: false,
          x_align: Clutter.ActorAlign.START,
          y_align: Clutter.ActorAlign.START,
          translation_x: xOffset,
          translation_y: yOffset,
        });

        item.add_child(indicator);
        this._indicators.push(indicator);
      });
  }

  _hideNumbers() {
    for (const indicator of this._indicators) {
      if (indicator) indicator.destroy();
    }
    this._indicators = [];
  }
}
