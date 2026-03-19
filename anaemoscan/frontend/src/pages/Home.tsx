import React, { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, Activity, ArrowLeft, ArrowRight } from "lucide-react";
import { api } from "../api";

export default function Home() {
  const { patientId } = useParams<{ patientId: string }>();
  const [, setLocation] = useLocation();
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  const { data: config, isLoading: configLoading } = useQuery({ queryKey: ["config"], queryFn: api.getConfig });
  const { data: patientData } = useQuery({ queryKey: ["patient", patientId], queryFn: () => api.getPatient(Number(patientId)) });

  const mutation = useMutation({
    mutationFn: (data: any) => api.saveTest(Number(patientId), data),
    onSuccess: (data) => setLocation(`/patients/${patientId}/report/${data.id}`),
    onError: (e: any) => setError(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const allRequired = [...(config?.cbc_fields ?? []), ...(config?.biomarker_fields ?? [])].map((f: any) => f.name);
    const missing = allRequired.filter((k: string) => !values[k]);
    if (missing.length) return setError(`Missing required fields: ${missing.join(", ")}`);
    const payload: Record<string, any> = {};
    allRequired.forEach((k: string) => { payload[k] = Number(values[k]); });
    mutation.mutate(payload);
  };

  const loadDemo = () => {
    if (!config?.demo_values) return;
    setValues(Object.fromEntries(Object.entries(config.demo_values).map(([k, v]) => [k, String(v)])));
  };

  const Field = ({ name, label, unit, range, step }: any) => (
    <div>
      <label className="text-sm font-semibold text-gray-700 block mb-1">{label} <span className="text-gray-400 font-normal">({unit})</span></label>
      <input type="number" step={step} value={values[name] ?? ""} onChange={e => setValues(v => ({ ...v, [name]: e.target.value }))}
        className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition" placeholder={range} />
    </div>
  );

  if (configLoading) return <div className="p-12 text-center text-gray-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-3">
          <button onClick={() => setLocation("/")} className="p-2 hover:bg-gray-100 rounded-xl transition"><ArrowLeft size={20} className="text-gray-500" /></button>
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white"><Activity size={22} /></div>
          <div>
            <h1 className="text-xl font-bold">AnaemoScan</h1>
            <p className="text-[11px] text-gray-500 uppercase tracking-widest">Clinical Intelligence</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">Blood Analysis</h2>
            <p className="text-gray-500">Patient: <span className="font-semibold">{patientData?.patient?.name || "..."}</span></p>
          </div>
          <button type="button" onClick={loadDemo} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium">
            Load Demo Data <ArrowRight size={14} />
          </button>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-1">CBC Parameters <span className="text-red-500">*</span></h3>
            <p className="text-sm text-gray-500 mb-5">All fields required</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {(config?.cbc_fields ?? []).map((f: any) => <Field key={f.name} {...f} />)}
            </div>
          </div>

          <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-1">Biomarker Panel <span className="text-red-500">*</span></h3>
            <p className="text-sm text-gray-500 mb-5">Required for accurate anemia type classification</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {(config?.biomarker_fields ?? []).map((f: any) => <Field key={f.name} {...f} />)}
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={mutation.isPending}
              className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 disabled:opacity-60 transition flex items-center gap-2">
              {mutation.isPending ? <><Loader2 className="animate-spin" /> Processing...</> : <><Activity /> Analyze Patient Data</>}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
