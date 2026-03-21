import React, { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, FlaskConical, ArrowLeft, ChevronDown, Microscope, Dna, Beaker, AlertCircle, CheckCircle2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../api";

const DEMO_DOT: Record<string, string> = {
  iron:   "bg-orange-400",
  folate: "bg-purple-400",
  b12:    "bg-blue-400",
};

function FieldInput({ name, label, unit, range, step, min, max, value, onChange }: any) {
  const num = parseFloat(value);
  const hasValue = value !== "" && !isNaN(num);
  const isLow  = hasValue && num < min;
  const isHigh = hasValue && num > max;
  const isOk   = hasValue && !isLow && !isHigh;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{label}</label>
        <span className="text-[9px] text-white/20 font-mono">{range} {unit}</span>
      </div>
      <div className="relative">
        <input
          type="number" step={step} value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={range}
          className={`w-full px-3.5 py-2.5 pr-9 rounded-xl text-sm font-mono border focus:outline-none focus:ring-2 transition
            ${isLow  ? "bg-orange-500/10 border-orange-500/30 text-orange-200 focus:ring-orange-500/20" :
              isHigh ? "bg-red-500/10 border-red-500/30 text-red-200 focus:ring-red-500/20" :
              isOk   ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200 focus:ring-emerald-500/20" :
                       "bg-white/5 border-white/10 text-white placeholder-white/20 focus:ring-blue-500/30 focus:border-blue-500/30"}`}
        />
        {hasValue && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isOk   ? <CheckCircle2 size={13} className="text-emerald-400" /> :
             isLow  ? <AlertCircle  size={13} className="text-orange-400" /> :
                      <AlertCircle  size={13} className="text-red-400" />}
          </div>
        )}
      </div>
      {hasValue && (isLow || isHigh) && (
        <p className={`text-[9px] mt-1 font-semibold ${isLow ? "text-orange-400" : "text-red-400"}`}>
          {isLow ? `↓ Below normal (min ${min})` : `↑ Above normal (max ${max})`}
        </p>
      )}
    </div>
  );
}

