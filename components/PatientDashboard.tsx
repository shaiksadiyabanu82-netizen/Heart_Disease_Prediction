import React, { useState } from 'react';
import { MapPin, PhoneCall, Mic, Heart, Loader2, Send, Navigation, AlertCircle, ShieldCheck, ExternalLink } from 'lucide-react';
import { getNearbyHospitals, HospitalResponse } from '../services/geminiService';
import { AnalysisState } from '../types';

interface PatientDashboardProps {
  analysis: AnalysisState;
}

const PatientDashboard: React.FC<PatientDashboardProps> = ({ analysis }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [symptomAnalysis, setSymptomAnalysis] = useState('');
  const [analyzingSymptoms, setAnalyzingSymptoms] = useState(false);
  const [hospitalData, setHospitalData] = useState<HospitalResponse | null>(null);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [sosState, setSosState] = useState<'idle' | 'dispatching' | 'sent'>('idle');

  // Derived data for display
  const probability = analysis.result ? analysis.result.probability * 100 : null;
  const riskCategory = probability !== null 
    ? (probability > 60 ? 'High' : probability > 30 ? 'Moderate' : 'Stable')
    : 'No Data';

  const riskColorClass = probability !== null
    ? (probability > 60 ? 'bg-rose-500' : probability > 30 ? 'bg-yellow-400' : 'bg-emerald-500')
    : 'bg-slate-200';

  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    
    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const result = event.results[current][0].transcript;
      setTranscript(result);
    };
    recognition.start();
  };

  const handleAnalyzeSymptoms = async () => {
    if (!transcript) return;
    setAnalyzingSymptoms(true);
    try {
      const result = await analyzeSymptoms(transcript);
      setSymptomAnalysis(result);
    } catch (e) {
      setSymptomAnalysis("Error analyzing symptoms. Please consult a doctor directly.");
    } finally {
      setAnalyzingSymptoms(false);
    }
  };

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

  const triggerSOS = () => {
    setSosState('dispatching');
    setTimeout(() => {
      setSosState('sent');
      setTimeout(() => setSosState('idle'), 5000);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Risk Summary - DISPLAYED FIRST (Primary User Value) */}
      <div className="bg-white p-6 lg:p-8 rounded-3xl border border-rose-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
          <Heart size={160} className="fill-rose-500 text-rose-500" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <h3 className="font-bold text-slate-500 uppercase text-xs tracking-[0.2em]">Live Heart Health Prediction</h3>
            </div>
            {analysis.isAnalyzing ? (
              <div className="flex items-center gap-3 py-4">
                <Loader2 className="animate-spin text-rose-500" size={32} />
                <div>
                  <div className="text-xl font-bold text-slate-800">Updating Analysis...</div>
                  <div className="text-sm text-slate-400">ML Engine is evaluating clinical markers</div>
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
                    ? `This percentage represents your predicted risk for cardiovascular disease.`
                    : 'Awaiting clinical data input from the Clinical Console.'}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Emergency Card */}
        <div className={`p-6 rounded-2xl text-white shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden relative ${sosState === 'sent' ? 'bg-emerald-600' : 'bg-rose-600 shadow-rose-100'}`}>
          <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none">
            <PhoneCall size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-xl">{sosState === 'sent' ? 'Alert Active' : 'Emergency SOS'}</h3>
              <AlertCircle className={sosState === 'idle' ? 'animate-pulse' : ''} />
            </div>
            <p className="text-sm opacity-90 mb-6 max-w-[80%]">
              {sosState === 'idle' && "Immediately notify nearest cardiac responders with your location."}
              {sosState === 'dispatching' && "Identifying your current GPS coordinates..."}
              {sosState === 'sent' && "Help has been dispatched. Stay calm and keep your phone near."}
            </p>
            <button 
              disabled={sosState !== 'idle'}
              className={`w-full bg-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 ${sosState === 'sent' ? 'text-emerald-600' : 'text-rose-600'}`}
              onClick={triggerSOS}
            >
              {sosState === 'idle' && <><PhoneCall size={20} /> Request Dispatch</>}
              {sosState === 'dispatching' && <><Loader2 className="animate-spin" size={20} /> Dispatching...</>}
              {sosState === 'sent' && <><ShieldCheck size={20} /> Help Dispatched</>}
            </button>
          </div>
        </div>

        {/* ICU Finder - Maps Grounding Section */}
        <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-lg flex flex-col justify-between overflow-hidden relative">
          <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none">
            <MapPin size={120} />
          </div>
          <div className="relative z-10">
            <h3 className="font-bold text-xl mb-2">ICU Finder</h3>
            <p className="text-sm opacity-90 mb-6 max-w-[