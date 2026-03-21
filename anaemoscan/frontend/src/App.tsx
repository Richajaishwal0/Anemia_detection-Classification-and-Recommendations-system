import React from "react";
import { Switch, Route, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./auth";
import { FlaskConical, Loader2 } from "lucide-react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PatientSelect from "./pages/PatientSelect";
import Home from "./pages/Home";
import PatientHistory from "./pages/PatientHistory";
import ReportView from "./pages/ReportView";
import AdminDashboard from "./pages/AdminDashboard";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

function Routes() {
  const { user, profile, loading } = useAuth();

  // Wait for Firebase to resolve auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <FlaskConical size={26} className="text-white" />
        </div>
        <Loader2 className="animate-spin text-white/30" size={22} />
        <p className="text-white/25 text-xs uppercase tracking-widest">AnaemoScan</p>
      </div>
    );
  }

  // Not logged in — only login and register accessible
  if (!user || !profile) {
    return (
      <Switch>
        <Route path="/login"   component={Login} />
        <Route path="/register" component={Register} />
        <Route><Redirect to="/login" /></Route>
      </Switch>
    );
  }

  // Logged in — full app
  return (
    <Switch>
      <Route path="/login"><Redirect to="/" /></Route>
      <Route path="/register"><Redirect to="/" /></Route>

      {/* Admin only */}
      <Route path="/admin">
        {profile.role === "admin"
          ? <AdminDashboard />
          : <Redirect to="/" />}
      </Route>

      <Route path="/analyze/:patientId"          component={Home} />
      <Route path="/patients/:id/history"        component={PatientHistory} />
      <Route path="/patients/:id/report/:testId" component={ReportView} />
      <Route path="/"                            component={PatientSelect} />
      <Route>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center">
          <p className="text-white/40 text-xl font-bold">404 — Page Not Found</p>
        </div>
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Routes />
      </AuthProvider>
    </QueryClientProvider>
  );
}
