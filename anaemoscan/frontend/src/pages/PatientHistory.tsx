import React from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText, User, Calendar, Activity } from "lucide-react";
import { api } from "../api";

export default function PatientHistory() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  const { data, isLoading } = useQuery({ queryKey: ["patient", id], queryFn: () => api.getPatient(Number(id)) });

  if (isLoading) return <div className="p-12 text-center text-gray-500">Loading patient history...</div>;
  if (!data) return <div className="p-12 text-center text-red-500">Patient not found.</div>;

  const { patient, tests } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setLocation("/")} className="p-2 hover:bg-gray-100 rounded-xl transition"><ArrowLeft size={20} className="text-gray-500" /></button>
            <h1 className="text-lg font-bold">Patient History</h1>
          </div>
          <button onClick={() => setLocation(`/analyze/${patient.id}`)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition">
            <Activity size={16} /> New Analysis
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="bg-white border rounded-3xl p-6 mb-8 flex flex-col md:flex-row gap-6 items-center justify-between shadow-sm">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold">
              {patient.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-1">{patient.name}</h2>
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1"><User size={14} /> {patient.age}y, {patient.gender}</span>
                {patient.blood_group && <span>Blood: {patient.blood_group}</span>}
                <span className="flex items-center gap-1"><Calendar size={14} /> Joined {new Date(patient.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-2xl p-4 text-center min-w-[120px]">
            <div className="text-3xl font-bold">{tests.length}</div>
            <div className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Total Tests</div>
          </div>
        </div>

        <h3 className="text-xl font-bold mb-4">Test Records</h3>

        {tests.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold">No tests found</h3>
            <p className="text-gray-500">Run a new analysis to see history.</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold">Diagnosis</th>
                    <th className="px-6 py-4 font-semibold">HGB</th>
                    <th className="px-6 py-4 font-semibold">RBC</th>
                    <th className="px-6 py-4 font-semibold">MCV</th>
                    <th className="px-6 py-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[...tests].reverse().map((test: any) => (
                    <tr key={test.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-medium whitespace-nowrap">
                        {new Date(test.created_at).toLocaleDateString()}
                        <span className="text-gray-400 text-xs ml-1">{new Date(test.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${test.anemia_detected ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                          {test.anemia_detected ? test.anemia_type || "Anemia" : "Normal"}
                        </span>
                        {test.anemia_detected && <div className="text-[10px] text-orange-500 font-bold mt-0.5">{test.risk_level}</div>}
                      </td>
                      <td className="px-6 py-4 font-mono">{test.HGB?.toFixed(1)}</td>
                      <td className="px-6 py-4 font-mono">{test.RBC?.toFixed(2)}</td>
                      <td className="px-6 py-4 font-mono">{test.MCV?.toFixed(1)}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => setLocation(`/patients/${patient.id}/report/${test.id}`)}
                          className="flex items-center gap-1 ml-auto px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-semibold transition">
                          <FileText size={14} /> View Report
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
