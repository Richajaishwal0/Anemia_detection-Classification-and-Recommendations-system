import React from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText, User, Calendar, Activity, FlaskConical, TrendingUp, Loader2, Droplets } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "../api";

const TYPE_BADGE: Record<string, string> = {
  Normal:                          "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  "Iron Deficiency Anemia":        "bg-orange-500/15 text-orange-300 border-orange-500/20",
  "Folate Deficiency Anemia":      "bg-purple-500/15 text-purple-300 border-purple-500/20",
  "Vitamin B12 Deficiency Anemia": "bg-blue-500/15 text-blue-300 border-blue-500/20",
};

const RISK_BADGE: Record<string, string> = {
  "High Risk":     "bg-red-500/15 text-red-300",
  "Moderate Risk": "bg-amber-500/15 text-amber-300",
  "Low Risk":      "bg-yellow-500/15 text-yellow-300",
  Normal:          "bg-emerald-500/15 text-emerald-300",
};

export default function PatientHistory() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  const { data, isLoading } = useQuery({ queryKey: ["patient", id], queryFn: () => api.getPatient(Number(id)) });

  if (isLoading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-white/30">
        <Loader2 className="animate-spin" size={28} />
        <p className="text-sm">Loading history...</p>
      </div>
    </div>
  );
  if (!data) return <div className="p-12 text-center text-red-400">Patient not found.</div>;

  const { patient, tests } = data;
  const sortedTests  = [...tests].reverse();
  const anemicTests  = tests.filter((t: any) => t.anemia_detected).length;
  const avgHGB       = tests.length ? (tests.reduce((s: number, t: any) => s + t.HGB, 0) / tests.length).toFixed(1) : "—";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">

      {/* Background */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
      <div className="fixed top-0 left-1/3 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/60 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setLocation("/")} className="p-2 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/10 transition">
              <ArrowLeft size={16} />
            </button>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <FlaskConical size={15} className="text-white" />
            </div>
            <span className="font-bold tracking-tight">Patient History</span>
          </div>
          <button onClick={() => setLocation(`/analyze/${patient.id}`)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold active:scale-95 transition-all shadow-lg shadow-blue-600/20">
            <Activity size={14} /> New Analysis
          </button>
        </div>
      </header>

      <main className="relative max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* Patient card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white/4 border border-white/8 rounded-3xl p-6 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/20">
                {patient.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{patient.name}</h2>
                <div className="flex flex-wrap gap-3 text-xs text-white/35 mt-1.5">
                  <span className="flex items-center gap-1"><User size={11} /> {patient.age}y, {patient.gender}</span>
                  {patient.blood_group && <span className="flex items-center gap-1"><Droplets size={11} /> {patient.blood_group}</span>}
                  <span className="flex items-center gap-1"><Calendar size={11} /> Since {new Date(patient.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-3 flex-wrap">
              {[
                { label: "Tests",        value: tests.length,  icon: <FileText size={13} />,   color: "text-blue-400 bg-blue-500/10 border-blue-500/20"    },
                { label: "Anemia",       value: anemicTests,   icon: <Activity size={13} />,   color: "text-red-400 bg-red-500/10 border-red-500/20"       },
                { label: "Avg HGB",      value: avgHGB,        icon: <TrendingUp size={13} />, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
              ].map(s => (
                <div key={s.label} className={`border rounded-2xl px-4 py-3 text-center min-w-[72px] ${s.color}`}>
                  <div className="flex justify-center mb-1">{s.icon}</div>
                  <div className="text-xl font-bold text-white">{s.value}</div>
                  <div className="text-[9px] font-bold uppercase tracking-wider mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Test records */}
        <div>
          <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-4">Test Records</p>

          {tests.length === 0 ? (
            <div className="text-center py-20 bg-white/3 border border-white/8 rounded-3xl backdrop-blur-sm">
              <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText size={22} className="text-white/25" />
              </div>
              <h3 className="font-bold text-white/60 mb-1">No tests yet</h3>
              <p className="text-white/30 text-sm mb-5">Run an analysis to see results here.</p>
              <button onClick={() => setLocation(`/analyze/${patient.id}`)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-blue-600/20">
                <Activity size={14} /> Start Analysis
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {sortedTests.map((test: any, i: number) => (
                <motion.div key={test.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="bg-white/4 border border-white/8 hover:border-white/15 hover:bg-white/6 rounded-2xl p-4 transition-all backdrop-blur-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${test.anemia_detected ? "bg-red-500/10 border border-red-500/20" : "bg-emerald-500/10 border border-emerald-500/20"}`}>
                        <Activity size={15} className={test.anemia_detected ? "text-red-400" : "text-emerald-400"} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${TYPE_BADGE[test.anemia_detected ? test.anemia_type || "Anemia" : "Normal"] ?? "bg-red-500/15 text-red-300 border-red-500/20"}`}>
                            {test.anemia_detected ? test.anemia_type || "Anemia Detected" : "Normal"}
                          </span>
                          {test.anemia_detected && (
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${RISK_BADGE[test.risk_level] ?? "bg-white/10 text-white/40"}`}>
                              {test.risk_level}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-white/25 mt-1">
                          {new Date(test.created_at).toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
                          {" · "}
                          {new Date(test.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-5">
                      {[
                        { label: "HGB",     value: test.HGB?.toFixed(1) },
                        { label: "RBC",     value: test.RBC?.toFixed(2) },
                        { label: "MCV",     value: test.MCV?.toFixed(1) },
                        { label: "Ferritin",value: test.FERRITTE?.toFixed(1) ?? "—" },
                      ].map(v => (
                        <div key={v.label} className="text-center">
                          <p className="text-[9px] text-white/25 font-bold uppercase tracking-wider">{v.label}</p>
                          <p className="text-sm font-bold text-white/70 font-mono">{v.value}</p>
                        </div>
                      ))}
                      <button onClick={() => setLocation(`/patients/${patient.id}/report/${test.id}`)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-300 hover:bg-blue-500/20 rounded-xl text-xs font-bold transition ml-1">
                        <FileText size={12} /> Report
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
