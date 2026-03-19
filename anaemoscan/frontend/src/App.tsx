import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PatientSelect from "./pages/PatientSelect";
import Home from "./pages/Home";
import PatientHistory from "./pages/PatientHistory";
import ReportView from "./pages/ReportView";

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } });

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Switch>
        <Route path="/" component={PatientSelect} />
        <Route path="/analyze/:patientId" component={Home} />
        <Route path="/patients/:id/history" component={PatientHistory} />
        <Route path="/patients/:id/report/:testId" component={ReportView} />
        <Route>
          <div className="p-12 text-center">
            <h1 className="text-2xl font-bold">404 - Page Not Found</h1>
          </div>
        </Route>
      </Switch>
    </QueryClientProvider>
  );
}
