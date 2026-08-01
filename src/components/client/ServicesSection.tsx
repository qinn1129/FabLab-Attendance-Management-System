import React, { useState, useEffect } from "react";
import { servicesService, type ServiceOffering } from "../../services/servicesService";
import { getServiceIcon } from "../../constants/serviceIcons";

/**
 * Services overview section for the Client landing page.
 * Backed by the "services" sheet (managed via Admin > Service Offerings).
 * Only services the admin has explicitly marked "Show on Client Page" are
 * displayed here (see the `visible` flag) — the `.slice(0, 4)` below is
 * kept as a defensive cap so the layout can't ever break even if more than
 * 4 somehow end up marked visible, but Admin already enforces that limit
 * at the source.
 * Domain: Client
 * @returns {JSX.Element}
 */
export function ServicesSection() {
  const [services, setServices] = useState<ServiceOffering[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    servicesService.fetchServices().then(data => {
      const visibleOnly = data.filter(s => s.visible !== false);
      setServices(visibleOnly.slice(0, 4));
      setLoading(false);
    });
  }, []);

  if (!loading && services.length === 0) return null;

  return (
    <section className="py-16 px-6 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-violet-600 text-sm font-semibold uppercase tracking-widest mb-2">What We Offer</p>
          <h2 className="text-3xl font-bold text-gray-900">Our Services</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 animate-pulse h-32" />
            ))
          ) : (
            services.map(s => {
              const Icon = getServiceIcon(s.icon);
              return (
                <div key={s.id} className="bg-white rounded-xl p-5 border border-gray-100 hover:border-violet-200 hover:shadow-sm transition">
                  {s.image ? (
                    <div className="w-full h-20 rounded-lg overflow-hidden mb-3 bg-gray-100">
                      <img src={s.image} alt={s.title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5 text-violet-600" />
                    </div>
                  )}
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">{s.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{s.desc}</p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}