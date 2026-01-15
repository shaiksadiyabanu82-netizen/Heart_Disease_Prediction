
import React, { useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, AreaChart, Area 
} from 'recharts';
import { 
  FileText, Play, RefreshCw, Sliders, Download, Camera, Loader2, Info, 
  AlertTriangle, CheckCircle2, FlaskConical 
} from 'lucide-react';
import { PatientData, AnalysisState } from '../types';
import { FEATURE_LABELS } from '../constants';
import { analyzeHeartRisk, analyzeMedicalImage } from '../services/geminiService';
import jsPDF from 'jspdf';

interface DoctorDashboardProps {
  analysis: AnalysisState;
  setAnalysis: React.Dispatch<React.SetStateAction<AnalysisState>>;
  patientData: PatientData;
  setPatientData: React.Dispatch<React.SetStateAction<PatientData>>;
}

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ analysis, setAnalysis, patientData, setPatientData }) => {
  const [imageAnalysis, setImageAnalysis] = useState<{ loading: boolean; text: string | null }>({
    loading: false,
    text: null
  });

  const handleInputChange = (key: keyof PatientData, value: number) => {
    setPatientData(prev => ({ ...prev, [key]: value }));
  };

  const runAnalysis = async () => {
    setAnalysis({ isAnalyzing: true, result: null, error: null });
    try {
      const result = await analyzeHeartRisk(patientData);
      setAnalysis({ isAnalyzing: false, result, error: null });
    } catch (e: any) {
      setAnalysis({ isAnalyzing: false, result: null, error: e.message });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageAnalysis({ loading: true, text: null });
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        const text = await analyzeMedicalImage(base64, file.type);
        setImageAnalysis({ loading: false, text });
      } catch (err) {
        setImageAnalysis({ loading: false, text: "Error analyzing image." });
      }
    };
    reader.readAsDataURL(file);
  };

  const generateReport = () => {
    if (!analysis.result) return;
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("CardiaSense AI - Clinical Report", 20, 20);
    doc.setFontSize(12);
    doc.text(`Patient Age: ${patientData.age}`, 20, 40);
    doc.text(`Risk Score: ${(analysis.result.probability * 100).toFixed(2)}%`, 20, 50);
    doc.text("Clinical Explanation:", 20, 70);
    const splitText = doc.splitTextToSize(analysis.result.explanation, 170);
    doc.text(splitText, 20, 80);
    doc.save(`Clinical_Report_${Date.now()}.pdf`);
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Diagnostic Suite</h2>
          <p className="text-slate-500 text-sm">Synchronized ML Analysis Control</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={runAnalysis}
            disabled={analysis.isAnalyzing}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-100"
          >
            {analysis.isAnalyzing ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} fill="currentColor" />}
            RUN ML MODEL
          </button>
          {analysis.result && (
             <button 
             onClick={generateReport}
             className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg"
           >
             <Download size={18} />
             PDF
           </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-1">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-24">
            <div className="flex items-center gap-2 mb-6 text-indigo-600 font-bold uppercase tracking-widest text-xs">
              <Sliders size={18} />
              Clinical Parameters
            </div>
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {(Object.keys(patientData) as Array<keyof PatientData>).map((key) => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <label>{FEATURE_LABELS[key]}</label>
                    <span className="text-indigo-600">{patientData[key]}</span>
                  </div>
                  <input 
                    type="range"
                    min={key === 'age' ? 1 : 0}
                    max={key === 'chol' ? 500 : key === 'trestbps' ? 200 : key === 'thalach' ? 220 : key === 'oldpeak' ? 6 : 5}
                    step={key === 'oldpeak' ? 0.1 : 1}
                    value={patientData[key]}
                    onChange={(e) => handleInputChange(key, parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="xl:col-span-2 space-y-8">
          {analysis.result ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Current Prediction</h4>
                  <div className="flex items-center gap-4">
                    <div className="relative w-24 h-24">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                        <circle cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={264} strokeDashoffset={264 - (264 * analysis.result.probability)} className={analysis.result.probability > 0.6 ? 'text-rose-500' : 'text-emerald-500'} />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center font-bold text-lg">
                        {(analysis.result.probability * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="flex-1">
                       <p className="text-sm text-slate-600 leading-relaxed italic">"{analysis.result.explanation.substring(0, 100)}..."</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-48">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Shapley Interpretability</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analysis.result.shapValues.slice(0, 5)} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis dataKey="feature" type="category" width={80} style={{ fontSize: '10px', fontWeight: 'bold' }} />
                      <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                        {analysis.result.shapValues.map((e, i) => (
                          <Cell key={i} fill={e.impact > 0 ? '#f43f5e' : '#10b981'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">10-Year Clinical Forecast</h4>
                 <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analysis.result.futureRisk}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="year" axisLine={false} tickLine={false} style={{ fontSize: '10px' }} />
                        <YAxis axisLine={false} tickLine={false} style={{ fontSize: '10px' }} />
                        <Tooltip />
                        <Area type="monotone" dataKey="risk" stroke="#6366f1" fill="#6366f120" strokeWidth={3} />
                      </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </div>
            </div>
          ) : (
             <div className="bg-white p-20 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                <FlaskConical size={48} className="mb-4 opacity-20" />
                <p className="font-bold text-sm tracking-widest">Awaiting Simulation Parameters</p>
             </div>
          )}

          <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-xl font-bold flex items-center gap-2 mb-2">
                <Camera className="text-rose-500" />
                Medical Vision Lab
              </h3>
              <p className="text-slate-400 text-sm mb-6">Analyze ECG or Chest X-Ray images for secondary confirmation.</p>
              
              <div className="flex flex-col gap-4">
                <label className="w-fit bg-white text-slate-900 px-6 py-3 rounded-xl font-bold cursor-pointer hover:bg-slate-100 transition-all text-sm">
                  {imageAnalysis.loading ? 'Scanning...' : 'Upload Clinical Scan'}
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={imageAnalysis.loading} />
                </label>
                
                {imageAnalysis.text && (
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 text-xs text-slate-300 leading-relaxed font-mono">
                    {imageAnalysis.text}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
