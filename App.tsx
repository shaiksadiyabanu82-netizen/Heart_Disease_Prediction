
import React, { useState } from 'react';
import { UserRole, AnalysisState, PatientData } from './types';
import PatientDashboard from './components/PatientDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import { INITIAL_PATIENT_DATA } from './constants';
import { Activity, User, ClipboardList, Menu, X } from 'lucide-react';

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>(UserRole.PATIENT);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  
  // Lifted states to share between dashboards
  const [patientData, setPatientData] = useState<PatientData>(INITIAL_PATIENT_DATA);
  const [analysis, setAnalysis] = useState<AnalysisState>({
    isAnalyzing: false,
    result: null,
    error: null
  });

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      {/* Sidebar - Mobile Overlay Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Navigation */}
      <aside 
        className={`fixed top-0 left-0 h-full bg-slate-900 text-white z-50 transition-transform duration-300 ease-in-out shadow-2xl
          ${isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0 lg:w-20'} 
          flex flex-col`}
      >
        <div className="p-6 flex items-center gap-3 overflow-hidden border-b border-slate-800">
          <Activity className="text-rose-500 w-8 h-8 flex-shrink-0" />
          <span className={`font-bold text-xl tracking-tight whitespace-nowrap transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'lg:opacity-0'}`}>
            HeartML Pro
          </span>
        </div>

        <nav className="flex-1 mt-6 px-4 space-y-2">
          <button 
            onClick={() => { setRole(UserRole.PATIENT); if(window.innerWidth < 1024) setSidebarOpen(false); }}
            className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${
              role === UserRole.PATIENT 
                ? 'bg-rose-500 text-white shadow-lg scale-[1.02]' 
                : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            <User size={22} className="flex-shrink-0" />
            <span className={`font-medium text-sm transition-opacity ${isSidebarOpen ? 'opacity-100' : 'lg:hidden'}`}>Patient Portal</span>
          </button>
          <button 
            onClick={() => { setRole(UserRole.DOCTOR); if(window.innerWidth < 1024) setSidebarOpen(false); }}
            className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${
              role === UserRole.DOCTOR 
                ? 'bg-indigo-500 text-white shadow-lg scale-[1.02]' 
                : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            <ClipboardList size={22} className="flex-shrink-0" />
            <span className={`font-medium text-sm transition-opacity ${isSidebarOpen ? 'opacity-100' : 'lg:hidden'}`}>Clinical Console</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"
            title={isSidebarOpen ? "Collapse" : "Expand"}
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 lg:ml-20`}>
        <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleSidebar}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Menu size={24} />
            </button>
            <div className="flex flex-col lg:flex-row lg:items-center lg:gap-3">
              <h1 className="font-bold text-slate-800 text-sm lg:text-base truncate max-w-[180px] lg:max-w-none">
                Heart Disease Prediction ML
              </h1>
              <div className={`w-fit px-2 py-0.5 rounded-full text-[9px] lg:text-[10px] uppercase font-black tracking-widest border ${
                role === UserRole.PATIENT ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
              }`}>
                {role} View
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="hidden sm:block text-right">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">System Status</div>
                <div className="text-[11px] text-emerald-500 font-bold flex items-center gap-1">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   Active Engine
                </div>
             </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
          {role === UserRole.PATIENT 
            ? <PatientDashboard analysis={analysis} patientData={patientData} /> 
            : <DoctorDashboard analysis={analysis} setAnalysis={setAnalysis} patientData={patientData} setPatientData={setPatientData} />}
        </main>
      </div>
    </div>
  );
};

export default App;
