import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import Gio from "gi://Gio";
import GLib from "gi://GLib";
import { SignalManager } from "./extension-helpers/signal-manager.js";
import { IndicatorManager } from "./extension-helpers/indicator-manager.js";

export default class DashNumbers extends Extension {
  private _gsettings: Gio.Settings | null = null;
  private _shellSettings: Gio.Settings | null = null;
  private _interfaceSettings: Gio.Settings | null = null;

  private _signalManager = new SignalManager();
  private _indicatorManager = new IndicatorManager();
  private _timeoutId: number | null = null;

  enable(): void {
    this._gsettings = this.getSettings();
    this._shellSettings = new Gio.Settings({ schema_id: "org.gnome.shell" });
    this._interfaceSettings = new Gio.Settings({
      schema_id: "org.gnome.desktop.interface",
    });

    this._signalManager.add(Main.overview, "showing", () =>
      this._scheduleShowNumbers(),
    );
    this._signalManager.add(Main.overview, "hiding", () =>
      this._indicatorManager.clear(),
    );
    this._signalManager.add(this._gsettings, "changed", () =>
      this._onSettingsChanged(),
    );
    this._signalManager.add(this._shellSettings, "changed::favorite-apps", () =>
      this._onSettingsChanged(),
    );
    this._signalManager.add(
      this._interfaceSettings,
      "changed::color-scheme",
      () => this._onSettingsChanged(),
    );

    if ((Main.layoutManager as any)._startingUp) {
      this._signalManager.add(Main.layoutManager, "startup-complete", () => {
        if (Main.overview.visible) this._scheduleShowNumbers();
      });
    } else if (Main.overview.visible) {
      this._scheduleShowNumbers();
    }
  }

  disable(): void {
    this._signalManager.disconnectAll();

    if (this._timeoutId !== null) {
      GLib.source_remove(this._timeoutId);
      this._timeoutId = null;
    }

    this._indicatorManager.clear();
    this._gsettings = null;
    this._shellSettings = null;
    this._interfaceSettings = null;
  }

  private _onSettingsChanged(): void {
    if (Main.overview.visible) {
      this._scheduleShowNumbers();
    }
  }

  private _scheduleShowNumbers(): void {
    if (this._timeoutId !== null) {
      GLib.source_remove(this._timeoutId);
    }

    this._timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 150, () => {
      this._indicatorManager.render(
        this._gsettings,
        this._shellSettings,
        this._interfaceSettings,
      );
      this._timeoutId = null;
      return GLib.SOURCE_REMOVE;
    });
  }
}
