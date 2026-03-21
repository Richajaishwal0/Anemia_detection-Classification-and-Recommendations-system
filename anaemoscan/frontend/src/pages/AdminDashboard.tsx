import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db as firestoreDb } from "../firebase";
import { useAuth, type UserProfile, type Role } from "../auth";
import { api } from "../api";
import {
  FlaskConical, LogOut, Users, Shield, Stethoscope, Activity,
  ChevronDown, Loader2, RefreshCw, ChevronRight, UserCheck, TestTube2,
  Trash2, AlertTriangle, X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ROLE_STYLE: Record<Role, string> = {
  admin:  "bg-yellow-500/15 text-yellow-300 border-yellow-500/20",
  doctor: "bg-blue-500/15 text-blue-300 border-blue-500/20",
  nurse:  "bg-purple-500/15 text-purple-300 border-purple-500/20",
};
const ROLE_ICON: Record<Role, React.ReactNode> = {
  admin:  <Shield size={12} />,
  doctor: <Stethoscope size={12} />,
  nurse:  <Activity size={12} />,
};

type PatientRow = {
  id: number; name: string; age: number; gender: string;
  created_by: string | null; created_at: string; test_count: number;
};

type DoctorStats = UserProfile & {
  patients: PatientRow[];
  totalTests: number;
  lastSeen?: string | null;
};

export default function AdminDashboard() {
  const { profile, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [users, setUsers]         = useState<UserProfile[]>([]);
  const [patients, setPatients]   = useState<PatientRow[]>([]);
  const [staffStats, setStaffStats] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [updating, setUpdating]   = useState<string | null>(null);
  const [expanded, setExpanded]   = useState<string | null>(null);
  const [tab, setTab]             = useState<"activity" | "users">("activity");
  const [confirm, setConfirm]     = useState<{ type: string; id: string | number; label: string } | null>(null);
  const [deleting, setDeleting]   = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    const [snap, pRes, sRes] = await Promise.all([
      getDocs(collection(firestoreDb, "users")),
      api.adminGetAllPatients().catch(() => ({ patients: [] })),
      api.getStaff().catch(() => ({ staff: [] })),
    ]);
    setUsers(snap.docs.map(d => d.data() as UserProfile));
    setPatients(pRes.patients);
    setStaffStats(sRes.staff);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const changeRole = async (uid: string, role: Role) => {
    setUpdating(uid);
    await updateDoc(doc(firestoreDb, "users", uid), { role });
    setUsers(u => u.map(x => x.uid === uid ? { ...x, role } : x));
    setUpdating(null);
  };

  const handleConfirmedDelete = async () => {
    if (!confirm) return;
    setDeleting(true);
    try {
      if (confirm.type === "patient") {
        await api.deletePatient(confirm.id as number);
        setPatients(p => p.filter(x => x.id !== confirm.id));
      } else if (confirm.type === "history") {
        await api.deletePatientHistory(confirm.id as number);
        setPatients(p => p.map(x => x.id === confirm.id ? { ...x, test_count: 0 } : x));
      } else if (confirm.type === "user") {
        await deleteDoc(doc(firestoreDb, "users", confirm.id as string));
        await api.deleteStaff(confirm.id as string).catch(() => {});
        setUsers(u => u.filter(x => x.uid !== confirm.id));
      }
    } finally {
      setDeleting(false);
      setConfirm(null);
    }
  };

  const counts = {
    total:   users.length,
    doctors: users.filter(u => u.role === "doctor").length,
    nurses:  users.filter(u => u.role === "nurse").length,
    admins:  users.filter(u => u.role === "admin").length,
    patients: patients.length,
    tests:   patients.reduce((s, p) => s + Number(p.test_count), 0),
  };

  // Build per-doctor stats — use SQLite staff counts, merge with Firestore profile
  const doctorStats: DoctorStats[] = users
    .filter(u => u.role === "doctor" || u.role === "nurse")
    .map(u => {
      const myPatients = patients.filter(p => p.created_by === u.uid);
      const sqlStats   = staffStats.find((s: any) => s.uid === u.uid);
      return {
        ...u,
        patients: myPatients,
        totalTests: sqlStats ? Number(sqlStats.test_count) : myPatients.reduce((s, p) => s + Number(p.test_count), 0),
        lastSeen: sqlStats?.last_seen ?? null,
      };
    })
    .sort((a, b) => b.totalTests - a.totalTests);

  const unassigned = patients.filter(p => !p.created_by);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
      <div className="fixed top-0 left-1/3 w-[400px] h-[400px] bg-yellow-600/8 rounded-full blur-3xl pointer-events-none" />

      <header className="sticky top-0 z-50 bg-slate-900/60 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <FlaskConical size={17} className="text-white" />
            </div>
            <div>
              <span className="font-bold tracking-tight">AnaemoScan</span>
              <span className="ml-2 text-[9px] font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest">Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setLocation("/")}
              className="px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold text-white/50 hover:text-white/80 hover:bg-white/10 transition">
              Patient Dashboard
            </button>
            <button onClick={fetchAll} className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/10 transition">
              <RefreshCw size={14} />
            </button>
            <button onClick={logout}
              className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-2">Admin Panel</p>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-blue-100 to-blue-300 bg-clip-text text-transparent mb-2">
            Dashboard
          </h1>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-8">
          {[
            { label: "Users",    value: counts.total,    color: "from-blue-500/20 to-blue-600/10",    border: "border-blue-500/20",    text: "text-blue-300"    },
            { label: "Doctors",  value: counts.doctors,  color: "from-indigo-500/20 to-indigo-600/10", border: "border-indigo-500/20",  text: "text-indigo-300"  },
            { label: "Nurses",   value: counts.nurses,   color: "from-purple-500/20 to-purple-600/10", border: "border-purple-500/20",  text: "text-purple-300"  },
            { label: "Admins",   value: counts.admins,   color: "from-yellow-500/20 to-yellow-600/10", border: "border-yellow-500/20",  text: "text-yellow-300"  },
            { label: "Patients", value: counts.patients, color: "from-emerald-500/20 to-emerald-600/10", border: "border-emerald-500/20", text: "text-emerald-300" },
            { label: "Tests Run",value: counts.tests,    color: "from-rose-500/20 to-rose-600/10",    border: "border-rose-500/20",    text: "text-rose-300"    },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`bg-gradient-to-br ${s.color} border ${s.border} rounded-2xl p-4`}>
              <div className="text-3xl font-extrabold text-white">{s.value}</div>
              <div className={`text-xs font-semibold mt-0.5 ${s.text}`}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {(["activity", "users"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition ${tab === t
                ? "bg-blue-600/30 border border-blue-500/40 text-blue-300"
                : "bg-white/4 border border-white/8 text-white/40 hover:text-white/70"}`}>
              {t === "activity" ? "Staff Activity" : "User Management"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-white/30">
            <Loader2 className="animate-spin mr-2" size={20} /> Loading...
          </div>
        ) : tab === "activity" ? (
          <div className="space-y-3">
            {doctorStats.map((u, i) => (
              <motion.div key={u.uid} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="bg-white/4 border border-white/8 rounded-2xl overflow-hidden backdrop-blur-sm">
                <button onClick={() => setExpanded(expanded === u.uid ? null : u.uid)}
                  className="w-full px-5 py-4 flex items-center gap-4 hover:bg-white/3 transition text-left">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white/90 text-sm">{u.name}</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${ROLE_STYLE[u.role]}`}>
                        {ROLE_ICON[u.role]} {u.role}
                      </span>
                      {u.uid === profile?.uid && <span className="text-[9px] text-yellow-400 font-bold">You</span>}
                    </div>
                    <p className="text-white/35 text-xs mt-0.5">{u.email}{u.department ? ` · ${u.department}` : ""}</p>
                    {u.lastSeen && <p className="text-white/20 text-[9px] mt-0.5">Last active: {new Date(u.lastSeen).toLocaleString()}</p>}
                  </div>
                  <div className="flex items-center gap-6 flex-shrink-0">
                    <div className="text-center">
                      <div className="flex items-center gap-1.5 text-emerald-300">
                        <UserCheck size={13} />
                        <span className="text-lg font-extrabold text-white">{u.patients.length}</span>
                      </div>
                      <p className="text-[9px] text-white/30 uppercase tracking-widest">Patients</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1.5 text-blue-300">
                        <TestTube2 size={13} />
                        <span className="text-lg font-extrabold text-white">{u.totalTests}</span>
                      </div>
                      <p className="text-[9px] text-white/30 uppercase tracking-widest">Tests</p>
                    </div>
                    <ChevronRight size={14} className={`text-white/25 transition-transform ${expanded === u.uid ? "rotate-90" : ""}`} />
                  </div>
                </button>

                <AnimatePresence>
                  {expanded === u.uid && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }} className="overflow-hidden border-t border-white/5">
                      {u.patients.length === 0 ? (
                        <p className="px-5 py-4 text-white/25 text-sm">No patients registered yet.</p>
                      ) : (
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-[9px] uppercase text-white/20 font-bold tracking-widest border-b border-white/5">
                              <th className="px-5 py-2 text-left">Patient</th>
                              <th className="px-5 py-2 text-left">Age / Gender</th>
                              <th className="px-5 py-2 text-left">Registered</th>
                              <th className="px-5 py-2 text-left">Tests</th>
                              <th className="px-5 py-2 text-left">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {u.patients.map(p => (
                              <tr key={p.id} className="border-b border-white/4 hover:bg-white/3 transition">
                                <td className="px-5 py-2.5 text-white/70 font-semibold">{p.name}</td>
                                <td className="px-5 py-2.5 text-white/35">{p.age}y · {p.gender}</td>
                                <td className="px-5 py-2.5 text-white/25">{new Date(p.created_at).toLocaleDateString()}</td>
                                <td className="px-5 py-2.5">
                                  <span className="px-2 py-0.5 bg-blue-500/15 border border-blue-500/20 text-blue-300 rounded-full font-bold">
                                    {p.test_count}
                                  </span>
                                </td>
                                <td className="px-5 py-2.5">
                                  <div className="flex items-center gap-1.5">
                                    {p.test_count > 0 && (
                                      <button onClick={() => setConfirm({ type: "history", id: p.id, label: `Clear history for ${p.name}` })}
                                        className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/20 rounded-lg text-[9px] font-bold transition">
                                        Clear History
                                      </button>
                                    )}
                                    <button onClick={() => setConfirm({ type: "patient", id: p.id, label: `Delete patient ${p.name}` })}
                                      className="p-1.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-lg transition">
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}

            {unassigned.length > 0 && (
              <div className="bg-white/3 border border-white/6 rounded-2xl p-4">
                <p className="text-white/30 text-xs font-bold uppercase tracking-widest mb-2">Unassigned Patients ({unassigned.length})</p>
                <p className="text-white/20 text-xs">These patients were registered before staff tracking was enabled.</p>
              </div>
            )}
          </div>
        ) : (
          /* Users table */
          <div className="bg-white/4 border border-white/8 rounded-2xl overflow-hidden backdrop-blur-sm">
            <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
              <Users size={15} className="text-white/40" />
              <p className="font-bold text-white text-sm">Registered Users</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-[9px] uppercase text-white/25 font-bold tracking-widest">
                    <th className="px-5 py-3 text-left">User</th>
                    <th className="px-5 py-3 text-left">Email</th>
                    <th className="px-5 py-3 text-left">Department</th>
                    <th className="px-5 py-3 text-left">Joined</th>
                    <th className="px-5 py-3 text-left">Role</th>
                    <th className="px-5 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <motion.tr key={u.uid} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="border-b border-white/4 hover:bg-white/3 transition">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-white/80 text-xs">{u.name}</p>
                            {u.uid === profile?.uid && <p className="text-[9px] text-yellow-400">You</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-white/40 text-xs font-mono">{u.email}</td>
                      <td className="px-5 py-3 text-white/35 text-xs">{u.department || "—"}</td>
                      <td className="px-5 py-3 text-white/30 text-xs">
                        {u.createdAt?.toDate ? new Date(u.createdAt.toDate()).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-5 py-3">
                        {u.uid === profile?.uid ? (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${ROLE_STYLE[u.role]}`}>
                            {ROLE_ICON[u.role]} {u.role}
                          </span>
                        ) : (
                          <div className="relative inline-block">
                            {updating === u.uid ? (
                              <Loader2 size={14} className="animate-spin text-white/40" />
                            ) : (
                              <div className="relative">
                                <select value={u.role} onChange={e => changeRole(u.uid, e.target.value as Role)}
                                  className={`appearance-none pl-2.5 pr-6 py-1 rounded-full text-[10px] font-bold border bg-transparent cursor-pointer focus:outline-none ${ROLE_STYLE[u.role]}`}>
                                  <option value="doctor" className="bg-slate-900 text-white">doctor</option>
                                  <option value="nurse"  className="bg-slate-900 text-white">nurse</option>
                                  <option value="admin"  className="bg-slate-900 text-white">admin</option>
                                </select>
                                <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-current opacity-60" />
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {u.uid !== profile?.uid && (
                          <button onClick={() => setConfirm({ type: "user", id: u.uid, label: `Delete user ${u.name}` })}
                            className="p-1.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-lg transition">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Confirm Delete Modal */}
      <AnimatePresence>
        {confirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900/95 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/20 flex items-center justify-center">
                  <AlertTriangle size={18} className="text-red-400" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">Confirm Delete</p>
                  <p className="text-white/40 text-xs">This action cannot be undone</p>
                </div>
                <button onClick={() => setConfirm(null)} className="ml-auto text-white/30 hover:text-white/60 transition">
                  <X size={16} />
                </button>
              </div>
              <p className="text-white/60 text-sm mb-5">{confirm.label}?</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirm(null)}
                  className="flex-1 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold text-white/50 hover:text-white/80 transition">
                  Cancel
                </button>
                <button onClick={handleConfirmedDelete} disabled={deleting}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition flex items-center justify-center gap-2">
                  {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
