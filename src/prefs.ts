import { ExtensionPreferences } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";
import Adw from "gi://Adw";
import { ColorControl } from "./prefs-helpers/types.js";
import {
  buildColoursGroup,
  buildSizeGroup,
  buildBorderGroup,
  buildResetGroup,
} from "./prefs-helpers/groups.js";

export default class DashNumbersPrefs extends ExtensionPreferences {
  override async fillPreferencesWindow(window: any): Promise<void> {
    const settings = this.getSettings();
    const page = new Adw.PreferencesPage();
    const colorControls = new Map<string, ColorControl>();

    page.add(buildColoursGroup(settings, colorControls));
    page.add(buildSizeGroup(settings));
    page.add(buildBorderGroup(settings));
    page.add(buildResetGroup(settings, colorControls));

    window.add(page);
  }
}
