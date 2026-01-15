import { GoogleGenAI, Type } from "@google/genai";
import { PatientData, PredictionResult } from "../types";

const getApiKey = () => {
  const key = process?.env?.API_KEY;
  if (!key || key === "") {
    return null;
  }
  return key;
};

export const analyzeHeartRisk = async (data: PatientData): Promise<PredictionResult> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("MISSING_API_KEY: Please provide a Gemini API Key to enable Machine Learning features.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-3-pro-preview';
  
  const prompt = `
    Act as a senior cardiologist and data scientist. Analyze the following patient heart data:
    ${JSON.stringify(data, null, 2)}
    
    Provide a JSON response with:
    1. A risk probability (0.0 to 1.0).
    2. SHAP-like feature importance values.
    3. Detailed medical explanation.
    4. Treatment recommendations.
    5. Medication sensitivity analysis.
    6. 10-year risk forecasting (10 data points).
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskScore: { type: Type.NUMBER },
            probability: { type: Type.NUMBER },
            explanation: { type: Type.STRING },
            shapValues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  feature: { type: Type.STRING },
                  impact: { type: Type.NUMBER }
                },
                required: ["feature", "impact"]
              }
            },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            medicationInsights: { type: Type.ARRAY, items: { type: Type.STRING } },
            futureRisk: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  year: { type: Type.NUMBER },
                  risk: { type: Type.NUMBER }
                },
                required: ["year", "risk"]
              }
            }
          },
          required: ["riskScore", "probability", "explanation", "shapValues", "recommendations", "medicationInsights", "futureRisk"]
        }
      }
    });

    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Analysis Failed:", error);
    throw new Error("Cardiovascular analysis failed. Please ensure your API key is valid and connected.");
  }
};

export const analyzeSymptoms = async (text: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return "API Key required for symptom analysis.";
  
  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-3-flash-preview';
  const response = await ai.models.generateContent({
    model,
    contents: `Analyze these patient symptoms for cardiovascular urgency: "${text}". Provide advice on medical attention.`
  });
  return response.text || "Assessment unavailable.";
};

export const analyzeMedicalImage = async (base64Image: string, mimeType: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return "API Key required for image analysis.";

  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-3-pro-preview';
  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType } },
        { text: "Analyze this clinical image for cardiovascular abnormalities." }
      ]
    }
  });
  return response.text || "Image analysis yielded no conclusive results.";
};

export interface HospitalInfo {
  title: string;
  uri: string;
}

export interface HospitalResponse {
  text: string;
  hospitals: HospitalInfo[];
}

export const getNearbyHospitals = async (lat: number, lng: number): Promise<HospitalResponse> => {
  const apiKey = getApiKey();
  if (!apiKey) return { text: "API Key required for location features.", hospitals: [] };

  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-2.5-flash';
  const response = await ai.models.generateContent({
    model,
    contents: `Identify the 5 closest hospitals that specialize in cardiac care or emergency cardiovascular units. Provide their names and direct links to their locations.`,
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: { latitude: lat, longitude: lng }
        }
      }
    }
  });
  
  const resultText = response.text || "Here are some specialized cardiac units near your location:";
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  
  const hospitals: HospitalInfo[] = groundingChunks
    .filter((chunk: any) => chunk.maps)
    .map((chunk: any) => ({
      title: chunk.maps.title,
      uri: chunk.maps.uri
    }));

  return {
    text: resultText,
    hospitals: hospitals
  };
};