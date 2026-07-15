import { Printer, Package, Hash, Star, Wrench, Box, Cpu, PenTool, Zap, Layers } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Shared icon lookup for the Service Offerings feature. The admin editor
 * lets Admins pick from these keys via a dropdown; the client-facing
 * ServicesSection renders whichever icon key is stored for each service.
 * Keeping this in one file means both sides always agree on what's valid.
 */
export const SERVICE_ICON_MAP: Record<string, LucideIcon> = {
  Printer,
  Package,
  Hash,
  Star,
  Wrench,
  Box,
  Cpu,
  PenTool,
  Zap,
  Layers,
};

export const SERVICE_ICON_OPTIONS = Object.keys(SERVICE_ICON_MAP);

export function getServiceIcon(key: string): LucideIcon {
  return SERVICE_ICON_MAP[key] || Package;
}