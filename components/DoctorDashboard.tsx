
import React, { useState, useCallback } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, AreaChart, Area 
} from 'recharts';
import { 
  FileText, Play, RefreshCw, Sliders, Download, Camera, Loader2, Info, 
  AlertTriangle, CheckCircle2, FlaskConical 
} from 'lucide-react';
import { PatientData, AnalysisState } from '../types';
import { INITIAL_PATIENT_DATA, FEATURE_LABELS } from '../constants';
import { analyzeHeartRisk, analyzeMedicalImage } from '../services/geminiService';
import jsPDF from 'jspdf';

interface DoctorDashboardProps {
  analysis: AnalysisState;
  setAnalysis: React.Dispatch<React.SetStateAction<AnalysisState>>;
}

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ analysis, setAnalysis }) => {
  const [patientData, setPatientData] = useState<PatientData>(INITIAL_PATIENT_DATA);
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
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Diagnostic Suite</h2>
          <p className="text-slate-500 text-sm">Real-time ML Heart Disease Prediction & Analysis</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={runAnalysis}
            disabled={analysis.isAnalyzing}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-100"
          >
            {analysis.isAnalyzing ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} fill="currentColor" />}
            Run Predictive Model
          </button>
          {analysis.result && (
             <button 
             onClick={generateReport}
             className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
           >
             <Download size={18} />
             Export PDF
           </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left: What-If Simulator */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full">
            <div className="flex items-center gap-2 mb-6 text-indigo-600">
              <Sliders size={20} />
              <h3 className="font-bold">What-If Simulator</h3>
            </div>
            <div className="space-y-6 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
              {(Object.keys(patientData) as Array<keyof PatientData>).map((key) => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
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

        {/* Right: Results & Insights */}
        <div className="xl:col-span-2 space-y-8">
          {/* Risk Summary */}
          {analysis.result ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="text-sm font-bold text-slate-400 uppercase mb-4">Risk Level Prediction</h4>
                <div className="flex items-center gap-4">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                      <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={364} strokeDashoffset={364 - (364 * analysis.result.probability)} className={analysis.result.probability > 0.6 ? 'text-rose-500' : 'text-emerald-500'} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold">{(analysis.result.probability * 100).toFixed(0)}%</span>
                      <span className="text-[10px] text-slate-400">PROBABILITY</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold mb-2 ${analysis.result.probability > 0.6 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {analysis.result.probability > 0.6 ? 'High Severity' : 'Stable'}
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{analysis.result.explanation.substring(0, 150)}...</p>
                  </div>
                </div>
              </div>

              {/* Explainable AI: SHAP Logic */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                   Explainable AI <Info size={14} className="cursor-help" />
                </h4>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analysis.result.shapValues.slice(0, 6)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="feature" type="category" width={80} style={{ fontSize: '10px' }} />
                      <Tooltip />
                      <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                        {analysis.result.shapValues.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.impact > 0 ? '#f43f5e' : '#10b981'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 text-center italic">Positive values increase risk, negative values protect.</p>
              </div>
            </div>
          ) : (
             <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                <FlaskConical size={48} className="mb-4 opacity-20" />
                <p>Adjust parameters and run analysis to see clinical insights</p>
             </div>
          )}

          {/* Forecasting & Treatment */}
          {analysis.result && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="text-sm font-bold text-slate-400 uppercase mb-6">10-Year Risk Forecasting</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analysis.result.futureRisk}>
                        <defs>
                          <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="year" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} />
                        <Tooltip />
                        <Area type="monotone" dataKey="risk" stroke="#6366f1" fillOpacity={1} fill="url(#colorRisk)" strokeWidth={3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
               </div>

               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                  <h4 className="text-sm font-bold text-slate-400 uppercase">Medication Sensitivity</h4>
                  <div className="space-y-4">
                    {analysis.result.medicationInsights.map((insight, idx) => (
                      <div key={idx} className="flex gap-3 text-sm">
                        <div className="mt-1"><CheckCircle2 size={16} className="text-emerald-500" /></div>
                        <p className="text-slate-600">{insight}</p>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          )}

          {/* Computer Vision Tool */}
          <div className="bg-slate-900 rounded-3xl p-8 text-white">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Camera className="text-rose-500" />
                  Medical Vision Lab
                </h3>
                <p className="text-slate-400 text-sm mt-1">AI-Powered X-Ray & ECG Image Processing</p>
              </div>
              <label className="bg-white text-slate-900 px-6 py-2.5 rounded-xl font-bold cursor-pointer hover:bg-slate-100 transition-all">
                Upload Scan
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            </div>

            {imageAnalysis.loading ? (
              <div className="h-40 flex flex-col items-center justify-center bg-slate-800 rounded-2xl border border-slate-700">
                <Loader2 className="animate-spin mb-2" />
                <p className="text-sm text-slate-400">Analyzing biological patterns...</p>
              </div>
            ) : imageAnalysis.text ? (
              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Neural Analysis Result</h5>
                <div className="text-slate-300 text-sm prose prose-invert max-w-none">
                  {imageAnalysis.text}
                </div>
              </div>
            ) : (
              <div className="h-40 flex flex-col items-center justify-center bg-slate-800 rounded-2xl border-2 border-dashed border-slate-700">
                <Camera className="mb-2 opacity-20" size={32} />
                <p className="text-sm text-slate-500">No scans uploaded for this session</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
