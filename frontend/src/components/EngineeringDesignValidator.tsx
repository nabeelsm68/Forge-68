"use client";

import React, { useState } from "react";
import { useTranslation, Language } from "@/lib/i18n";
import { analyzeVision, type Role, type DataClassification, type VisionAnalyzeResponse } from "@/lib/api";

export interface EngineeringDesignValidatorProps {
  role?: Role;
  clearance?: DataClassification;
  onAnalysisComplete?: (res: VisionAnalyzeResponse) => void;
}

interface BlueprintPreset {
  id: string;
  name: { en: string; hi: string; kn: string };
  equipmentId: string;
  designCode: string;
  designPressure: string;
  designTemp: string;
  material: string;
  description: { en: string; hi: string; kn: string };
  pins: Array<{
    id: string;
    x: number;
    y: number;
    title: { en: string; hi: string; kn: string };
    codeRef: string;
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "PASS";
    detail: { en: string; hi: string; kn: string };
    verdict: { en: string; hi: string; kn: string };
  }>;
}

const BLUEPRINT_PRESETS: BlueprintPreset[] = [
  {
    id: "r204_reactor_head",
    name: {
      en: "R-204 Reactor Head & Nozzle Assembly Drawing (DWG-204-A01)",
      hi: "R-204 रिएक्टर हेड एवं नोजल असेंबली रेखाचित्र (DWG-204-A01)",
      kn: "R-204 ರಿಯಾಕ್ಟರ್ ಹೆಡ್ ಮತ್ತು ನಳಿಕೆಯ ಅಸೆಂಬ್ಲಿ ರೇಖಾಚಿತ್ರ (DWG-204-A01)",
    },
    equipmentId: "R-204",
    designCode: "ASME Section VIII Div 1 / ASME B16.5",
    designPressure: "35.0 bar gauge (MAWP)",
    designTemp: "440°C",
    material: "SA-387 Gr 22 Cl 2 + 3.0mm SS 347 Overlay",
    description: {
      en: "General arrangement drawing of Hydrocracker Reactor R-204 upper head and discharge nozzle manifold.",
      hi: "हाइड्रोक्रैकर रिएक्टर R-204 ऊपरी हेड और डिस्चार्ज नोजल मैनिफोल्ड का सामान्य व्यवस्था चित्र।",
      kn: "ಹೈಡ್ರೋಕ್ರಾಕರ್ ರಿಯಾಕ್ಟರ್ R-204 ಮೇಲಿನ ಹೆಡ್ ಮತ್ತು ಡಿಸ್ಚಾರ್ಜ್ ನಳಿಕೆಯ ಸಾಮಾನ್ಯ ಜೋಡಣೆ ರೇಖಾಚಿತ್ರ.",
    },
    pins: [
      {
        id: "pin-n1",
        x: 48,
        y: 18,
        title: {
          en: "Nozzle N1 - Flange Rating Mismatch",
          hi: "नोजल N1 - निकला हुआ किनारा (Flange) रेटिंग बेमेल",
          kn: "ನಳಿಕೆ N1 - ಫ್ಲೇಂಜ್ ರೇಟಿಂಗ್ ಹೊಂದಾಣಿಕೆಯಿಲ್ಲ",
        },
        codeRef: "ASME B16.5 Table 2-1.9",
        severity: "CRITICAL",
        detail: {
          en: "Drawing calls for 12-inch Class 150 RF flange (max rating 19.6 bar @ 425°C). R-204 design pressure is 35.0 bar. Mandatory Class 300 RTJ (rated 49.6 bar) required.",
          hi: "रेखाचित्र में 12-इंच क्लास 150 RF निकला हुआ किनारा निर्दिष्ट है (425°C पर अधिकतम 19.6 बार)। R-204 डिज़ाइन दबाव 35.0 बार है। अनिवार्य क्लास 300 RTJ आवश्यक है।",
          kn: "ರೇಖಾಚಿತ್ರವು 12-ಇಂಚಿನ ಕ್ಲಾಸ್ 150 RF ಫ್ಲೇಂಜ್ ಅನ್ನು ನಿರ್ದಿಷ್ಟಪಡಿಸುತ್ತದೆ (425°C ನಲ್ಲಿ ಗರಿಷ್ಠ 19.6 ಬಾರ್). R-204 ವಿನ್ಯಾಸ ಒತ್ತಡ 35.0 ಬಾರ್. ಕಡ್ಡಾಯ ಕ್ಲಾಸ್ 300 RTJ ಅಗತ್ಯವಿದೆ.",
        },
        verdict: {
          en: "REJECT DRAWING — Update flange callout to 12\" Class 300 RTJ.",
          hi: "रेखाचित्र अस्वीकृत — निकला हुआ किनारा 12\" क्लास 300 RTJ में बदलें।",
          kn: "ರೇಖಾಚಿತ್ರ ತಿರಸ್ಕರಿಸಲಾಗಿದೆ — ಫ್ಲೇಂಜ್ ಅನ್ನು 12\" ಕ್ಲಾಸ್ 300 RTJ ಗೆ ನವೀಕರಿಸಿ.",
        },
      },
      {
        id: "pin-n2",
        x: 50,
        y: 82,
        title: {
          en: "Nozzle N2 - Reinforcement Pad Weld Throat Deficit",
          hi: "नोजल N2 - रीइन्फोर्समेंट पैड वेल्ड थ्रोट की कमी",
          kn: "ನಳಿಕೆ N2 - ಬಲವರ್ಧನೆ ಪ್ಯಾಡ್ ವೆಲ್ಡ್ ಥ್ರೋಟ್ ಕೊರತೆ",
        },
        codeRef: "ASME Section VIII Div 1 UG-37 / UW-16",
        severity: "HIGH",
        detail: {
          en: "Drawing indicates fillet weld throat of 8.5 mm. Calculation per UG-37 requires minimum 11.2 mm throat for 35.0 bar design pressure.",
          hi: "रेखाचित्र में 8.5 मिमी का फ़िलेट वेल्ड थ्रोट दर्शाया गया है। UG-37 के तहत गणना के अनुसार 35.0 बार दबाव हेतु न्यूनतम 11.2 मिमी थ्रोट अनिवार्य है।",
          kn: "ರೇಖಾಚಿತ್ರವು 8.5 ಮಿಮೀ ಫಿಲ್ಲೆಟ್ ವೆಲ್ಡ್ ಥ್ರೋಟ್ ಅನ್ನು ಸೂಚಿಸುತ್ತದೆ. 35.0 ಬಾರ್ ಒತ್ತಡಕ್ಕೆ ಕನಿಷ್ಠ 11.2 ಮಿಮೀ ಅಗತ್ಯವಿದೆ.",
        },
        verdict: {
          en: "REVISE SPECIFICATION — Increase weld leg to achieve 11.2 mm effective throat.",
          hi: "विशिष्टता संशोधित करें — 11.2 मिमी प्रभावी थ्रोट प्राप्त करने के लिए वेल्ड लेग बढ़ाएं।",
          kn: "ವಿವರಣೆಯನ್ನು ಪರಿಷ್ಕರಿಸಿ — 11.2 ಮಿಮೀ ಪರಿಣಾಮಕಾರಿ ಥ್ರೋಟ್ ಸಾಧಿಸಲು ವೆಲ್ಡ್ ಲೆಗ್ ಹೆಚ್ಚಿಸಿ.",
        },
      },
      {
        id: "pin-ca",
        x: 25,
        y: 52,
        title: {
          en: "Shell Course - Corrosion Allowance Deficit",
          hi: "शेल कोर्स - जंग भत्ता (Corrosion Allowance) की कमी",
          kn: "ಶೆಲ್ ಕೋರ್ಸ್ - ತುಕ್ಕು ಅನುಮತಿ ಕೊರತೆ",
        },
        codeRef: "NACE MR0175 / Refinery Spec SPEC-ARCH-204",
        severity: "MEDIUM",
        detail: {
          en: "General Note 4 indicates 1.5 mm CA. Wet H2S sour service requires 3.0 mm minimum corrosion allowance.",
          hi: "सामान्य नोट 4 में 1.5 मिमी सीए दर्शाया गया है। वेट H2S सोर सर्विस हेतु न्यूनतम 3.0 मिमी जंग भत्ता आवश्यक है।",
          kn: "ಸಾಮಾನ್ಯ ಟಿಪ್ಪಣಿ 4 1.5 ಮಿಮೀ CA ಸೂಚಿಸುತ್ತದೆ. H2S ಸೇವೆಗೆ ಕನಿಷ್ಠ 3.0 ಮಿಮೀ ಅಗತ್ಯವಿದೆ.",
        },
        verdict: {
          en: "REVISE DRAWING NOTE — Mandate 3.0 mm minimum CA.",
          hi: "रेखाचित्र नोट संशोधित करें — न्यूनतम 3.0 मिमी सीए अनिवार्य करें।",
          kn: "ರೇಖಾಚಿತ್ರದ ಟಿಪ್ಪಣಿ ಪರಿಷ್ಕರಿಸಿ — ಕನಿಷ್ಠ 3.0 ಮಿಮೀ CA ಕಡ್ಡಾಯಗೊಳಿಸಿ.",
        },
      },
      {
        id: "pin-hd",
        x: 50,
        y: 10,
        title: {
          en: "Top Head Geometry - 2:1 Ellipsoidal",
          hi: "शीर्ष हेड ज्यामिति - 2:1 अर्ध-दीर्घवृत्ताकार (Ellipsoidal)",
          kn: "ಮೇಲ್ಭಾಗದ ಹೆಡ್ ರೇಖಾಗಣಿತ - 2:1 ಎಲಿಪ್ಸಾಯ್ಡಲ್",
        },
        codeRef: "ASME Section VIII Div 1 UG-32(d)",
        severity: "PASS",
        detail: {
          en: "Major-to-minor axis ratio of 2:1 conforms to ASME Section VIII UG-32(d). Wall thickness of 75.0 mm exceeds calculated t_min of 68.2 mm.",
          hi: "2:1 का अक्ष अनुपात ASME UG-32(d) के अनुरूप है। 75.0 मिमी दीवार की मोटाई न्यूनतम आवश्यक 68.2 मिमी से अधिक है।",
          kn: "2:1 ಅಕ್ಷದ ಅನುಪಾತವು ASME UG-32(d) ಗೆ ಅನುಗುಣವಾಗಿದೆ. 75.0 ಮಿಮೀ ಗೋಡೆ ದಪ್ಪವು ಅಗತ್ಯವಿರುವ 68.2 ಮಿಮೀ ಮೀರಿದೆ.",
        },
        verdict: {
          en: "CODE COMPLIANT — Fully verified.",
          hi: "कोड अनुरूप — पूर्णतः सत्यापित।",
          kn: "ಕೋಡ್ ಅನುಸರಣೆ — ಸಂಪೂರ್ಣವಾಗಿ ಪರಿಶೀಲಿಸಲಾಗಿದೆ.",
        },
      },
    ],
  },
  {
    id: "psv204_piping_iso",
    name: {
      en: "PSV-204 Safety Relief Valve & Flange Piping Isometric (ISO-PSV-204)",
      hi: "PSV-204 सुरक्षा राहत वाल्व एवं निकला हुआ किनारा पाइपिंग आइसोमेट्रिक",
      kn: "PSV-204 ಸುರಕ್ಷತಾ ಪರಿಹಾರ ವಾಲ್ವ್ ಮತ್ತು ಫ್ಲೇಂಜ್ ಪೈಪಿಂಗ್ ಐಸೋಮೆಟ್ರಿಕ್",
    },
    equipmentId: "PSV-204",
    designCode: "API 520 Part I & II / ASME Section VIII UG-125",
    designPressure: "35.0 bar set pressure",
    designTemp: "425°C",
    material: "Forged Alloy Steel SA-182 F22",
    description: {
      en: "Relief header connection isometric and car-seal locked-open isolation valve piping drawing.",
      hi: "राहत हेडर कनेक्शन आइसोमेट्रिक और कार-सील लॉक्ड-ओपन आइसोलेशन वाल्व पाइपिंग रेखाचित्र।",
      kn: "ರಿಲೀಫ್ ಹೆಡರ್ ಸಂಪರ್ಕ ಐಸೋಮೆಟ್ರಿಕ್ ಮತ್ತು ಕಾರ್-ಸೀಲ್ ಲಾಕ್-ಓಪನ್ ಐಸೋಲೇಶನ್ ವಾಲ್ವ್ ಪೈಪಿಂಗ್ ರೇಖಾಚಿತ್ರ.",
    },
    pins: [
      {
        id: "pin-psv1",
        x: 45,
        y: 35,
        title: {
          en: "Inlet Piping Pressure Loss Verification",
          hi: "इनलेट पाइपिंग दबाव हानि सत्यापन (< 3%)",
          kn: "ಇನ್ಲೆಟ್ ಪೈಪಿಂಗ್ ಒತ್ತಡ ನಷ್ಟ ಪರಿಶೀಲನೆ (< 3%)",
        },
        codeRef: "API 520 Part II Section 5.2",
        severity: "PASS",
        detail: {
          en: "Calculated inlet piping non-recoverable pressure drop is 0.72 bar (2.05% of set pressure), well within the API 520 3% maximum allowable limit.",
          hi: "परिकलित इनलेट पाइपिंग दबाव हानि 0.72 बार (सेट दबाव का 2.05%) है, जो API 520 की 3% सीमा के भीतर है।",
          kn: "ಇನ್ಲೆಟ್ ಪೈಪಿಂಗ್ ಒತ್ತಡದ ಕುಸಿತವು 0.72 ಬಾರ್ (2.05%) ಆಗಿದೆ, ಇದು API 520 3% ಮಿತಿಯೊಳಗಿದೆ.",
        },
        verdict: {
          en: "PASS — Inlet hydraulics fully compliant.",
          hi: "उत्तीर्ण — इनलेट हाइड्रोलिक्स पूर्णतः अनुपालक।",
          kn: "ಪಾಸಾಗಿದೆ — ಇನ್ಲೆಟ್ ಹೈಡ್ರಾಲಿಕ್ಸ್ ಸಂಪೂರ್ಣವಾಗಿ ಅನುಸರಿಸುತ್ತದೆ.",
        },
      },
      {
        id: "pin-psv2",
        x: 55,
        y: 65,
        title: {
          en: "Discharge Tailpipe Support & Reaction Force Deficit",
          hi: "डिस्चार्ज टेलपाइप सपोर्ट एवं प्रतिक्रिया बल की कमी",
          kn: "ಡಿಸ್ಚಾರ್ಜ್ ಟೈಲ್‌ಪೈಪ್ ಬೆಂಬಲ ಮತ್ತು ಪ್ರತಿಕ್ರಿಯೆ ಬಲ ಕೊರತೆ",
        },
        codeRef: "API 520 Part II Section 8.3",
        severity: "HIGH",
        detail: {
          en: "Dynamic discharge reaction force calculated at 48.2 kN during full relief. Drawing indicates unanchored spring support insufficient to resist transient kick.",
          hi: "पूर्ण राहत के दौरान गतिशील प्रतिक्रिया बल 48.2 kN आंका गया। रेखाचित्र में अस्थिर स्प्रिंग सपोर्ट दर्शाया गया है जो पर्याप्त नहीं है।",
          kn: "ಪೂರ್ಣ ಪರಿಹಾರದ ಸಮಯದಲ್ಲಿ 48.2 kN ಪ್ರತಿಕ್ರಿಯೆ ಬಲ. ರೇಖಾಚಿತ್ರವು ಸಾಕಷ್ಟು ಬೆಂಬಲವನ್ನು ತೋರಿಸುವುದಿಲ್ಲ.",
        },
        verdict: {
          en: "REVISE SUPPORT — Mandate rigid structural trunnion support.",
          hi: "सपोर्ट संशोधित करें — कठोर ट्रनियन सपोर्ट अनिवार्य करें।",
          kn: "ಬೆಂಬಲವನ್ನು ಪರಿಷ್ಕರಿಸಿ — ರಚನಾತ್ಮಕ ಟ್ರನ್ನಿಯನ್ ಬೆಂಬಲವನ್ನು ಕಡ್ಡಾಯಗೊಳಿಸಿ.",
        },
      },
    ],
  },
];

