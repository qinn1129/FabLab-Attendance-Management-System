import { parseSheetBoolean } from "../lib/utils";
import { cachedFetch, invalidateCache } from "../lib/requestCache";
import { fetchSheet, addRow, updateRow, deleteRow, isApiConfigured } from "../lib/apiClient";

export interface ServiceOffering {
  id: string;
  title: string;
  desc: string;
  icon: string;
  image?: string;
  order?: number;
  createdAt?: string;
  visible?: boolean;
}

export const servicesService = {
  async fetchServices(): Promise<ServiceOffering[]> {
    if (!isApiConfigured()) {
      console.warn("[servicesService] VITE_API_URL is not set. Returning an empty list.");
      return [];
    }
    return cachedFetch(
      "services",
      async () => {
        try {
          const data = await fetchSheet<any>("services");
          return data
            .map((s) => ({ ...s, order: Number(s.order) || 0, visible: parseSheetBoolean(s.visible, true) }))
            .sort((a, b) => (a.order || 0) - (b.order || 0) || (a.createdAt || "").localeCompare(b.createdAt || "")) as ServiceOffering[];
        } catch (error) {
          console.error("[servicesService] Failed to fetch services.", error);
          return [];
        }
      },
      8000,
    );
  },

  async addService(service: { title: string; desc: string; icon: string; image?: string; order?: number; visible?: boolean }): Promise<ServiceOffering> {
    const newService: ServiceOffering = {
      id: `SVC-${Date.now()}`,
      visible: true,
      ...service,
      createdAt: new Date().toISOString(),
    };
    if (!isApiConfigured()) {
      console.warn("[servicesService] VITE_API_URL is not set. Service was not saved.");
      return newService;
    }
    try {
      await addRow("services", newService as unknown as Record<string, unknown>);
      invalidateCache("services");
    } catch (error) {
      console.error("[servicesService] Failed to save service.", error);
    }
    return newService;
  },

  async updateService(id: string, updates: Partial<ServiceOffering>): Promise<void> {
    if (!isApiConfigured()) return;
    try {
      await updateRow("services", id, updates as Record<string, unknown>);
      invalidateCache("services");
    } catch (error) {
      console.error("[servicesService] Failed to update service.", error);
    }
  },

  async deleteService(id: string): Promise<void> {
    if (!isApiConfigured()) return;
    try {
      await deleteRow("services", id);
      invalidateCache("services");
    } catch (error) {
      console.error("[servicesService] Failed to delete service.", error);
    }
  },
};