export default function Home() {
  const { patientId } = useParams<{ patientId: string }>();
  const [, setLocation] = useLocation();
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [demoOpen, setDemoOpen] = useState(false);

  const { data: config, isLoading: configLoading } = useQuery({ queryKey: ["config"], queryFn: api.getConfig });
  const { data: patientData } = useQuery({ queryKey: ["patient", patientId], queryFn: () => api.getPatient(Number(patientId)) });

  const mutation = useMutation({
    mutationFn: (data: any) => api.saveTest(Number(patientId), data),
    onSuccess: (data) => setLocation(`/patients/${patientId}/report/${data.id}`),
    onError: (e: any) => setError(e.message),
  });

  const allFields = [...(config?.cbc_fields ?? []), ...(config?.biomarker_fields ?? [])];
  const filledCount = allFields.filter((f: any) => values[f.name] !== undefined && values[f.name] !== "").length;
  const progress = allFields.length > 0 ? Math.round((filledCount / allFields.length) * 100) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const missing = allFields.filter((f: any) => !values[f.name]).map((f: any) => f.label);
    if (missing.length) return setError(`Missing: ${missing.join(", ")}`);
    const payload: Record<string, any> = {};
    allFields.forEach((f: any) => { payload[f.name] = Number(values[f.name]); });
    mutation.mutate(payload);
  };

  const loadDemo = (key: string) => {
    const demo = config?.demo_values?.[key];
    if (!demo) return;
    const { label: _l, ...vals } = demo;
    setValues(Object.fromEntries(Object.entries(vals).map(([k, v]) => [k, String(v)])));
    setDemoOpen(false);
  };

  const setVal = (name: string) => (v: string) => setValues(prev => ({ ...prev, [name]: v }));

  if (configLoading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-white/30">
        <Loader2 className="animate-spin" size={28} />
        <p className="text-sm">Loading configuration...</p>
      </div>
    </div>
  );

  const demoScenarios = Object.entries(config?.demo_values ?? {}) as [string, any][];
  const patient = patientData?.patient;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">

      {/* Background */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
      <div className="fixed top-0 right-1/3 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-1/3 w-[300px] h-[300px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/60 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setLocation("/")} className="p-2 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/10 transition">
              <ArrowLeft size={16} />
            </button>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <FlaskConical size={15} className="text-white" />
            </div>
            <span className="font-bold tracking-tight">AnaemoScan</span>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2.5">
              <div className="w-28 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div className="h-full bg-blue-500 rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
              </div>
              <span className="text-[11px] text-white/30 font-semibold">{filledCount}/{allFields.length}</span>
            </div>

            {/* Demo dropdown */}
            <div className="relative">
              <button type="button" onClick={() => setDemoOpen(o => !o)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold text-white/50 hover:text-white/80 hover:bg-white/10 transition">
                <Beaker size={13} /> Demo <ChevronDown size={11} />
              </button>
              <AnimatePresence>
                {demoOpen && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    className="absolute right-0 mt-1.5 w-56 bg-slate-900/95 border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden backdrop-blur-xl">
                    <div className="px-4 py-2.5 border-b border-white/5">
                      <p className="text-[9px] font-bold text-white/25 uppercase tracking-widest">Load Demo Scenario</p>
                    </div>
                    {demoScenarios.map(([key, demo]) => (
                      <button key={key} type="button" onClick={() => loadDemo(key)}
                        className="w-full text-left px-4 py-3 hover:bg-white/5 transition flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${DEMO_DOT[key] ?? "bg-white/30"}`} />
                        <div>
                          <p className="text-sm font-semibold text-white/80">{demo.label}</p>
                          <p className="text-[9px] text-white/25 mt-0.5 font-mono">HGB {demo.HGB} · MCV {demo.MCV} · Ferritin {demo.FERRITTE}</p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-4xl mx-auto px-6 py-8">

        {/* Patient banner */}
        {patient && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white/4 border border-white/8 rounded-2xl p-4 mb-6 flex items-center gap-4 backdrop-blur-sm">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg shadow-blue-500/20">
              {patient.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-white">{patient.name}</p>
              <p className="text-xs text-white/35">{patient.age}y • {patient.gender}{patient.blood_group ? ` • ${patient.blood_group}` : ""}</p>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3.5 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl text-sm flex items-start gap-2">
            <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* CBC Panel */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white/4 border border-white/8 rounded-2xl overflow-hidden backdrop-blur-sm">
            <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500/15 border border-blue-500/20 rounded-xl flex items-center justify-center">
                <Microscope size={15} className="text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Complete Blood Count</h3>
                <p className="text-[10px] text-white/30">10 required parameters</p>
              </div>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(config?.cbc_fields ?? []).map((f: any) => (
                <FieldInput key={f.name} {...f} value={values[f.name] ?? ""} onChange={setVal(f.name)} />
              ))}
            </div>
          </motion.div>

          {/* Biomarker Panel */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-white/4 border border-white/8 rounded-2xl overflow-hidden backdrop-blur-sm">
            <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-500/15 border border-purple-500/20 rounded-xl flex items-center justify-center">
                <Dna size={15} className="text-purple-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Biomarker Panel</h3>
                <p className="text-[10px] text-white/30">Iron · Folate · Vitamin B12</p>
              </div>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(config?.biomarker_fields ?? []).map((f: any) => (
                <FieldInput key={f.name} {...f} value={values[f.name] ?? ""} onChange={setVal(f.name)} />
              ))}
            </div>
          </motion.div>

          {/* Submit */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="flex items-center justify-between pt-1">
            <div className="sm:hidden">
              <div className="w-20 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-[10px] text-white/25 mt-1">{filledCount}/{allFields.length} filled</p>
            </div>
            <button type="submit" disabled={mutation.isPending}
              className="ml-auto flex items-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-bold text-sm disabled:opacity-50 active:scale-95 transition-all shadow-xl shadow-blue-600/20">
              {mutation.isPending
                ? <><Loader2 size={15} className="animate-spin" /> Analyzing...</>
                : <><FlaskConical size={15} /> Run Analysis</>}
            </button>
          </motion.div>
        </form>
      </main>
    </div>
  );
}
