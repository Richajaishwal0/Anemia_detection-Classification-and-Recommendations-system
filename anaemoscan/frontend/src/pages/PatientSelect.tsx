import React, { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, User, Calendar, Activity, ChevronRight, ActivitySquare } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "../api";

export default function PatientSelect() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ name: "", age: "", gender: "Male", blood_group: "", contact: "" });
  const [error, setError] = useState("");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["patients", search],
    queryFn: () => api.getPatients(search),
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => api.createPatient(d),
    onSuccess: (patient) => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      setIsOpen(false);
      setLocation(`/analyze/${patient.id}`);
    },
    onError: (e: any) => setError(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.age || !form.gender) return setError("Name, age and gender are required");
    createMutation.mutate({ ...form, age: Number(form.age) });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
            <Activity size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">AnaemoScan</h1>
            <p className="text-[11px] text-gray-500 uppercase tracking-widest">Clinical Intelligence</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900">Patient Selection</h2>
            <p className="text-gray-500">Select a patient or create a new one</p>
          </div>
          <button onClick={() => setIsOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition">
            <Plus size={18} /> New Patient
          </button>
        </div>

        {isOpen && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
              <h3 className="text-xl font-bold mb-4">New Patient Profile</h3>
              {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold block mb-1">Full Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-4 py-2.5 border rounded-xl" placeholder="John Doe" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold block mb-1">Age *</label>
                    <input type="number" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} className="w-full px-4 py-2.5 border rounded-xl" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold block mb-1">Gender *</label>
                    <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))} className="w-full px-4 py-2.5 border rounded-xl">
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold block mb-1">Blood Group</label>
                    <select value={form.blood_group} onChange={e => setForm(f => ({ ...f, blood_group: e.target.value }))} className="w-full px-4 py-2.5 border rounded-xl">
                      <option value="">Unknown</option>
                      {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(g => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold block mb-1">Contact</label>
                    <input value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} className="w-full px-4 py-2.5 border rounded-xl" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 border rounded-xl">Cancel</button>
                  <button type="submit" disabled={createMutation.isPending} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-60">
                    {createMutation.isPending ? "Saving..." : "Create Patient"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="mb-6 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input type="text" placeholder="Search patients by name..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border rounded-2xl text-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition" />
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12 text-gray-400 flex flex-col items-center gap-2">
              <ActivitySquare className="animate-pulse" size={32} /> Loading patients...
            </div>
          ) : (data?.patients ?? []).length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed">
              <User size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold">No patients found</h3>
              <p className="text-gray-500">Create a new patient to get started.</p>
            </div>
          ) : (
            (data?.patients ?? []).map((patient: any) => (
              <motion.div key={patient.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-lg font-bold">
                    {patient.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{patient.name}</h3>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-500 mt-1">
                      <span className="flex items-center gap-1"><User size={13} /> {patient.age}y • {patient.gender}</span>
                      {patient.last_test_date && <span className="flex items-center gap-1"><Calendar size={13} /> {new Date(patient.last_test_date).toLocaleDateString()}</span>}
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-semibold">{patient.test_count} Tests</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 justify-end">
                  {patient.last_diagnosis && (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${patient.last_diagnosis === "Normal" ? "bg-green-50 text-green-600 border-green-200" : "bg-red-50 text-red-600 border-red-200"}`}>
                      {patient.last_diagnosis}
                    </span>
                  )}
                  <button onClick={() => setLocation(`/patients/${patient.id}/history`)} className="px-4 py-2 border rounded-xl text-sm font-semibold hover:bg-gray-50 transition">History</button>
                  <button onClick={() => setLocation(`/analyze/${patient.id}`)} className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
                    New Analysis <ChevronRight size={15} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
