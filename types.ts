
export enum UserRole {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR'
}

export interface PatientData {
  age: number;
  sex: number; // 1 = male, 0 = female
  cp: number; // chest pain type (0-3)
  trestbps: number; // resting blood pressure
  chol: number; // serum cholestoral
  fbs: number; // fasting blood sugar > 120 mg/dl (1 = true; 0 = false)
  restecg: number; // resting electrocardiographic results (0-2)
  thalach: number; // maximum heart rate achieved
  exang: number; // exercise induced angina (1 = yes; 0 = no)
  oldpeak: number; // ST depression induced by exercise relative to rest
  slope: number; // the slope of the peak exercise ST segment
  ca: number; // number of major vessels (0-3) colored by flourosopy
  thal: number; // 1 = normal; 2 = fixed defect; 3 = reversable defect
}

export interface PredictionResult {
  riskScore: number;
  probability: number;
  explanation: string;
  shapValues: { feature: string; impact: number }[];
  recommendations: string[];
  medicationInsights: string[];
  futureRisk: { year: number; risk: number }[];
}

export interface AnalysisState {
  isAnalyzing: boolean;
  result: PredictionResult | null;
  error: string | null;
}
