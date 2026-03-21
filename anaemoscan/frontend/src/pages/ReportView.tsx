import React from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  FlaskConical, Printer, ArrowLeft, ShieldAlert, ShieldCheck,
  Stethoscope, ChevronRight, TrendingUp, TrendingDown, Minus,
  User, Calendar, Droplets, Activity, FileText, AlertTriangle,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, CartesianGrid, BarChart, Bar, Cell,
} from "recharts";
import { motion } from "framer-motion";
import { api } from "../api";

/* ── helpers ── */
function statusColor(val: number | null | undefined, min: number, max: number) {
  if (val == null) return "text-white/30";
  if (val < min) return "text-orange-300 font-bold";
  if (val > max) return "text-red-300 font-bold";
  return "text-emerald-300 font-semibold";
}
function statusLabel(val: number | null | undefined, min: number, max: number) {
  if (val == null) return "—";
  if (val < min) return "Low";
  if (val > max) return "High";
  return "Normal";
}
function barColor(val: number | null | undefined, min: number, max: number) {
  if (val == null) return "bg-white/10";
  if (val < min) return "bg-orange-400";
  if (val > max) return "bg-red-400";
  return "bg-emerald-400";
}
function barPct(val: number | null | undefined, min: number, max: number) {
  if (val == null) return 0;
  const clamped = Math.max(min * 0.5, Math.min(max * 1.5, val));
  return Math.round(((clamped - min * 0.5) / ((max - min) * 2)) * 100);
}

function CompIcon({ cur, prev }: { cur?: number | null; prev?: number | null }) {
  if (cur == null || prev == null) return <Minus size={12} className="text-white/20" />;
  if (cur > prev * 1.05) return <TrendingUp size={12} className="text-red-400" />;
  if (cur < prev * 0.95) return <TrendingDown size={12} className="text-emerald-400" />;
  return <Minus size={12} className="text-white/30" />;
}

