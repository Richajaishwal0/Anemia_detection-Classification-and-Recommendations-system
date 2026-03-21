import React, { useState } from "react";
import { useLocation } from "wouter";
import { FlaskConical, Eye, EyeOff, Lock, Mail, User, Building2, AlertCircle, Loader2, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth, type Role } from "../auth";

const ROLES: { value: Role; label: string; desc: string }[] = [
  { value: "doctor", label: "Doctor",  desc: "Full access — diagnose & review" },
  { value: "nurse",  label: "Nurse",   desc: "Enter CBC values & run analysis" },
];

export default function Register() {
  const { register } = useAuth();
  const [, setLocation] = useLocation();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", role: "doctor" as Role, department: "" });
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.email || !form.password) return setError("All fields are required.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    if (form.password !== form.confirm) return setError("Passwords do not match.");
    setLoading(true);
    try {
      await register(form.email.trim(), form.password, form.name.trim(), form.role, form.department.trim());
      setLocation("/");
    } catch (err: any) {
      setError(
        err.code === "auth/email-already-in-use" ? "An account with this email already exists." :
        err.code === "auth/invalid-email"         ? "Invalid email address." :
        "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
      <div className="fixed top-1/4 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 left-1/4 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">

          <div className="flex items-center gap-3 mb-6">
            <a href="/login"
              className="p-2 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/10 transition flex items-center">
              <ChevronLeft size={15} />
            </a>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <FlaskConical size={18} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-extrabold text-white">Create Account</h1>
                <p className="text-blue-300 text-[10px] font-semibold uppercase tracking-widest">AnaemoScan</p>
              </div>
            </div>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex items-center gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role */}
            <div>
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-2">Role</label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map(r => (
                  <button key={r.value} type="button" onClick={() => setForm(f => ({ ...f, role: r.value }))}
                    className={`p-3 rounded-xl border text-left transition ${form.role === r.value
                      ? "bg-blue-600/20 border-blue-500/40 text-white"
                      : "bg-white/3 border-white/8 text-white/40 hover:bg-white/6 hover:text-white/60"}`}>
                    <p className="text-sm font-bold">{r.label}</p>
                    <p className="text-[10px] mt-0.5 leading-tight opacity-70">{r.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">Full Name</label>
              <div className="relative">
                <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
                <input value={form.name} onChange={set("name")} placeholder="Dr. Jane Smith" className={inputCls} />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
                <input type="email" value={form.email} onChange={set("email")} placeholder="doctor@hospital.com"
                  autoComplete="email" className={inputCls} />
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
                Department <span className="text-white/20 normal-case font-normal">(optional)</span>
              </label>
              <div className="relative">
                <Building2 size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
                <input value={form.department} onChange={set("department")} placeholder="e.g. Hematology" className={inputCls} />
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
                  <input type={showPass ? "text" : "password"} value={form.password} onChange={set("password")}
                    placeholder="Min 6 chars" autoComplete="new-password" className={inputCls + " pr-10"} />
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition">
                    {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">Confirm</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
                  <input type={showPass ? "text" : "password"} value={form.confirm} onChange={set("confirm")}
                    placeholder="Repeat" autoComplete="new-password"
                    className={`${inputCls} ${form.confirm && form.confirm !== form.password ? "border-red-500/40" : ""}`} />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all active:scale-95 disabled:opacity-60 shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 mt-1">
              {loading ? <><Loader2 size={15} className="animate-spin" /> Creating...</> : "Create Account"}
            </button>
          </form>

          <p className="text-center text-white/25 text-xs mt-5">
            Already have an account?{" "}
            <button onClick={() => setLocation("/login")} className="text-blue-400 hover:text-blue-300 font-semibold transition">
              Sign in
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
