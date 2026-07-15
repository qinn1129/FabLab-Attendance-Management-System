export interface ServiceOffering {
  id: string;
  title: string;
  desc: string;
  icon: string; // key into ICON_MAP (see ServicesSection.tsx / AdminServices.tsx)
  image?: string;
  order?: number;
  createdAt?: string;
}

const getScriptUrl = (): string | null => {
  const url = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
  return url && url.trim() !== "" ? url.trim() : null;
};

const getSecret = () => import.meta.env.VITE_WEBAPP_SECRET || "";

export const servicesService = {
  async fetchServices(): Promise<ServiceOffering[]> {
    const url = getScriptUrl();
    if (!url) {
      console.warn("[servicesService] VITE_GOOGLE_SCRIPT_URL is not set. Returning an empty list.");
      return [];
    }
    try {
      const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}secret=${encodeURIComponent(getSecret())}&sheet=services`;
      const response = await fetch(fetchUrl);
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return (data as ServiceOffering[])
        .map(s => ({ ...s, order: Number(s.order) || 0 }))
        .sort((a, b) => (a.order || 0) - (b.order || 0) || (a.createdAt || "").localeCompare(b.createdAt || ""));
    } catch (error) {
      console.error("[servicesService] Failed to fetch services.", error);
      return [];
    }
  },

  async addService(service: { title: string; desc: string; icon: string; image?: string; order?: number }): Promise<ServiceOffering> {
    const newService: ServiceOffering = {
      id: `SVC-${Date.now()}`,
      ...service,
      createdAt: new Date().toISOString(),
    };
    const url = getScriptUrl();
    if (!url) {
      console.warn("[servicesService] VITE_GOOGLE_SCRIPT_URL is not set. Service was not saved.");
      return newService;
    }
    try {
      const secret = getSecret();
      const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}secret=${encodeURIComponent(secret)}&sheet=services`;
      await fetch(fetchUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ secret, sheet: "services", action: "add", data: newService }),
      });
    } catch (error) {
      console.error("[servicesService] Failed to save service.", error);
    }
    return newService;
  },

  async updateService(id: string, updates: Partial<ServiceOffering>): Promise<void> {
    const url = getScriptUrl();
    if (!url) return;
    try {
      const secret = getSecret();
      const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}secret=${encodeURIComponent(secret)}&sheet=services`;
      await fetch(fetchUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ secret, sheet: "services", action: "update", id, data: updates }),
      });
    } catch (error) {
      console.error("[servicesService] Failed to update service.", error);
    }
  },

  async deleteService(id: string): Promise<void> {
    const url = getScriptUrl();
    if (!url) return;
    try {
      const secret = getSecret();
      const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}secret=${encodeURIComponent(secret)}&sheet=services`;
      await fetch(fetchUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ secret, sheet: "services", action: "delete", id }),
      });
    } catch (error) {
      console.error("[servicesService] Failed to delete service.", error);
    }
  },
};