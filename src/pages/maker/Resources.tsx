import React, { useState, useEffect } from "react";
import { Check, Pin, Youtube, Link2, ChevronDown } from "lucide-react";
import { PageHeader } from "../../components/common";
import { ANNOUNCEMENTS_DATA, MODULES_DATA, FAQS_DATA } from "../../constants/mockData";
import { accountsService, type Account } from "../../services/accountsService";
import { sheetsService, type WeeklySchedule } from "../../services/sheetsService";
import { announcementsService, type Announcement } from "../../services/announcementsService";

const dayMap: Record<string, string> = {
  "Mon": "Monday",
  "Tue": "Tuesday",
  "Wed": "Wednesday",
  "Thu": "Thursday",
  "Fri": "Friday",
  "Sat": "Saturday",
  "Sun": "Sunday"
};

/**
 * Global resources view for Resident Makers.
 * Domain: Maker
 * @returns {JSX.Element}
 */
export function MakerResources() {
  const [tab, setTab] = useState<"schedule"|"announcements"|"modules"|"faq">("schedule");
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [makers, setMakers] = useState<Account[]>([]);
  const [weeklyScheds, setWeeklyScheds] = useState<WeeklySchedule[]>([]);
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

useEffect(() => {
  accountsService.fetchResidentMakers().then(setMakers);
  sheetsService.fetchWeeklySchedules().then(setWeeklyScheds);
  announcementsService.fetchAnnouncements().then(setAnnouncements);
}, []);


  useEffect(() => {
    accountsService.fetchResidentMakers().then(setMakers);
    sheetsService.fetchWeeklySchedules().then(setWeeklyScheds);
  }, []);

  return (
    <div className="p-6">
      <PageHeader title="Global Resources" sub="Schedules, announcements, and learning materials" />
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit mb-5">
        {(["schedule","announcements","modules","faq"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-md text-sm font-medium transition capitalize ${tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-card-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "schedule" && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-b border-border">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Resident Maker</th>
                {days.map(d => <th key={d} className="text-center px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {makers.map(rm => {
                const sched = weeklyScheds.find(s => s.resident_ID === rm.id);
                return (
                  <tr key={rm.id} className="border-b border-muted hover:bg-muted/50 transition">
                    <td className="px-4 py-3 font-medium text-foreground">{rm.firstName} {rm.lastName}</td>
                    {days.map(d => {
                      const fullDay = dayMap[d];
                      const val = sched ? sched[fullDay] : "";
                      const hasValue = val && val.trim() !== "";
                      return (
                        <td key={d} className="px-3 py-3 text-center">
                          {hasValue ? (
                            <div className="w-5 h-5 rounded bg-emerald-500/20 mx-auto flex items-center justify-center cursor-help" title={val}>
                              <Check className="w-3 h-3 text-emerald-500" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded bg-muted/50 mx-auto" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/*Announcements*/}
      {tab === "announcements" && (
        <div className="space-y-3">
          {announcements.map(a => (
            <div key={a.id} className={`bg-card rounded-xl border p-5 ${a.pinned ? "border-emerald-500/30" : "border-border"}`}>
              <div className="flex items-center gap-2 mb-1">
                {a.pinned && <Pin className="w-3.5 h-3.5 text-emerald-500" />}
                <h3 className="font-semibold text-card-foreground text-sm">{a.title}</h3>
                <span className="text-xs text-muted-foreground font-mono ml-auto">{a.date}</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">{a.body}</p>
            </div>
          ))}
        </div>
      )}

      {/*Modules*/}
      {tab === "modules" && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-b border-border">
                {["#","Title","Description","YouTube","GDrive"].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODULES_DATA.map((m, i) => (
                <tr key={m.id} className="border-b border-muted hover:bg-muted/50 transition">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">{m.title}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs max-w-[200px]">{m.desc}</td>
                  <td className="px-4 py-3"><a href={m.yt} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-red-500 hover:text-red-600 text-xs"><Youtube className="w-3.5 h-3.5" />Watch</a></td>
                  <td className="px-4 py-3"><a href={m.gd} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-500 hover:text-blue-600 text-xs"><Link2 className="w-3.5 h-3.5" />Open</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/*FAQ*/}
      {tab === "faq" && (
        <div className="space-y-2 max-w-2xl">
          {FAQS_DATA.map(f => (
            <div key={f.id} className="bg-card rounded-xl border border-border overflow-hidden">
              <button className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-muted/50 transition" onClick={() => setFaqOpen(faqOpen === f.id ? null : f.id)}>
                <span className="font-medium text-card-foreground text-sm">{f.q}</span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${faqOpen === f.id ? "rotate-180" : ""}`} />
              </button>
              {faqOpen === f.id && (
                <div className="px-5 pb-4 border-t border-muted">
                  <p className="text-muted-foreground text-sm leading-relaxed pt-3">{f.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
