import * as Main from "resource:///org/gnome/shell/ui/main.js";
import St from "gi://St";
import Gio from "gi://Gio";
import Clutter from "gi://Clutter";
import { buildStyleString } from "./style-builder.js";

export class IndicatorManager {
  private _indicators: St.Label[] = [];

  render(
    gsettings: Gio.Settings | null,
    shellSettings: Gio.Settings | null,
    interfaceSettings: Gio.Settings | null,
  ): void {
    this.clear();

    if (!shellSettings || !interfaceSettings || !gsettings) {
      return;
    }

    const dashBox = (Main.overview as any).dash?._box as
      | Clutter.Actor
      | undefined;
    if (!dashBox) return;

    const dashItems = dashBox.get_children();
    const favs = shellSettings.get_strv("favorite-apps");
    const isDark =
      interfaceSettings.get_string("color-scheme") === "prefer-dark";

    const styleStr = buildStyleString(gsettings, isDark);
    const xOffset = gsettings.get_int("x-offset");
    const yOffset = gsettings.get_int("y-offset");
    const favSet = new Set(favs);

    dashItems
      .filter((item: any) => {
        const appId = item.child?.app?.get_id?.();
        if (!appId) return false;
        return favSet.has(appId);
      })
      .slice(0, 9)
      .forEach((item: any, index: number) => {
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

  clear(): void {
    for (const indicator of this._indicators) {
      if (indicator) indicator.destroy();
    }
    this._indicators = [];
  }
}
