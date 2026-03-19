import React from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Activity, Printer, ArrowLeft, ShieldAlert, ShieldCheck, Stethoscope, ChevronRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid, BarChart, Bar, Cell } from "recharts";
import { api } from "../api";

function statusColor(val: number | null | undefined, min: number, max: number) {
  if (val == null) return "text-gray-400";
  return val < min || val > max ? "text-red-600 font-bold" : "text-green-600 font-medium";
}

function statusText(val: number | null | undefined, min: number, max: number) {
  if (val == null) return "-";
  if (val < min) return "Low";
  if (val > max) return "High";
  return "Normal";
}

function CompIcon({ cur, prev }: { cur?: number | null; prev?: number | null }) {
  if (cur == null || prev == null) return <Minus size={15} className="text-gray-400" />;
  if (cur > prev * 1.05) return <TrendingUp size={15} className="text-red-500" />;
  if (cur < prev * 0.95) return <TrendingDown size={15} className="text-red-500" />;
  return <Minus size={15} className="text-green-500" />;
}

export default function ReportView() {
  const { id, testId } = useParams<{ id: string; testId: string }>();
  const [, setLocation] = useLocation();

  const { data: config } = useQuery({ queryKey: ["config"], queryFn: api.getConfig });
  const { data, isLoading } = useQuery({
    queryKey: ["report", id, testId],
    queryFn: () => api.getReport(Number(id), Number(testId)),
  });

  if (isLoading) return <div className="p-12 text-center text-gray-500">Loading report...</div>;
  if (!data) return <div className="p-12 text-center text-red-500">Report not found.</div>;

  const { patient, current_test, previous_test, trend } = data;
  const isAnemic = current_test.anemia_detected;
  const shapData = [...current_test.shap_features].sort((a: any, b: any) => Math.abs(b.shap_value) - Math.abs(a.shap_value));

  const allFields = [...(config?.cbc_fields ?? []), ...(config?.biomarker_fields ?? [])];

  const getMedSuggestion = (type: string | null | undefined) => {
    if (!type) return config?.medication_suggestions?.default ?? "";
    const suggestions = config?.medication_suggestions ?? {};
    for (const key of Object.keys(suggestions)) {
      if (key !== "default" && type.includes(key)) return suggestions[key];
    }
    return suggestions.default ?? "";
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm print:hidden">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setLocation("/")} className="p-2 hover:bg-gray-100 rounded-xl transition"><ArrowLeft size={20} className="text-gray-500" /></button>
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white"><Activity size={18} /></div>
            <h1 className="text-lg font-bold">AnaemoScan Report</h1>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setLocation(`/patients/${id}/history`)} className="px-4 py-2 border rounded-xl text-sm font-semibold hover:bg-gray-50 transition">History</button>
            <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
              <Printer size={16} /> Print
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Patient Info */}
        <div className="bg-white border rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4 border-b pb-2">Patient Information</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-gray-500 block mb-1">Name</span><span className="font-bold text-base">{patient.name}</span></div>
            <div><span className="text-gray-500 block mb-1">Patient ID</span><span className="font-semibold">#{patient.id}</span></div>
            <div><span className="text-gray-500 block mb-1">Age / Gender</span><span className="font-semibold">{patient.age}y • {patient.gender}</span></div>
            <div><span className="text-gray-500 block mb-1">Blood Group</span><span className="font-semibold">{patient.blood_group || "Unknown"}</span></div>
          </div>
        </div>

        {/* Diagnosis Banner */}
        <div className={`relative overflow-hidden rounded-2xl p-6 text-white ${isAnemic ? "bg-gradient-to-r from-red-500 to-orange-500" : "bg-gradient-to-r from-green-500 to-emerald-500"}`}>
          <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20">{isAnemic ? <ShieldAlert size={100} /> : <ShieldCheck size={100} />}</div>
          <div className="relative">
            <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider mb-3">{current_test.risk_level}</div>
            <h2 className="text-3xl font-bold mb-1">{isAnemic ? "Anemia Detected" : "No Anemia Detected"}</h2>
            {isAnemic && <p className="text-xl font-semibold opacity-90 mb-2">{current_test.anemia_type}</p>}
            <p className="opacity-90 text-sm leading-relaxed mb-4 max-w-2xl">{current_test.summary}</p>
            <div className="text-sm font-medium bg-white/10 inline-block px-4 py-2 rounded-lg">
              AI Confidence: {(current_test.detection_probability * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Comparison */}
        {previous_test && (
          <div>
            <h3 className="text-xl font-bold mb-4">Comparison with Previous Test</h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {["HGB", "RBC", "MCV", "MCH", "MCHC", "RDW"].map(p => (
                <div key={p} className="p-3 bg-white border rounded-xl text-center shadow-sm">
                  <div className="text-xs text-gray-500 font-semibold mb-1">{p}</div>
                  <div className="flex justify-center items-center gap-1">
                    <span className="font-bold">{(current_test[p] as number)?.toFixed(1)}</span>
                    <CompIcon cur={current_test[p] as number} prev={previous_test[p] as number} />
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">prev: {(previous_test[p] as number)?.toFixed(1)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trend Chart */}
        {trend.length > 1 && (
          <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-bold mb-4">Hemoglobin Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={v => new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })} tick={{ fontSize: 12 }} />
                  <YAxis domain={["auto", "auto"]} tick={{ fontSize: 12 }} />
                  <Tooltip labelFormatter={v => new Date(v).toLocaleDateString()} contentStyle={{ borderRadius: "8px" }} />
                  <ReferenceLine y={patient.gender === "Female" ? 12 : 13.5} stroke="#ef4444" strokeDasharray="5 5" />
                  <Line type="monotone" dataKey="HGB" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* CBC Table */}
        <div>
          <h3 className="text-xl font-bold mb-4">Complete Blood Count Parameters</h3>
          <div className="overflow-hidden border rounded-2xl bg-white shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b">
                <tr>
                  <th className="px-4 py-3 font-semibold">Parameter</th>
                  <th className="px-4 py-3 font-semibold">Result</th>
                  <th className="px-4 py-3 font-semibold">Unit</th>
                  <th className="px-4 py-3 font-semibold">Reference Range</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {allFields.map((info: any) => {
                  const val = current_test[info.name] as number | null | undefined;
                  if (val == null) return null;
                  return (
                    <tr key={info.name} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{info.label} <span className="text-gray-400 text-xs">({info.name})</span></td>
                      <td className={`px-4 py-3 font-bold ${statusColor(val, info.min, info.max)}`}>{val?.toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-500">{info.unit}</td>
                      <td className="px-4 py-3 text-gray-500">{info.min} - {info.max}</td>
                      <td className={`px-4 py-3 text-xs font-bold ${statusColor(val, info.min, info.max)}`}>{statusText(val, info.min, info.max)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recommendations + SHAP */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-blue-700"><Stethoscope size={20} /> Clinical Recommendations</h3>
            <ul className="space-y-3 mb-6">
              {current_test.recommendations.map((rec: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <ChevronRight className="shrink-0 text-blue-500 mt-0.5" size={16} /><span>{rec}</span>
                </li>
              ))}
            </ul>
            <div className="bg-white rounded-xl p-4 border border-blue-100">
              <h4 className="text-sm font-bold mb-2">Suggested Pharmacotherapy</h4>
              <p className="text-sm text-gray-600 mb-2">{getMedSuggestion(current_test.anemia_type)}</p>
              <p className="text-[10px] text-red-500 font-semibold uppercase tracking-wider">DISCLAIMER: For reference only. Follow physician's prescription.</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border shadow-sm">
            <h3 className="text-lg font-bold mb-1">AI Feature Impact</h3>
            <p className="text-xs text-gray-500 mb-4">Which parameters most influenced the AI's decision.</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={shapData.slice(0, 8)} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="feature" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                  <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                  <ReferenceLine x={0} stroke="#e5e7eb" />
                  <Bar dataKey="shap_value" radius={[0, 4, 4, 0]} barSize={16}>
                    {shapData.slice(0, 8).map((entry: any, i: number) => (
                      <Cell key={i} fill={entry.shap_value > 0 ? "#ef4444" : "#10b981"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2 text-[10px] font-medium text-gray-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span> Decreases Risk</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span> Increases Risk</span>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t text-center text-xs text-gray-400">
          <p className="font-bold text-gray-600">Report generated by AnaemoScan Clinical Intelligence System</p>
          <p className="mt-1">For clinical use only — Not a substitute for physician judgment</p>
        </div>
      </main>
    </div>
  );
}
