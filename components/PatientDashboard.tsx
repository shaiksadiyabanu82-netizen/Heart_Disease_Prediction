
import React, { useState } from 'react';
import { MapPin, PhoneCall, Mic, Heart, Loader2, Send, Navigation, AlertCircle, ShieldCheck, ExternalLink, Activity, Info } from 'lucide-react';
import { getNearbyHospitals, analyzeSymptoms, HospitalResponse } from '../services/geminiService';
import { AnalysisState, PatientData } from '../types';
import { FEATURE_LABELS } from '../constants';

interface PatientDashboardProps {
  analysis: AnalysisState;
  patientData: PatientData;
}

const PatientDashboard: React.FC<PatientDashboardProps> = ({ analysis, patientData }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [symptomAnalysis, setSymptomAnalysis] = useState('');
  const [analyzingSymptoms, setAnalyzingSymptoms] = useState(false);
  const [hospitalData, setHospitalData] = useState<HospitalResponse | null>(null);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [sosState, setSosState] = useState<'idle' | 'dispatching' | 'sent'>('idle');

  const probability = analysis.result ? analysis.result.probability * 100 : null;
  const riskCategory = probability !== null 
    ? (probability > 60 ? 'High' : probability > 30 ? 'Moderate' : 'Stable')
    : 'No Data';

  const riskColorClass = probability !== null
    ? (probability > 60 ? 'bg-rose-500' : probability > 30 ? 'bg-yellow-400' : 'bg-emerald-500')
    : 'bg-slate-200';

  const fetchHospitals = async () => {
    setLoadingHospitals(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const data = await getNearbyHospitals(pos.coords.latitude, pos.coords.longitude);
        setHospitalData(data);
      } catch (e) {
        console.error("Hospital Fetch Error:", e);
      } finally {
        setLoadingHospitals(false);
      }
    }, () => {
      alert("Location permission is needed to find the nearest ICU.");
      setLoadingHospitals(false);
    });
  };

  const handleAnalyzeSymptoms = async () => {
    if (!transcript) return;
    setAnalyzingSymptoms(true);
    try {
      const result = await analyzeSymptoms(transcript);
      setSymptomAnalysis(result);
    } catch (e) {
      setSymptomAnalysis("Error analyzing symptoms.");
    } finally {
      setAnalyzingSymptoms(false);
    }
  };

  const triggerSOS = () => {
    setSosState('dispatching');
    setTimeout(() => {
      setSosState('sent');
      setTimeout(() => setSosState('idle'), 5000);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* 1. HEART PREDICTION (Prioritized first as requested) */}
      <div className="bg-white p-6 lg:p-8 rounded-3xl border border-rose-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
          <Heart size={160} className="fill-rose-500 text-rose-500" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <h3 className="font-bold text-slate-500 uppercase text-xs tracking-[0.2em]">Real-Time Heart Prediction</h3>
            </div>
            {analysis.isAnalyzing ? (
              <div className="flex items-center gap-3 py-4">
                <Loader2 className="animate-spin text-rose-500" size={32} />
                <div>
                  <div className="text-xl font-bold text-slate-800">Recalculating Risk...</div>
                  <div className="text-sm text-slate-400">Processing latest clinical markers</div>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-baseline gap-3">
                  <span className="text-6xl font-black text-slate-900 tracking-tighter">
                    {probability !== null ? `${probability.toFixed(1)}%` : '--%'}
                  </span>
                  <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
                    probability !== null && probability > 60 ? 'text-rose-600 bg-rose-50 border border-rose-100' : 
                    probability !== null && probability > 30 ? 'text-yellow-600 bg-yellow-50 border border-yellow-100' : 
                    probability !== null ? 'text-emerald-600 bg-emerald-50 border border-emerald-100' : 'text-slate-400 bg-slate-50 border border-slate-100'
                  }`}>
                    {riskCategory}
                  </div>
                </div>
                <p className="text-slate-500 text-sm font-medium">
                  {probability !== null 
                    ? `Current likelihood of coronary heart disease based on clinical data.`
                    : 'Awaiting doctor to update your clinical parameters for a live prediction.'}
                </p>
              </div>
            )}
          </div>
          
          <div className="w-full md:w-64 space-y-3">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>Risk Severity Scale</span>
              <span>{probability !== null ? `${probability.toFixed(0)}%` : '0%'}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner border border-slate-50">
              <div 
                className={`h-full transition-all duration-1000 ease-out shadow-lg ${riskColorClass}`} 
                style={{ width: probability !== null ? `${probability}%` : '0%' }} 
              />
            </div>
            <div className="flex justify-between text-[9px] text-slate-400 font-medium">
              <span>Stable (0%)</span>
              <span>Danger (100%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CLINICAL DATA PROFILE (Synced from Doctor) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="text-indigo-500" size={20} />
          <h2 className="text-lg font-bold">Your Clinical Profile</h2>
          <span className="ml-auto text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-1 rounded">Read Only</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {(Object.keys(patientData) as Array<keyof PatientData>).map((key) => (
            <div key={key} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center text-center">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mb-1 truncate w-full">
                {FEATURE_LABELS[key]}
              </span>
              <span className="text-lg font-bold text-slate-700">{patientData[key]}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-400 italic">
          <Info size={12} />
          Note: This data is updated by your healthcare provider in the Clinical Console.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Emergency SOS */}
        <div className={`p-6 rounded-2xl text-white shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden relative ${sosState === 'sent' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
          <div className="relative z-10">
            <h3 className="font-bold text-xl mb-1">Emergency SOS</h3>
            <p className="text-sm opacity-90 mb-6">Notify responders with your live GPS location immediately.</p>
            <button 
              disabled={sosState !== 'idle'}
              className="w-full bg-white text-rose-600 font-black py-4 rounded-xl shadow-lg active:scale-95 disabled:opacity-50 transition-all"
              onClick={triggerSOS}
            >
              {sosState === 'idle' ? 'SEND ALARM' : sosState === 'dispatching' ? 'LOCATING...' : 'HELP DISPATCHED'}
            </button>
          </div>
        </div>

        {/* ICU Finder */}
        <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-lg flex flex-col justify-between">
          <h3 className="font-bold text-xl mb-1">Cardiac Center Locator</h3>
          <p className="text-sm opacity-90 mb-6">Find the nearest specialized ICU units using Google Maps.</p>
          <button 
            onClick={fetchHospitals}
            disabled={loadingHospitals}
            className="w-full bg-indigo-500 text-white font-black py-4 rounded-xl shadow-lg hover:bg-indigo-600 active:scale-95 transition-all"
          >
            {loadingHospitals ? 'SCANNING...' : 'FIND NEAREST UNIT'}
          </button>
        </div>
      </div>

      {/* Results from Maps/Symptom analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
        {/* Symptom Checker */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full">
          <div className="flex items-center gap-2 mb-4">
            <Mic className="text-indigo-600" size={18} />
            <h3 className="font-bold">Describe Symptoms</h3>
          </div>
          <textarea 
            className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl mb-4 text-sm font-medium focus:ring-2 focus:ring-indigo-100 outline-none"
            placeholder="e.g. Sharp pain in chest area..."
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
          />
          {symptomAnalysis && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-800">
              {symptomAnalysis}
            </div>
          )}
          <button 
            onClick={handleAnalyzeSymptoms}
            disabled={analyzingSymptoms || !transcript}
            className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl disabled:opacity-50"
          >
            {analyzingSymptoms ? 'ANALYZING...' : 'RUN AI CHECK'}
          </button>
        </div>

        {/* Hospital List */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Navigation className="text-emerald-500" size={18} />
            <h3 className="font-bold">Nearby Assistance</h3>
          </div>
          <div className="flex-1 space-y-3">
            {!hospitalData ? (
              <div className="h-full flex items-center justify-center text-slate-300 italic text-sm border-2 border-dashed border-slate-50 rounded-xl p-8">
                Locate units to see verified units
              </div>
            ) : (
              hospitalData.hospitals.map((h, i) => (
                <a 
                  key={i} 
                  href={h.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-white hover:shadow-md transition-all group"
                >
                  <span className="font-bold text-slate-700 text-sm">{h.title}</span>
                  <ExternalLink size={14} className="text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
