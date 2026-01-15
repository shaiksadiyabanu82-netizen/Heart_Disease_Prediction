
import { PatientData } from './types';

export const INITIAL_PATIENT_DATA: PatientData = {
  age: 55,
  sex: 1,
  cp: 0,
  trestbps: 130,
  chol: 240,
  fbs: 0,
  restecg: 1,
  thalach: 150,
  exang: 0,
  oldpeak: 1.0,
  slope: 1,
  ca: 0,
  thal: 2
};

export const FEATURE_LABELS: Record<keyof PatientData, string> = {
  age: "Age",
  sex: "Gender (1:M, 0:F)",
  cp: "Chest Pain Type",
  trestbps: "Resting BP",
  chol: "Cholesterol",
  fbs: "Fasting Blood Sugar",
  restecg: "Resting ECG",
  thalach: "Max Heart Rate",
  exang: "Exercise Angina",
  oldpeak: "ST Depression",
  slope: "ST Slope",
  ca: "Major Vessels",
  thal: "Thalassemia"
};

export const MEDICATION_SENSITIVITY_PROMPT = `
Analyze the following patient cardiovascular data and provide medication sensitivity insights. 
Consider standard treatments like Statins, Beta-Blockers, and ACE Inhibitors.
Patient Data: 
`;