const TYPE_CONFIG: Record<string, { gradient: string; glow: string; accent: string; badge: string }> = {
  "Iron Deficiency Anemia":        { gradient: "from-orange-500 to-amber-500",  glow: "shadow-orange-500/20", accent: "text-orange-300", badge: "bg-orange-500/15 text-orange-300 border-orange-500/20" },
  "Folate Deficiency Anemia":      { gradient: "from-purple-500 to-violet-500", glow: "shadow-purple-500/20", accent: "text-purple-300", badge: "bg-purple-500/15 text-purple-300 border-purple-500/20" },
  "Vitamin B12 Deficiency Anemia": { gradient: "from-blue-500 to-cyan-500",     glow: "shadow-blue-500/20",   accent: "text-blue-300",   badge: "bg-blue-500/15 text-blue-300 border-blue-500/20"     },
};
const NORMAL_CONFIG = { gradient: "from-emerald-500 to-teal-500", glow: "shadow-emerald-500/20", accent: "text-emerald-300", badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20" };

const RISK_BADGE: Record<string, string> = {
  "High Risk":     "bg-red-500/15 text-red-300 border-red-500/20",
  "Moderate Risk": "bg-amber-500/15 text-amber-300 border-amber-500/20",
  "Low Risk":      "bg-yellow-500/15 text-yellow-300 border-yellow-500/20",
  Normal:          "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
};

const chartTooltipStyle = { backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", fontSize: "11px", color: "#cbd5e1" };

export default function ReportView() {
  const { id, testId } = useParams<{ id: string; testId: string }>();
  const [, setLocation] = useLocation();

  const { data: config } = useQuery({ queryKey: ["config"], queryFn: api.getConfig });
  const { data, isLoading } = useQuery({
    queryKey: ["report", id, testId],
    queryFn: () => api.getReport(Number(id), Number(testId)),
  });

  if (isLoading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-white/30">
        <FlaskConical className="animate-pulse" size={28} />
        <p className="text-sm">Generating report...</p>
      </div>
    </div>
  );
  if (!data) return <div className="p-12 text-center text-red-400">Report not found.</div>;

  const { patient, current_test: ct, previous_test: pt, trend } = data;
  const isAnemic  = ct.anemia_detected;
  const typeConf  = isAnemic ? (TYPE_CONFIG[ct.anemia_type] ?? TYPE_CONFIG["Iron Deficiency Anemia"]) : NORMAL_CONFIG;
  const shapData  = [...ct.shap_features].sort((a: any, b: any) => Math.abs(b.shap_value) - Math.abs(a.shap_value));
  const allFields = [...(config?.cbc_fields ?? []), ...(config?.biomarker_fields ?? [])];
  const abnormal  = allFields.filter((f: any) => { const v = ct[f.name]; return v != null && (v < f.min || v > f.max); }).length;

  const getMed = (type: string | null | undefined) => {
    if (!type) return config?.medication_suggestions?.default ?? "";
    const s = config?.medication_suggestions ?? {};
    if (type.includes("Iron"))   return s.Iron          ?? s.default ?? "";
    if (type.includes("B12"))    return s["Vitamin B12"] ?? s.default ?? "";
    if (type.includes("Folate")) return s.Folate         ?? s.default ?? "";
    return s.default ?? "";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white pb-16">

      {/* Background */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
      <div className="fixed top-0 right-1/4 w-[500px] h-[500px] bg-blue-600/8 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-1/4 w-[400px] h-[400px] bg-indigo-600/8 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/60 backdrop-blur-xl border-b border-white/5 print:hidden">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setLocation("/")} className="p-2 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/10 transition">
              <ArrowLeft size={16} />
            </button>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <FlaskConical size={15} className="text-white" />
            </div>
            <span className="font-bold tracking-tight">AnaemoScan Report</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setLocation(`/patients/${id}/history`)}
              className="px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold text-white/50 hover:text-white/80 hover:bg-white/10 transition">
              History
            </button>
            <button onClick={() => setLocation(`/analyze/${id}`)}
              className="px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold text-white/50 hover:text-white/80 hover:bg-white/10 transition">
              New Test
            </button>
            <button onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-blue-600/20">
              <Printer size={13} /> Print
            </button>
          </div>
        </div>
      </header>

      <main className="relative max-w-4xl mx-auto px-6 py-8 space-y-4">

        {/* Patient + Diagnosis row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Patient card */}
          <div className="bg-white/4 border border-white/8 rounded-2xl p-5 backdrop-blur-sm">
            <p className="text-[9px] font-bold text-white/25 uppercase tracking-widest mb-3">Patient</p>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-lg shadow-blue-500/20">
                {patient.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-white">{patient.name}</p>
                <p className="text-[10px] text-white/30 font-mono">#{patient.id}</p>
              </div>
            </div>
            <div className="space-y-1.5 text-xs text-white/40">
              <div className="flex items-center gap-2"><User size={11} className="text-white/20" /> {patient.age}y • {patient.gender}</div>
              {patient.blood_group && <div className="flex items-center gap-2"><Droplets size={11} className="text-white/20" /> {patient.blood_group}</div>}
              <div className="flex items-center gap-2"><Calendar size={11} className="text-white/20" /> {new Date(ct.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</div>
            </div>
            {abnormal > 0 && (
              <div className="mt-4 flex items-center gap-2 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <AlertTriangle size={12} className="text-amber-400 flex-shrink-0" />
                <p className="text-[10px] text-amber-300 font-semibold">{abnormal} abnormal parameter{abnormal > 1 ? "s" : ""}</p>
              </div>
            )}
          </div>

          {/* Diagnosis banner */}
          <div className={`md:col-span-2 relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br ${typeConf.gradient} shadow-2xl ${typeConf.glow}`}>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10">
              {isAnemic ? <ShieldAlert size={110} /> : <ShieldCheck size={110} />}
            </div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${RISK_BADGE[ct.risk_level] ?? "bg-white/20 text-white border-white/30"}`}>
                  {ct.risk_level}
                </span>
              </div>
              <h2 className="text-2xl font-extrabold mb-1 tracking-tight">
                {isAnemic ? "Anemia Detected" : "No Anemia Detected"}
              </h2>
              {isAnemic && <p className="text-base font-semibold opacity-90 mb-3">{ct.anemia_type}</p>}
              <p className="text-sm opacity-75 leading-relaxed mb-4 max-w-lg">{ct.summary}</p>

              {/* Confidence */}
              <div className="bg-black/20 rounded-xl p-3 inline-block">
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mb-1.5">AI Confidence</p>
                <div className="flex items-center gap-3">
                  <div className="w-28 h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-white rounded-full"
                      initial={{ width: 0 }} animate={{ width: `${ct.detection_probability * 100}%` }}
                      transition={{ duration: 0.9, delay: 0.3, ease: "easeOut" }} />
                  </div>
                  <span className="text-lg font-bold">{(ct.detection_probability * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Comparison */}
        {pt && (
          <div className="bg-white/4 border border-white/8 rounded-2xl p-5 backdrop-blur-sm">
            <p className="text-[9px] font-bold text-white/25 uppercase tracking-widest mb-4">Comparison with Previous Test</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {["HGB", "RBC", "MCV", "MCH", "MCHC", "RDW"].map(p => (
                <div key={p} className="bg-white/4 border border-white/8 rounded-xl p-3 text-center">
                  <p className="text-[9px] text-white/30 font-bold uppercase mb-1">{p}</p>
                  <div className="flex justify-center items-center gap-1">
                    <span className="font-bold text-white/80 text-sm">{(ct[p] as number)?.toFixed(1)}</span>
                    <CompIcon cur={ct[p] as number} prev={pt[p] as number} />
                  </div>
                  <p className="text-[9px] text-white/20 mt-1">prev {(pt[p] as number)?.toFixed(1)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trend chart */}
        {trend.length > 1 && (
          <div className="bg-white/4 border border-white/8 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-bold text-white text-sm">Hemoglobin Trend</p>
                <p className="text-[10px] text-white/30">{trend.length} tests over time</p>
              </div>
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={v => new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    tick={{ fontSize: 10, fill: "rgba(255,255,255,0.25)" }} axisLine={false} tickLine={false} />
                  <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "rgba(255,255,255,0.25)" }} axisLine={false} tickLine={false} />
                  <Tooltip labelFormatter={v => new Date(v).toLocaleDateString()} contentStyle={chartTooltipStyle} />
                  <ReferenceLine y={patient.gender === "Female" ? 12 : 13.5} stroke="rgba(248,113,113,0.4)" strokeDasharray="5 5" strokeWidth={1.5} />
                  <Line type="monotone" dataKey="HGB" stroke="#60a5fa" strokeWidth={2.5}
                    dot={{ r: 4, fill: "#60a5fa", strokeWidth: 0 }} activeDot={{ r: 6, fill: "#93c5fd" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* CBC Table */}
        <div className="bg-white/4 border border-white/8 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="px-5 py-4 border-b border-white/5">
            <p className="font-bold text-white text-sm">Blood Parameters</p>
            <p className="text-[10px] text-white/30">Complete blood count & biomarker results</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-[9px] uppercase text-white/25 font-bold tracking-widest">
                  <th className="px-5 py-3 text-left">Parameter</th>
                  <th className="px-5 py-3 text-left">Result</th>
                  <th className="px-5 py-3 text-left hidden sm:table-cell">Range</th>
                  <th className="px-5 py-3 text-left">Visual</th>
                  <th className="px-5 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {allFields.map((info: any) => {
                  const val = ct[info.name] as number | null | undefined;
                  if (val == null) return null;
                  const label = statusLabel(val, info.min, info.max);
                  return (
                    <tr key={info.name} className="border-b border-white/4 hover:bg-white/3 transition">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-white/70 text-xs">{info.label}</p>
                        <p className="text-[9px] text-white/25 font-mono">{info.name} · {info.unit}</p>
                      </td>
                      <td className={`px-5 py-3 font-bold font-mono text-sm ${statusColor(val, info.min, info.max)}`}>
                        {val.toFixed(2)}
                      </td>
                      <td className="px-5 py-3 text-[10px] text-white/25 hidden sm:table-cell font-mono">{info.min} – {info.max}</td>
                      <td className="px-5 py-3 w-24">
                        <div className="w-full h-1 bg-white/8 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${barColor(val, info.min, info.max)}`}
                            style={{ width: `${barPct(val, info.min, info.max)}%` }} />
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold
                          ${label === "Normal" ? "bg-emerald-500/15 text-emerald-300" :
                            label === "Low"    ? "bg-orange-500/15 text-orange-300" :
                                                 "bg-red-500/15 text-red-300"}`}>
                          {label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recommendations + SHAP */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Recommendations */}
          <div className="bg-white/4 border border-white/8 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${typeConf.gradient} flex items-center justify-center flex-shrink-0`}>
                <Stethoscope size={13} className="text-white" />
              </div>
              <p className="font-bold text-white text-sm">Clinical Recommendations</p>
            </div>
            <ul className="space-y-2.5 mb-5">
              {ct.recommendations.map((rec: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-xs text-white/55 leading-relaxed">
                  <ChevronRight size={13} className={`flex-shrink-0 mt-0.5 ${typeConf.accent}`} />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>

            {/* Medication */}
            <div className="bg-white/4 border border-white/8 rounded-xl p-4">
              <p className="text-[10px] font-bold text-white/50 mb-1.5 flex items-center gap-1.5">
                <FileText size={11} /> Suggested Pharmacotherapy
              </p>
              <p className="text-xs text-white/45 leading-relaxed mb-2">{getMed(ct.anemia_type)}</p>
              <p className="text-[9px] text-red-400/70 font-bold uppercase tracking-wider">
                ⚠ Reference only — follow physician's prescription
              </p>
            </div>
          </div>

          {/* SHAP chart */}
          <div className="bg-white/4 border border-white/8 rounded-2xl p-5 backdrop-blur-sm">
            <p className="font-bold text-white text-sm mb-1">AI Feature Impact</p>
            <p className="text-[10px] text-white/30 mb-4">Parameters that most influenced the prediction</p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={shapData.slice(0, 8)} layout="vertical" margin={{ top: 0, right: 10, left: 35, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="feature" type="category" axisLine={false} tickLine={false}
                    tick={{ fontSize: 10, fill: "rgba(255,255,255,0.35)", fontWeight: 600 }} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <ReferenceLine x={0} stroke="rgba(255,255,255,0.08)" />
                  <Bar dataKey="shap_value" radius={[0, 4, 4, 0]} barSize={11}>
                    {shapData.slice(0, 8).map((entry: any, i: number) => (
                      <Cell key={i} fill={entry.shap_value > 0 ? "#f97316" : "#34d399"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-5 mt-2 text-[9px] font-semibold text-white/25">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Reduces risk</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" /> Increases risk</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/5 text-center">
          <p className="text-[10px] font-bold text-white/20">AnaemoScan Clinical Intelligence System</p>
          <p className="text-[9px] text-white/15 mt-1">For clinical use only — Not a substitute for physician judgment · {new Date().toLocaleString()}</p>
        </div>
      </main>
    </div>
  );
}