export function EngineeringDesignValidator({
  role = "ENGINEER",
  clearance = "INTERNAL",
  onAnalysisComplete,
}: EngineeringDesignValidatorProps) {
  const { language } = useTranslation();
  const [selectedPresetId, setSelectedPresetId] = useState<string>("r204_reactor_head");
  const [activePinId, setActivePinId] = useState<string | null>("pin-n1");
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [customFileBase64, setCustomFileBase64] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<VisionAnalyzeResponse | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const activePreset = BLUEPRINT_PRESETS.find((p) => p.id === selectedPresetId) || BLUEPRINT_PRESETS[0];
  const activePin = activePreset.pins.find((p) => p.id === activePinId) || activePreset.pins[0];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCustomFile(file);
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      const base64Data = result.includes(",") ? result.split(",")[1] : result;
      setCustomFileBase64(base64Data);
    };
    reader.readAsDataURL(file);
  };

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      let res: VisionAnalyzeResponse;
      if (customFile && customFileBase64) {
        res = await analyzeVision({
          image_base64: customFileBase64,
          filename: customFile.name,
          equipment_id: activePreset.equipmentId,
          prompt: `Analyze engineering drawing and component blueprint for ${activePreset.equipmentId} against ASME Section VIII, ASME B16.5, and API 510/520 codes. Identify all structural defects, flange class discrepancies, and weld throat deficits.`,
          classification: clearance,
          role,
        });
      } else {
        res = await analyzeVision({
          image_path: "r204_pressure_gauge.png",
          filename: `${activePreset.id}.dwg.png`,
          equipment_id: activePreset.equipmentId,
          prompt: `Verify component architecture drawing against ASME Section VIII and ASME B16.5 codes. Asset: ${activePreset.equipmentId}.`,
          classification: clearance,
          role,
        });
      }
      setAnalysisResult(res);
      if (onAnalysisComplete) onAnalysisComplete(res);
    } catch (err: unknown) {
      setAnalysisError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const lang = (language as Language) || "en";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Top Banner & Control Bar */}
      <div
        style={{
          background: "var(--bg-0)",
          border: "1px solid var(--line)",
          borderRadius: "var(--radius-panel)",
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "18px" }}>📐</span>
            <div>
              <div style={{ fontFamily: "var(--font-ui)", fontWeight: 600, fontSize: "14px", color: "var(--ink)" }}>
                {lang === "hi"
                  ? "घटक वास्तुकला एवं इंजीनियरिंग रेखाचित्र विश्लेषण"
                  : lang === "kn"
                  ? "ಘಟಕ ವಾಸ್ತುಶಿಲ್ಪ & ಇಂಜಿನಿಯರಿಂಗ್ ರೇಖಾಚಿತ್ರ ವಿಶ್ಲೇಷಣೆ"
                  : "Component Architecture & Engineering Drawing Analysis"}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-3)" }}>
                ASME Section VIII Div 1 • ASME B16.5 • API 510 / 520 / 526 Code Validation Engine
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={handleRunAnalysis}
              disabled={isAnalyzing}
              style={{
                background: isAnalyzing ? "var(--bg-2)" : "var(--brass)",
                color: isAnalyzing ? "var(--ink-3)" : "#0e1117",
                border: "none",
                borderRadius: "var(--radius-pill)",
                padding: "8px 18px",
                fontFamily: "var(--font-ui)",
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: isAnalyzing ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all var(--dur-fast) var(--ease-out)",
              }}
            >
              <span>{isAnalyzing ? "⚙️" : "🔍"}</span>
              <span>
                {isAnalyzing
                  ? lang === "hi" ? "सत्यापित हो रहा है..." : lang === "kn" ? "ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ..." : "Analyzing Blueprint..."
                  : lang === "hi" ? "सॉवरेन कोड सत्यापन चलाएं" : lang === "kn" ? "ಕೋಡ್ ಪರಿಶೀಲನೆ ಚಲಾಯಿಸಿ" : "Run Sovereign Code Validation"}
              </span>
            </button>
          </div>
        </div>

        {/* Preset Selector & File Upload */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-3)" }}>
              {lang === "hi" ? "संदर्भ ड्राइंग:" : lang === "kn" ? "ಉಲ್ಲೇಖ ರೇಖಾಚಿತ್ರ:" : "Blueprint Reference:"}
            </span>
            <select
              value={selectedPresetId}
              onChange={(e) => {
                setSelectedPresetId(e.target.value);
                setCustomFile(null);
                setCustomFileBase64(null);
              }}
              style={{
                background: "var(--bg-1)",
                border: "1px solid var(--line)",
                color: "var(--ink)",
                padding: "5px 10px",
                borderRadius: "var(--radius-sm)",
                fontFamily: "var(--font-ui)",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              {BLUEPRINT_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name[lang] || p.name.en}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-3)" }}>
              {lang === "hi" ? "कस्टम CAD/छवि अपलोड:" : lang === "kn" ? "ಕಸ್ಟಮ್ CAD/ಚಿತ್ರ ಅಪ್‌ಲೋಡ್:" : "Upload Custom CAD / Image:"}
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleFileUpload}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--ink-2)",
              }}
            />
            {customFile && (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--sage)" }}>
                ✓ {customFile.name}
              </span>
            )}
          </div>
        </div>

        {analysisError && (
          <div style={{ padding: "8px 12px", background: "rgba(235, 87, 87, 0.1)", border: "1px solid var(--coral-border)", borderRadius: "var(--radius-sm)", color: "var(--coral-text)", fontSize: "12px", fontFamily: "var(--font-mono)" }}>
            ⚠️ Error: {analysisError}
          </div>
        )}
      </div>

      {/* Main Grid: Visual CAD Blueprint Canvas + Inspector Panel */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
        {/* Left: Interactive Visual Blueprint Canvas */}
        <div
          style={{
            background: "#0a111a",
            border: "1px solid #1e3a5f",
            borderRadius: "var(--radius-panel)",
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            position: "relative",
            minHeight: "460px",
          }}
        >
          {/* Blueprint Title Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1e3a5f", paddingBottom: 8 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#64b5f6", letterSpacing: "0.08em" }}>
              CAD BLUEPRINT SCHEMATIC // {activePreset.equipmentId}
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#90caf9" }}>
              CODE: {activePreset.designCode}
            </span>
          </div>

          {/* SVG Industrial CAD Drawing */}
          <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg
              viewBox="0 0 500 380"
              style={{ width: "100%", height: "auto", maxHeight: "380px" }}
            >
              <defs>
                {/* Blueprint grid background */}
                <pattern id="blueprint-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#13263d" strokeWidth="0.8" />
                </pattern>
                <linearGradient id="vessel-shell" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#1a365d" />
                  <stop offset="50%" stopColor="#2a4365" />
                  <stop offset="100%" stopColor="#1a365d" />
                </linearGradient>
              </defs>

              <rect width="100%" height="100%" fill="url(#blueprint-grid)" />

              {/* Reactor Outer Shell & Heads */}
              {activePreset.id === "r204_reactor_head" ? (
                <g>
                  {/* Centerline */}
                  <line x1="250" y1="20" x2="250" y2="360" stroke="#4299e1" strokeWidth="0.8" strokeDasharray="6,4" />

                  {/* Vessel Main Shell Body */}
                  <rect x="150" y="100" width="200" height="190" fill="url(#vessel-shell)" stroke="#63b3ed" strokeWidth="2" rx="4" />

                  {/* 2:1 Ellipsoidal Top Head */}
                  <path
                    d="M 150 100 C 150 40, 350 40, 350 100 Z"
                    fill="#2b6cb0"
                    stroke="#90cdf4"
                    strokeWidth="2"
                  />

                  {/* 2:1 Ellipsoidal Bottom Head */}
                  <path
                    d="M 150 290 C 150 345, 350 345, 350 290 Z"
                    fill="#2b6cb0"
                    stroke="#90cdf4"
                    strokeWidth="2"
                  />

                  {/* Top Inlet Nozzle N1 */}
                  <rect x="225" y="18" width="50" height="35" fill="#3182ce" stroke="#e53e3e" strokeWidth="2.5" />
                  <rect x="215" y="14" width="70" height="8" fill="#e53e3e" stroke="#fff" strokeWidth="1" />
                  <text x="250" y="8" fill="#fc8181" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    N1: 12" Cl-150 [DISCREPANCY]
                  </text>

                  {/* Bottom Discharge Nozzle N2 */}
                  <rect x="230" y="325" width="40" height="30" fill="#3182ce" stroke="#dd6b20" strokeWidth="2" />
                  <rect x="220" y="352" width="60" height="8" fill="#dd6b20" stroke="#fff" strokeWidth="1" />
                  {/* Reinforcement Pad */}
                  <ellipse cx="250" cy="326" rx="35" ry="10" fill="none" stroke="#dd6b20" strokeWidth="2" strokeDasharray="3,3" />
                  <text x="250" y="375" fill="#fbd38d" fontSize="10" fontFamily="monospace" textAnchor="middle">
                    N2: Pad Throat 8.5mm [UG-37 DEFICIT]
                  </text>

                  {/* Quench Gas Nozzles (Side) */}
                  <rect x="125" y="160" width="25" height="16" fill="#3182ce" stroke="#63b3ed" strokeWidth="1.5" />
                  <rect x="120" y="156" width="6" height="24" fill="#4299e1" stroke="#90cdf4" strokeWidth="1" />
                  <text x="85" y="172" fill="#90caf9" fontSize="9" fontFamily="monospace">
                    N3 Quench
                  </text>

                  {/* Catalyst Bed Lines */}
                  <line x1="160" y1="140" x2="340" y2="140" stroke="#ed8936" strokeWidth="2" strokeDasharray="4,3" />
                  <text x="250" y="136" fill="#fbd38d" fontSize="9" fontFamily="monospace" textAnchor="middle">
                    CATALYST BED 1
                  </text>

                  <line x1="160" y1="230" x2="340" y2="230" stroke="#ed8936" strokeWidth="2" strokeDasharray="4,3" />
                  <text x="250" y="226" fill="#fbd38d" fontSize="9" fontFamily="monospace" textAnchor="middle">
                    CATALYST BED 2
                  </text>

                  {/* Shell wall thickness dimension bracket */}
                  <line x1="130" y1="100" x2="130" y2="290" stroke="#cbd5e0" strokeWidth="1" />
                  <line x1="125" y1="100" x2="135" y2="100" stroke="#cbd5e0" strokeWidth="1" />
                  <line x1="125" y1="290" x2="135" y2="290" stroke="#cbd5e0" strokeWidth="1" />
                  <text x="75" y="200" fill="#cbd5e0" fontSize="9" fontFamily="monospace">
                    t_nom: 75.0mm
                  </text>
                </g>
              ) : (
                <g>
                  {/* PSV Piping Isometric Graphic */}
                  <rect x="220" y="100" width="60" height="90" fill="#2b6cb0" stroke="#90cdf4" strokeWidth="2" rx="4" />
                  <polygon points="250,50 220,100 280,100" fill="#3182ce" stroke="#90cdf4" strokeWidth="2" />
                  <circle cx="250" cy="50" r="10" fill="#e53e3e" stroke="#fff" strokeWidth="1.5" />
                  <line x1="250" y1="190" x2="250" y2="300" stroke="#4299e1" strokeWidth="10" />
                  <line x1="280" y1="140" x2="380" y2="140" stroke="#dd6b20" strokeWidth="8" />
                  <line x1="380" y1="140" x2="380" y2="40" stroke="#dd6b20" strokeWidth="8" />
                  <text x="250" y="330" fill="#90caf9" fontSize="10" fontFamily="monospace" textAnchor="middle">
                    INLET FLANGE (CSO)
                  </text>
                  <text x="380" y="30" fill="#fbd38d" fontSize="10" fontFamily="monospace" textAnchor="middle">
                    DISCHARGE HEADER
                  </text>
                </g>
              )}

              {/* Interactive Inspection Pins Overlay */}
              {activePreset.pins.map((pin) => {
                const isSelected = activePin.id === pin.id;
                const pinColor =
                  pin.severity === "CRITICAL"
                    ? "#e53e3e"
                    : pin.severity === "HIGH"
                    ? "#dd6b20"
                    : pin.severity === "MEDIUM"
                    ? "#d69e2e"
                    : "#38a169";

                return (
                  <g
                    key={pin.id}
                    onClick={() => setActivePinId(pin.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <circle
                      cx={`${pin.x}%`}
                      cy={`${pin.y}%`}
                      r={isSelected ? 14 : 10}
                      fill={pinColor}
                      stroke="#fff"
                      strokeWidth={isSelected ? 3 : 1.5}
                      opacity={isSelected ? 1 : 0.85}
                    />
                    <text
                      x={`${pin.x}%`}
                      y={`${pin.y}%`}
                      dy="4"
                      textAnchor="middle"
                      fill="#fff"
                      fontSize={isSelected ? "11" : "9"}
                      fontWeight="bold"
                    >
                      {pin.severity === "PASS" ? "✓" : "!"}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Blueprint Footer Details */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #1e3a5f", paddingTop: 8, fontSize: "11px", fontFamily: "var(--font-mono)", color: "#90caf9" }}>
            <span>MATERIAL: {activePreset.material}</span>
            <span>MAWP: {activePreset.designPressure}</span>
          </div>
        </div>

        {/* Right: Component Specs & Active Pin Inspector Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Active Inspection Pin Detail Card */}
          <div
            style={{
              background: "var(--bg-0)",
              border: `1px solid ${
                activePin.severity === "CRITICAL"
                  ? "var(--coral-border)"
                  : activePin.severity === "HIGH"
                  ? "rgba(221, 107, 32, 0.4)"
                  : "var(--line)"
              }`,
              borderRadius: "var(--radius-panel)",
              padding: "16px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  padding: "3px 8px",
                  borderRadius: "var(--radius-pill)",
                  fontWeight: 700,
                  background:
                    activePin.severity === "CRITICAL"
                      ? "rgba(235, 87, 87, 0.15)"
                      : activePin.severity === "HIGH"
                      ? "rgba(221, 107, 32, 0.15)"
                      : activePin.severity === "MEDIUM"
                      ? "rgba(214, 158, 46, 0.15)"
                      : "rgba(56, 161, 105, 0.15)",
                  color:
                    activePin.severity === "CRITICAL"
                      ? "var(--coral-text)"
                      : activePin.severity === "HIGH"
                      ? "#e67e22"
                      : activePin.severity === "MEDIUM"
                      ? "#f1c40f"
                      : "var(--sage)",
                }}
              >
                {activePin.severity} // {activePin.codeRef}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-3)" }}>
                TAG: {activePin.id.toUpperCase()}
              </span>
            </div>

            <div style={{ fontFamily: "var(--font-ui)", fontSize: "14px", fontWeight: 600, color: "var(--ink)" }}>
              {activePin.title[lang] || activePin.title.en}
            </div>

            <p style={{ fontFamily: "var(--font-ui)", fontSize: "13px", color: "var(--ink-2)", lineHeight: 1.5, margin: 0 }}>
              {activePin.detail[lang] || activePin.detail.en}
            </p>

            <div
              style={{
                background: "var(--bg-1)",
                border: "1px solid var(--line)",
                borderRadius: "var(--radius-sm)",
                padding: "10px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "var(--brass)", letterSpacing: "0.06em" }}>
                {lang === "hi" ? "इंजीनियरिंग सुधारात्मक निर्णय:" : lang === "kn" ? "ಇಂಜಿನಿಯರಿಂಗ್ ತಿದ್ದುಪಡಿ ತೀರ್ಪು:" : "CORRECTIVE ENGINEERING VERDICT:"}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--ink)", fontWeight: 600 }}>
                {activePin.verdict[lang] || activePin.verdict.en}
              </span>
            </div>
          </div>

          {/* Architectural Reference Table */}
          <div
            style={{
              background: "var(--bg-0)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-panel)",
              padding: "16px 20px",
            }}
          >
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--brass)", letterSpacing: "0.06em", marginBottom: 10 }}>
              {lang === "hi" ? "घटक वास्तुकला विनिर्देश (ASME / API):" : lang === "kn" ? "ಘಟಕ ವಾಸ್ತುಶಿಲ್ಪ ವಿಶೇಷಣಗಳು:" : "ASME / API ARCHITECTURE SPECIFICATIONS:"}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "12px", fontFamily: "var(--font-mono)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--line)" }}>
                <span style={{ color: "var(--ink-3)" }}>Design Code:</span>
                <span style={{ color: "var(--ink)" }}>{activePreset.designCode}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--line)" }}>
                <span style={{ color: "var(--ink-3)" }}>Design Pressure (MAWP):</span>
                <span style={{ color: "var(--ink)" }}>{activePreset.designPressure}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--line)" }}>
                <span style={{ color: "var(--ink-3)" }}>Design Temperature:</span>
                <span style={{ color: "var(--ink)" }}>{activePreset.designTemp}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--line)" }}>
                <span style={{ color: "var(--ink-3)" }}>Base Material:</span>
                <span style={{ color: "var(--ink)" }}>SA-387 Gr 22 Cl 2 (2.25Cr-1Mo)</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                <span style={{ color: "var(--ink-3)" }}>Internal Clad:</span>
                <span style={{ color: "var(--sage)" }}>3.0mm SS 347 (API 582)</span>
              </div>
            </div>
          </div>

          {/* Discrepancy Findings Summary List */}
          <div
            style={{
              background: "var(--bg-0)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-panel)",
              padding: "16px 20px",
            }}
          >
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-3)", letterSpacing: "0.06em", marginBottom: 10 }}>
              {lang === "hi" ? "पहचाने गए संरचनात्मक दोष एवं विसंगतियाँ:" : lang === "kn" ? "ಗುರುತಿಸಲಾದ ದೋಷಗಳು:" : "IDENTIFIED STRUCTURAL ANOMALIES & DEFECTS:"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {activePreset.pins.map((pin) => (
                <div
                  key={pin.id}
                  onClick={() => setActivePinId(pin.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    background: activePin.id === pin.id ? "var(--bg-2)" : "var(--bg-1)",
                    border: activePin.id === pin.id ? "1px solid var(--line-strong)" : "1px solid transparent",
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontFamily: "var(--font-ui)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background:
                          pin.severity === "CRITICAL"
                            ? "var(--coral-text)"
                            : pin.severity === "HIGH"
                            ? "#e67e22"
                            : pin.severity === "MEDIUM"
                            ? "#f1c40f"
                            : "var(--sage)",
                      }}
                    />
                    <span style={{ color: "var(--ink)", fontWeight: 500 }}>
                      {pin.title[lang] || pin.title.en}
                    </span>
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-3)" }}>
                    {pin.codeRef.split(" ")[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
