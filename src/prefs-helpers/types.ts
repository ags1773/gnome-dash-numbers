import Gdk from "gi://Gdk";

export interface ColorControl {
  setRgba(rgba: Gdk.RGBA): void;
}