import React, { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search, Plus, User, Calendar, ChevronRight, Loader2,
  FlaskConical, Users, ClipboardList, Activity, X, LogOut,
  Droplets, AlertCircle, CheckCircle2, Microscope, Shield,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../api";
import { useAuth } from "../auth";

const TYPE_DOT: Record<string, string> = {
  Normal:                          "bg-emerald-400",
  "Iron Deficiency Anemia":        "bg-orange-400",
  "Folate Deficiency Anemia":      "bg-purple-400",
  "Vitamin B12 Deficiency Anemia": "bg-blue-400",
};

const TYPE_BADGE: Record<string, string> = {
  Normal:                          "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  "Iron Deficiency Anemia":        "bg-orange-500/15 text-orange-300 border-orange-500/20",
  "Folate Deficiency Anemia":      "bg-purple-500/15 text-purple-300 border-purple-500/20",
  "Vitamin B12 Deficiency Anemia": "bg-blue-500/15 text-blue-300 border-blue-500/20",
};

function badgeClass(d: string | null) {
  if (!d) return "bg-white/5 text-white/30 border-white/10";
  return TYPE_BADGE[d] ?? "bg-red-500/15 text-red-300 border-red-500/20";
}

function InputField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition";
const selectCls = inputCls + " appearance-none [&>option]:bg-slate-900 [&>option]:text-white";

export default function PatientSelect() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ name: "", age: "", gender: "Male", blood_group: "", contact: "", email: "" });
  const [formError, setFormError] = useState("");
  const qc = useQueryClient();
  const { logout, profile } = useAuth();

  const { data, isLoading } = useQuery({ queryKey: ["patients", search], queryFn: () => api.getPatients(search) });
  const patients = data?.patients ?? [];
  const totalTests  = patients.reduce((s: number, p: any) => s + (p.test_count || 0), 0);
  const anemicCount = patients.filter((p: any) => p.last_diagnosis && p.last_diagnosis !== "Normal").length;
  const normalCount = patients.filter((p: any) => p.last_diagnosis === "Normal").length;

  const createMutation = useMutation({
    mutationFn: (d: any) => api.createPatient(d),
    onSuccess: (patient) => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      setIsOpen(false);
      setLocation(`/analyze/${patient.id}`);
    },
    onError: (e: any) => setFormError(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.age || !form.gender) return setFormError("Name, age and gender are required");
    createMutation.mutate({ ...form, age: Number(form.age) });
  };

  const openModal = () => {
    setFormError("");
    setForm({ name: "", age: "", gender: "Male", blood_group: "", contact: "", email: "" });
    setIsOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">

      {/* Background grid */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "40px 40px" }} />

      {/* Glow blobs */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/60 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <FlaskConical size={17} className="text-white" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight">AnaemoScan</span>
              <span className="ml-2 text-[9px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest">Clinical AI</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {profile?.role === "admin" && (
              <button onClick={() => setLocation("/admin")}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 hover:bg-yellow-500/20 rounded-xl text-xs font-semibold transition">
                <Shield size={13} /> Admin
              </button>
            )}
            <button onClick={openModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold active:scale-95 transition-all shadow-lg shadow-blue-600/20">
              <Plus size={15} /> New Patient
            </button>
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-white/70">{profile?.name}</p>
                <p className="text-[10px] text-white/30 capitalize">{profile?.role}</p>
              </div>
              <button onClick={logout} title="Sign out"
                className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition">
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto px-6 py-10">

        {/* Hero section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="mb-10">
          <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-3">Anemia Detection & Classification</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-white via-blue-100 to-blue-300 bg-clip-text text-transparent">
            Patient Dashboard
          </h1>
          <p className="text-white/40 text-sm max-w-lg leading-relaxed">
            AI-powered CBC analysis to detect and classify Iron, Folate, and Vitamin B12 deficiency anemia with clinical-grade accuracy.
          </p>
        </motion.div>

        {/* Stats cards */}
        {!isLoading && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { icon: <Users size={18} />,       label: "Total Patients", value: patients.length,  color: "from-blue-500/20 to-blue-600/10",    border: "border-blue-500/20",   text: "text-blue-300"    },
              { icon: <ClipboardList size={18} />, label: "Total Tests",   value: totalTests,        color: "from-indigo-500/20 to-indigo-600/10", border: "border-indigo-500/20", text: "text-indigo-300"  },
              { icon: <Activity size={18} />,     label: "Anemia Cases",  value: anemicCount,       color: "from-red-500/20 to-red-600/10",       border: "border-red-500/20",    text: "text-red-300"     },
              { icon: <CheckCircle2 size={18} />, label: "Normal",        value: normalCount,       color: "from-emerald-500/20 to-emerald-600/10",border: "border-emerald-500/20",text: "text-emerald-300" },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}
                className={`bg-gradient-to-br ${s.color} border ${s.border} rounded-2xl p-4 backdrop-blur-sm`}>
                <div className={`${s.text} mb-2`}>{s.icon}</div>
                <div className="text-3xl font-extrabold text-white">{s.value}</div>
                <div className={`text-xs font-semibold mt-0.5 ${s.text}`}>{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Search bar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" size={16} />
          <input
            type="text" placeholder="Search patients by name..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition backdrop-blur-sm"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition">
              <X size={14} />
            </button>
          )}
        </motion.div>

        {/* Results label */}
        {!isLoading && patients.length > 0 && (
          <p className="text-white/30 text-xs font-semibold mb-3 uppercase tracking-wider">
            {search ? `${patients.length} result${patients.length !== 1 ? "s" : ""} for "${search}"` : `${patients.length} patient${patients.length !== 1 ? "s" : ""}`}
          </p>
        )}

        {/* Patient list */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 text-white/30">
            <Loader2 className="animate-spin mb-3" size={28} />
            <p className="text-sm">Loading patients...</p>
          </div>
        ) : patients.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-24 bg-white/3 border border-white/8 rounded-3xl backdrop-blur-sm">
            <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <User size={26} className="text-white/25" />
            </div>
            <h3 className="text-lg font-bold text-white/70 mb-1">{search ? "No patients found" : "No patients yet"}</h3>
            <p className="text-white/30 text-sm mb-6">
              {search ? `No results for "${search}"` : "Create your first patient to get started."}
            </p>
            {!search && (
              <button onClick={openModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-blue-600/20">
                <Plus size={15} /> Create Patient
              </button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-2.5">
            <AnimatePresence>
              {patients.map((patient: any, i: number) => (
                <motion.div key={patient.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="group bg-white/4 hover:bg-white/7 border border-white/8 hover:border-white/15 rounded-2xl p-4 sm:p-5 transition-all backdrop-blur-sm cursor-default"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left: avatar + info */}
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-blue-500/20">
                          {patient.name.charAt(0).toUpperCase()}
                        </div>
                        {patient.last_diagnosis && (
                          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${TYPE_DOT[patient.last_diagnosis] ?? "bg-red-400"}`} />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-white">{patient.name}</h3>
                          <span className="text-[10px] text-white/25 font-mono">#{patient.id}</span>
                          {patient.last_diagnosis && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeClass(patient.last_diagnosis)}`}>
                              {patient.last_diagnosis}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-white/35 mt-1.5">
                          <span className="flex items-center gap-1"><User size={10} /> {patient.age}y • {patient.gender}</span>
                          {patient.blood_group && (
                            <span className="flex items-center gap-1"><Droplets size={10} /> {patient.blood_group}</span>
                          )}
                          {patient.last_test_date && (
                            <span className="flex items-center gap-1">
                              <Calendar size={10} /> {new Date(patient.last_test_date).toLocaleDateString()}
                            </span>
                          )}
                          <span className="bg-white/8 px-2 py-0.5 rounded-full font-semibold text-white/40">
                            {patient.test_count} test{patient.test_count !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => setLocation(`/patients/${patient.id}/history`)}
                        className="px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold text-white/50 hover:text-white/80 hover:bg-white/10 hover:border-white/20 transition">
                        History
                      </button>
                      <button onClick={() => setLocation(`/analyze/${patient.id}`)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold active:scale-95 transition-all shadow-md shadow-blue-600/20">
                        Analyze <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-white/15 text-[10px] uppercase tracking-widest mt-12">
          AnaemoScan v1.0 · Clinical AI System · Authorized Access Only
        </p>
      </main>

      {/* Create Patient Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-slate-900/90 border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl backdrop-blur-xl">

              {/* Modal header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Microscope size={16} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">New Patient</h3>
                    <p className="text-[11px] text-white/35">Fill in the patient details</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)}
                  className="p-2 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/10 transition">
                  <X size={15} />
                </button>
              </div>

              {formError && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                  className="mb-4 flex items-center gap-2.5 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                  <p className="text-red-300 text-sm">{formError}</p>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <InputField label="Full Name *">
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className={inputCls} placeholder="e.g. Jane Smith" />
                </InputField>

                <div className="grid grid-cols-2 gap-3">
                  <InputField label="Age *">
                    <input type="number" min="1" max="120" value={form.age}
                      onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                      className={inputCls} placeholder="25" />
                  </InputField>
                  <InputField label="Gender *">
                    <div className="relative">
                      <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                        className={selectCls + " pr-8"}>
                        <option className="bg-slate-900 text-white">Male</option>
                        <option className="bg-slate-900 text-white">Female</option>
                        <option className="bg-slate-900 text-white">Other</option>
                      </select>
                      <ChevronRight size={12} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-white/30 pointer-events-none" />
                    </div>
                  </InputField>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <InputField label="Blood Group">
                    <div className="relative">
                      <select value={form.blood_group} onChange={e => setForm(f => ({ ...f, blood_group: e.target.value }))}
                        className={selectCls + " pr-8"}>
                        <option value="" className="bg-slate-900 text-white">Unknown</option>
                        {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(g => <option key={g} className="bg-slate-900 text-white">{g}</option>)}
                      </select>
                      <ChevronRight size={12} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-white/30 pointer-events-none" />
                    </div>
                  </InputField>
                  <InputField label="Contact">
                    <input value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
                      className={inputCls} placeholder="+1 234 567 8900" />
                  </InputField>
                </div>

                <InputField label="Email">
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className={inputCls} placeholder="patient@email.com" />
                </InputField>

                {/* Divider */}
                <div className="h-px bg-white/8 my-1" />

                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsOpen(false)}
                    className="flex-1 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold text-white/50 hover:text-white/80 hover:bg-white/10 transition">
                    Cancel
                  </button>
                  <button type="submit" disabled={createMutation.isPending}
                    className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2">
                    {createMutation.isPending
                      ? <><Loader2 size={14} className="animate-spin" /> Saving...</>
                      : "Create & Analyze"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
