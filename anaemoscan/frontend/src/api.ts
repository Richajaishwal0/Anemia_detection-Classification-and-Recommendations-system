import { auth } from "./firebase";

const BASE = "/api";

async function req(method: string, path: string, body?: any) {
  const uid = auth.currentUser?.uid;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(uid ? { "X-User-Id": uid } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

export const api = {
  getConfig: () => req("GET", "/config"),
  getPatients: (search?: string) => req("GET", `/patients${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  createPatient: (data: any) => req("POST", "/patients", data),
  getPatient: (id: number) => req("GET", `/patients/${id}`),
  saveTest: (patientId: number, data: any) => req("POST", `/patients/${patientId}/tests`, data),
  getReport: (patientId: number, testId?: number) =>
    req("GET", `/patients/${patientId}/report${testId ? `?testId=${testId}` : ""}`),
  adminGetAllPatients: () => req("GET", "/patients/admin/all"),
  deletePatient: (id: number) => req("DELETE", `/patients/${id}`),
  deletePatientHistory: (id: number) => req("DELETE", `/patients/${id}/tests`),
  getStaff: () => req("GET", "/staff"),
  syncStaff: (profile: { uid: string; name: string; email: string; role: string; department?: string }) =>
    req("POST", "/staff/sync", profile),
  deleteStaff: (uid: string) => req("DELETE", `/staff/${uid}`),
};
