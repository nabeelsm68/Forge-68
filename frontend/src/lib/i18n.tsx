"use client";

import React, { createContext, useContext, useState } from "react";

export type Language = "en" | "hi" | "kn";

export interface TranslationDictionary {
  // Navigation & Shell
  navMissions: string;
  navKnowledge: string;
  navGovernance: string;
  navAudit: string;
  navBoundary: string;
  navLocalOnly: string;
  navOffline: string;
  navVoiceButton: string;
  navPersona: string;
  navPersonaSelectTitle: string;
  navRbacBadge: string;
  navRbacExplanation: string;
  navContextUpdated: string;

  // Hero Section
  heroBadge: string;
  heroHeading: string;
  heroSubheading: string;
  heroStartMission: string;
  heroInspectTelemetry: string;
  heroBaselineLabel: string;
  heroBaselineSubtext: string;
  heroDeviationLabel: string;
  heroDeviationSubtext: string;
  heroAlarmDistanceLabel: string;
  heroAlarmDistanceSubtext: string;
  heroDialLabel: string;

  // Mission Views Navigation
  missionViewsLabel: string;
  viewOverview: string;
  viewWorkspace: string;
  viewEvidence: string;
  viewVerification: string;
  clearanceLabel: string;
  roleLabel: string;

  // Case Selector Rail
  caseSelectorTitle: string;
  assetLabel: string;
  resetButton: string;
  resettingText: string;
  case01Number: string;
  case01Title: string;
  case01Badge: string;
  case01Desc: string;
  case02Number: string;
  case02Title: string;
  case02Badge: string;
  case02Desc: string;
  case03Number: string;
  case03Title: string;
  case03Badge: string;
  case03Desc: string;
  case04Number: string;
  case04Title: string;
  case04Badge: string;
  case04Desc: string;
  runButton: string;
  runningButton: string;

  // Console
  consoleTitle: string;
  consoleSovereignBadge: string;
  consoleActiveContext: string;
  consolePlaceholder: string;
  consoleImageContext: string;
  consoleImageNone: string;
  consoleImageGauge: string;
  consoleImageCorrosion: string;
  consoleImageCustom: string;
  consoleUploadButton: string;
  consoleAnalyzeImageOnly: string;
  consoleExecuteLoop: string;
  consoleExecutingLoop: string;
  consoleLangLabel: string;
  consoleErrorPrefix: string;

  // Active Run Strip & States
  runIdentityScenario: string;
  runIdentityRunId: string;
  runIdentityState: string;
  runIdentityRole: string;
  runIdentityLang: string;
  runIdentityRouter: string;
  runIdentityExportDocx: string;
  runIdentityGeneratingDocx: string;
  runIdentitySovereignBadge: string;
  controlPlaneReadyTitle: string;
  controlPlaneReadyDesc: string;
  pipelineActiveTitle: string;
  pipelineActiveDesc: string;

  // Conversational Card (Greetings & Capabilities)
  convTitle: string;
  convSubtitle: string;
  convBadge: string;
  convNotice: string;

  // Image Analysis Direct Card
  visionDirectTitle: string;
  visionDirectSubtitle: string;
  visionProvenanceFile: string;
  visionProvenanceMime: string;
  visionProvenanceSize: string;
  visionProvenanceSha: string;
  visionConfidence: string;
  visionSeverity: string;
  visionObserved: string;

  // Deep Inspection Sub-Tabs
  subtabFindings: string;
  subtabTrace: string;
  subtabEvidence: string;
  subtabChecks: string;
  subtabVision: string;

  // Findings & Cards
  cardSynthesizedFindings: string;
  cardPolicyDecision: string;
  cardPolicyAction: string;
  cardPolicyRoleEvaluated: string;
  cardPolicyReason: string;
  cardModelRuntime: string;
  cardModelSovereignBadge: string;
  cardCalculationsTitle: string;
  cardNoCalculations: string;
  cardNoEvidence: string;
  cardRecommendation: string;
  latencyLabel: string;
  evidenceLabel: string;
  policyDecisionLabel: string;
  verificationLabel: string;
  timingTitle: string;

  // Knowledge Fabric
  knowledgeTitle: string;
  knowledgeSubtitle: string;
  knowledgeUploadTitle: string;
  knowledgeUploadButton: string;
  knowledgeSearchPlaceholder: string;
  knowledgeSearchButton: string;
  knowledgeReaderTitle: string;
  knowledgeExtractedText: string;
  knowledgeOcrRequiredBadge: string;
  knowledgeIndexedBadge: string;
  knowledgeChunksLabel: string;
  knowledgeHashLabel: string;
  knowledgeInspectDocButton: string;
  knowledgeEmptySearch: string;
  knowledgeNoDocs: string;
  knowledgeUploadModalTitle: string;
  knowledgeUploadModalDrop: string;
  knowledgeUploadModalClass: string;
  knowledgeUploadModalSubmit: string;
  knowledgeUploadModalClose: string;

  // Voice Assistant
  voiceModalTitle: string;
  voiceSubtitle: string;
  voiceListeningState: string;
  voiceTranscribingState: string;
  voiceSpeakingState: string;
  voiceIdleState: string;
  voiceErrorState: string;
  voiceUnavailableTitle: string;
  voiceUnavailableDesc: string;
  voiceStartListening: string;
  voiceStopListening: string;
  voiceTransferQuery: string;
  voiceExecuteQuery: string;
  voiceStopSpeaking: string;
  voiceRetry: string;
  voiceClose: string;

  // Reports
  reportExportSuccess: string;
  reportExportError: string;
}

export const translations: Record<Language, TranslationDictionary> = {
  en: {
    // Navigation & Shell
    navMissions: "Missions",
    navKnowledge: "Plant Knowledge",
    navGovernance: "Who Can Do What",
    navAudit: "Audit",
    navBoundary: "Boundary",
    navLocalOnly: "Local only",
    navOffline: "Offline",
    navVoiceButton: "Voice (Sovereign)",
    navPersona: "Persona",
    navPersonaSelectTitle: "Select User Persona",
    navRbacBadge: "RBAC ENFORCED",
    navRbacExplanation: "Switching personas dynamically updates your plant permissions, tool boundaries, and investigation authority.",
    navContextUpdated: "Access context updated: Operating as",

    // Hero Section
    heroBadge: "REVIEW REQUIRED",
    heroHeading: "Industrial AI that proposes. You decide.",
    heroSubheading: "FORGE executes sovereign, local reasoning over private plant documentation. Policy determines authority, multi-source evidence supports every proposal, and deterministic code verifies the math before action is taken.",
    heroStartMission: "Start a mission",
    heroInspectTelemetry: "Inspect telemetry",
    heroBaselineLabel: "Normal baseline",
    heroBaselineSubtext: "SOP §3.2",
    heroDeviationLabel: "Observed deviation",
    heroDeviationSubtext: "PI-204 reading",
    heroAlarmDistanceLabel: "Distance to alarm",
    heroAlarmDistanceSubtext: "Alarm at 33.5",
    heroDialLabel: "Reactor R-204 · Synthetic telemetry reading",

    // Mission Views Navigation
    missionViewsLabel: "Mission Views:",
    viewOverview: "Mission Overview",
    viewWorkspace: "AI Proposal & Actions",
    viewEvidence: "Supporting Evidence",
    viewVerification: "Why Trust This? (7 Checks)",
    clearanceLabel: "Clearance:",
    roleLabel: "Role:",

    // Case Selector Rail
    caseSelectorTitle: "SELECT INDUSTRIAL CASE",
    assetLabel: "ASSET: REACTOR R-204",
    resetButton: "↺ Reset Case State",
    resettingText: "Resetting...",
    case01Number: "01",
    case01Title: "Full Operational Investigation",
    case01Badge: "Multi-Source",
    case01Desc: "Combines plant procedures, ultrasonic thickness inspections, and live sensor readings.",
    case02Number: "02",
    case02Title: "Pressure Variance Check",
    case02Badge: "Gauge PI-204",
    case02Desc: "Reads analog dial PI-204 with local vision and checks safe margin against plant SOPs.",
    case03Number: "03",
    case03Title: "Unauthorized Actuation Test",
    case03Badge: "Permission Denied",
    case03Desc: "AI tries to run critical valve calibration; FORGE blocks it before any tool can execute.",
    case04Number: "04",
    case04Title: "Security & Injection Test",
    case04Badge: "Quarantined",
    case04Desc: "An untrusted document tries to hijack the AI; FORGE treats it as inert data, not commands.",
    runButton: "Run ▶",
    runningButton: "Running...",

    // Console
    consoleTitle: "Investigation Console",
    consoleSovereignBadge: "SOVEREIGN REASONING",
    consoleActiveContext: "Active Context:",
    consolePlaceholder: "Enter operational question or investigation query...",
    consoleImageContext: "Image Context:",
    consoleImageNone: "None (Text-only)",
    consoleImageGauge: "r204_pressure_gauge.png (Analog Dial ~33.0 bar)",
    consoleImageCorrosion: "r204_inspection_corrosion.png (Shell Wall ~2.2mm)",
    consoleImageCustom: "Custom uploaded image",
    consoleUploadButton: "Upload Image...",
    consoleAnalyzeImageOnly: "Analyze Image Only",
    consoleExecuteLoop: "Execute Investigation Loop ▶",
    consoleExecutingLoop: "Running Pipeline...",
    consoleLangLabel: "Lang:",
    consoleErrorPrefix: "[EXECUTION ERROR]",

    // Active Run Strip & States
    runIdentityScenario: "SCENARIO:",
    runIdentityRunId: "RUN ID:",
    runIdentityState: "STATE:",
    runIdentityRole: "ROLE:",
    runIdentityLang: "LANG:",
    runIdentityRouter: "ROUTER:",
    runIdentityExportDocx: "📄 Export Word Report (.docx)",
    runIdentityGeneratingDocx: "Generating .docx...",
    runIdentitySovereignBadge: "SOVEREIGN LOCAL RUNTIME · ZERO CLOUD CALLS",
    controlPlaneReadyTitle: "Select an Industrial Case Above or Dispatch a Query",
    controlPlaneReadyDesc: "Click \"Run ▶\" on Cases 01, 02, 03, or 04 or submit a custom question for deterministic evidence grounding.",
    pipelineActiveTitle: "Sovereign Pipeline Active",
    pipelineActiveDesc: "Executing sovereign reasoning over private plant knowledge, evaluating policies, and verifying mathematical proofs.",

    // Conversational Card
    convTitle: "SOVEREIGN AGENT CONVERSATION",
    convSubtitle: "DIRECT ASSISTANCE · ZERO FABRICATED TELEMETRY",
    convBadge: "CONVERSATIONAL",
    convNotice: "General query processed without triggering plant actuation or fabricating unobserved physical metrics.",

    // Image Analysis Direct Card
    visionDirectTitle: "Camera / Gauge Observations",
    visionDirectSubtitle: "DIRECT MULTIMODAL INFERENCE · NO MISSION DOSSIER BLEED",
    visionProvenanceFile: "Filename:",
    visionProvenanceMime: "MIME:",
    visionProvenanceSize: "Size:",
    visionProvenanceSha: "SHA-256:",
    visionConfidence: "Confidence:",
    visionSeverity: "Severity:",
    visionObserved: "Observed:",

    // Deep Inspection Sub-Tabs
    subtabFindings: "Case Summary",
    subtabTrace: "Activity Timeline",
    subtabEvidence: "Supporting Evidence",
    subtabChecks: "Why Trust This? (7 Checks)",
    subtabVision: "Camera / Gauge Observations",

    // Findings & Cards
    cardSynthesizedFindings: "SYNTHESIZED TECHNICAL FINDINGS",
    cardPolicyDecision: "POLICY DECISION",
    cardPolicyAction: "Action:",
    cardPolicyRoleEvaluated: "Role Evaluated:",
    cardPolicyReason: "Reason:",
    cardModelRuntime: "MODEL & RUNTIME",
    cardModelSovereignBadge: "SOVEREIGN ON-PREM",
    cardCalculationsTitle: "DETERMINISTIC VERIFIED CALCULATIONS",
    cardNoCalculations: "No mathematical calculations required or performed for this query.",
    cardNoEvidence: "No external document evidence required for this conversational inquiry.",
    cardRecommendation: "Recommendation:",
    latencyLabel: "LATENCY",
    evidenceLabel: "EVIDENCE",
    policyDecisionLabel: "POLICY DECISION",
    verificationLabel: "VERIFICATION",
    timingTitle: "EXECUTION TIMING:",

    // Knowledge Fabric
    knowledgeTitle: "Plant Knowledge Fabric",
    knowledgeSubtitle: "Local sovereign vector search and air-gapped document intelligence without external cloud data transmission.",
    knowledgeUploadTitle: "Local Document Library",
    knowledgeUploadButton: "📤 Upload Document",
    knowledgeSearchPlaceholder: "Search operational procedures, maintenance reports, specs...",
    knowledgeSearchButton: "Search Records ▶",
    knowledgeReaderTitle: "Document Inspector",
    knowledgeExtractedText: "Extracted Text Content",
    knowledgeOcrRequiredBadge: "OCR REQUIRED",
    knowledgeIndexedBadge: "INDEXED",
    knowledgeChunksLabel: "Chunks:",
    knowledgeHashLabel: "SHA-256:",
    knowledgeInspectDocButton: "Inspect Document ↗",
    knowledgeEmptySearch: "No indexed passages matched your search query.",
    knowledgeNoDocs: "No plant documents registered in local store.",
    knowledgeUploadModalTitle: "Upload Local Document",
    knowledgeUploadModalDrop: "Drop PDF, TXT, or Markdown file here or click to select",
    knowledgeUploadModalClass: "Document Classification:",
    knowledgeUploadModalSubmit: "Ingest & Index Document",
    knowledgeUploadModalClose: "Close",

    // Voice Assistant
    voiceModalTitle: "Sovereign Voice Assistant",
    voiceSubtitle: "Local on-premise speech recognition and audio response. Zero cloud APIs.",
    voiceListeningState: "Listening... Speak your operational question",
    voiceTranscribingState: "Transcribing audio locally on-device...",
    voiceSpeakingState: "Speaking sovereign response aloud...",
    voiceIdleState: "Microphone ready for sovereign voice inquiry.",
    voiceErrorState: "Voice processing encountered an error.",
    voiceUnavailableTitle: "Local Voice Engine Not Installed",
    voiceUnavailableDesc: "FORGE strictly forbids Google, Apple, or OpenAI cloud speech APIs. To enable local STT, install vosk or whisper.cpp on this host. Text console is 100% operational.",
    voiceStartListening: "🎙 Start Listening",
    voiceStopListening: "⏹ Stop & Transcribe",
    voiceTransferQuery: "Transfer to Query Field",
    voiceExecuteQuery: "Review & Execute Loop ▶",
    voiceStopSpeaking: "🔇 Stop Speaking",
    voiceRetry: "↺ Retry",
    voiceClose: "Close",

    // Reports
    reportExportSuccess: "Mission Word report exported successfully.",
    reportExportError: "Failed to generate Word report.",
  },

  hi: {
    // Navigation & Shell
    navMissions: "अभियान (Missions)",
    navKnowledge: "संयंत्र ज्ञान (Knowledge)",
    navGovernance: "अधिकार क्षेत्र (Governance)",
    navAudit: "ऑडिट (Audit)",
    navBoundary: "सुरक्षा सीमा (Boundary)",
    navLocalOnly: "केवल स्थानीय (Local only)",
    navOffline: "ऑफ़लाइन (Offline)",
    navVoiceButton: "ध्वनि सहायक (Voice)",
    navPersona: "भूमिका (Persona)",
    navPersonaSelectTitle: "उपयोगकर्ता भूमिका चुनें",
    navRbacBadge: "RBAC लागू",
    navRbacExplanation: "भूमिका बदलने से आपके संयंत्र अनुमतियां, टूल सीमाएं और जांच अधिकार स्वतः अपडेट हो जाते हैं।",
    navContextUpdated: "पहुंच संदर्भ अपडेट किया गया: भूमिका",

    // Hero Section
    heroBadge: "समीक्षा आवश्यक",
    heroHeading: "औद्योगिक AI जो प्रस्ताव देता है। निर्णय आपका।",
    heroSubheading: "FORGE निजी संयंत्र दस्तावेजों पर संप्रभु, स्थानीय तर्क निष्पादित करता है। नीति अधिकार तय करती है, बहु-स्रोत साक्ष्य हर प्रस्ताव का समर्थन करते हैं, और गणितीय सत्यापन के बाद ही कार्रवाई होती है।",
    heroStartMission: "अभियान शुरू करें",
    heroInspectTelemetry: "टेलीमेट्री जांचें",
    heroBaselineLabel: "सामान्य आधार रेखा",
    heroBaselineSubtext: "SOP §3.2",
    heroDeviationLabel: "देखा गया विचलन",
    heroDeviationSubtext: "PI-204 रीडिंग",
    heroAlarmDistanceLabel: "अलार्म से दूरी",
    heroAlarmDistanceSubtext: "अलार्म 33.5 पर",
    heroDialLabel: "रिएक्टर R-204 · टेलीमेट्री रीडिंग",

    // Mission Views Navigation
    missionViewsLabel: "अभियान दृश्य:",
    viewOverview: "अभियान सारांश",
    viewWorkspace: "AI प्रस्ताव व कार्य",
    viewEvidence: "समर्थक साक्ष्य",
    viewVerification: "सत्यापन प्रमाण (7 जांच)",
    clearanceLabel: "गोपनीयता स्तर:",
    roleLabel: "भूमिका:",

    // Case Selector Rail
    caseSelectorTitle: "औद्योगिक केस चुनें",
    assetLabel: "संपत्ति: रिएक्टर R-204",
    resetButton: "↺ केस रीसेट करें",
    resettingText: "रीसेट हो रहा है...",
    case01Number: "01",
    case01Title: "पूर्ण परिचालन जांच",
    case01Badge: "बहु-स्रोत",
    case01Desc: "संयंत्र प्रक्रियाओं, अल्ट्रासोनिक मोटाई निरीक्षण और लाइव सेंसर रीडिंग का संयोजन।",
    case02Number: "02",
    case02Title: "दबाव विचरण जांच",
    case02Badge: "गेज PI-204",
    case02Desc: "स्थानीय दृष्टि से एनालॉग डायल PI-204 को पढ़ता है और SOP के विरुद्ध सुरक्षित मार्जिन जांचता है।",
    case03Number: "03",
    case03Title: "अनधिकृत संचालन परीक्षण",
    case03Badge: "अनुमति अस्वीकृत",
    case03Desc: "AI महत्वपूर्ण वाल्व कैलिब्रेशन का प्रयास करता है; FORGE किसी भी टूल चलने से पहले इसे रोकता है।",
    case04Number: "04",
    case04Title: "सुरक्षा एवं इंजेक्शन परीक्षण",
    case04Badge: "संगरोधित (Quarantined)",
    case04Desc: "एक अविश्वसनीय दस्तावेज़ AI को नियंत्रित करने की कोशिश करता है; FORGE इसे केवल डेटा मानता है।",
    runButton: "चलाएं ▶",
    runningButton: "चल रहा है...",

    // Console
    consoleTitle: "जांच कंसोल",
    consoleSovereignBadge: "संप्रभु तर्क",
    consoleActiveContext: "सक्रिय संदर्भ:",
    consolePlaceholder: "परिचालन प्रश्न या जांच क्वेरी दर्ज करें...",
    consoleImageContext: "छवि संदर्भ:",
    consoleImageNone: "कोई नहीं (केवल पाठ)",
    consoleImageGauge: "r204_pressure_gauge.png (एनालॉग डायल ~33.0 bar)",
    consoleImageCorrosion: "r204_inspection_corrosion.png (दीवार मोटाई ~2.2mm)",
    consoleImageCustom: "कस्टम अपलोड की गई छवि",
    consoleUploadButton: "छवि अपलोड करें...",
    consoleAnalyzeImageOnly: "केवल छवि का विश्लेषण करें",
    consoleExecuteLoop: "जांच लूप निष्पादित करें ▶",
    consoleExecutingLoop: "पाइपलाइन चल रही है...",
    consoleLangLabel: "भाषा:",
    consoleErrorPrefix: "[निष्पादन त्रुटि]",

    // Active Run Strip & States
    runIdentityScenario: "परिदृश्य:",
    runIdentityRunId: "रन ID:",
    runIdentityState: "स्थिति:",
    runIdentityRole: "भूमिका:",
    runIdentityLang: "भाषा:",
    runIdentityRouter: "राउटर:",
    runIdentityExportDocx: "📄 वर्ड रिपोर्ट डाउनलोड करें (.docx)",
    runIdentityGeneratingDocx: "रिपोर्ट बन रही है...",
    runIdentitySovereignBadge: "संप्रभु स्थानीय रनटाइम · शून्य क्लाउड कॉल",
    controlPlaneReadyTitle: "ऊपर एक औद्योगिक केस चुनें या क्वेरी भेजें",
    controlPlaneReadyDesc: "केस 01, 02, 03 या 04 पर \"चलाएं ▶\" क्लिक करें या साक्ष्य-आधारित सत्यापन के लिए प्रश्न दर्ज करें।",
    pipelineActiveTitle: "संप्रभु पाइपलाइन सक्रिय",
    pipelineActiveDesc: "निजी संयंत्र ज्ञान पर स्थानीय तर्क निष्पादन, नीति मूल्यांकन और गणितीय प्रमाण सत्यापन जारी है।",

    // Conversational Card
    convTitle: "संप्रभु एजेंट संवाद",
    convSubtitle: "प्रत्यक्ष सहायता · शून्य गढ़ी गई टेलीमेट्री",
    convBadge: "संवादात्मक",
    convNotice: "सामान्य प्रश्न का उत्तर बिना किसी टूल निष्पादन या काल्पनिक टेलीमेट्री बनाए दिया गया।",

    // Image Analysis Direct Card
    visionDirectTitle: "कैमरा / गेज प्रेक्षण",
    visionDirectSubtitle: "प्रत्यक्ष मल्टीमॉडल विश्लेषण · पुराना मिशन डेटा शामिल नहीं",
    visionProvenanceFile: "फ़ाइल नाम:",
    visionProvenanceMime: "MIME:",
    visionProvenanceSize: "आकार:",
    visionProvenanceSha: "SHA-256:",
    visionConfidence: "विश्वास स्कोर:",
    visionSeverity: "गंभीरता:",
    visionObserved: "अवलोकन:",

    // Deep Inspection Sub-Tabs
    subtabFindings: "केस सारांश",
    subtabTrace: "गतिविधि समयरेखा",
    subtabEvidence: "समर्थक साक्ष्य",
    subtabChecks: "सत्यापन प्रमाण (7 जांच)",
    subtabVision: "कैमरा / गेज प्रेक्षण",

    // Findings & Cards
    cardSynthesizedFindings: "संश्लेषित तकनीकी निष्कर्ष",
    cardPolicyDecision: "नीति निर्णय",
    cardPolicyAction: "कार्रवाई:",
    cardPolicyRoleEvaluated: "मूल्यांकित भूमिका:",
    cardPolicyReason: "कारण:",
    cardModelRuntime: "मॉडल व रनटाइम",
    cardModelSovereignBadge: "संप्रभु ऑन-प्रिमाइसेस",
    cardCalculationsTitle: "सत्यापित गणितीय गणनाएं",
    cardNoCalculations: "इस प्रश्न के लिए किसी गणितीय गणना की आवश्यकता नहीं थी।",
    cardNoEvidence: "इस संवादात्मक प्रश्न के लिए बाहरी दस्तावेज़ साक्ष्य की आवश्यकता नहीं थी।",
    cardRecommendation: "सिफारिश:",
    latencyLabel: "विलंबता",
    evidenceLabel: "साक्ष्य",
    policyDecisionLabel: "नीति निर्णय",
    verificationLabel: "सत्यापन",
    timingTitle: "निष्पादन समय:",

    // Knowledge Fabric
    knowledgeTitle: "संयंत्र ज्ञान प्रणाली",
    knowledgeSubtitle: "स्थानीय संप्रभु वेक्टर खोज और एयर-गैप्ड दस्तावेज़ विश्लेषण बिना किसी क्लाउड डेटा संचरण के।",
    knowledgeUploadTitle: "स्थानीय दस्तावेज़ पुस्तकालय",
    knowledgeUploadButton: "📤 दस्तावेज़ अपलोड करें",
    knowledgeSearchPlaceholder: "परिचालन प्रक्रियाएं, रखरखाव रिपोर्ट, विनिर्देश खोजें...",
    knowledgeSearchButton: "रिकॉर्ड खोजें ▶",
    knowledgeReaderTitle: "दस्तावेज़ निरीक्षक",
    knowledgeExtractedText: "निकाला गया पाठ सामग्री",
    knowledgeOcrRequiredBadge: "OCR आवश्यक",
    knowledgeIndexedBadge: "अनुक्रमित",
    knowledgeChunksLabel: "खंड:",
    knowledgeHashLabel: "SHA-256:",
    knowledgeInspectDocButton: "दस्तावेज़ खोलें ↗",
    knowledgeEmptySearch: "आपकी खोज क्वेरी से मेल खाने वाला कोई अंश नहीं मिला।",
    knowledgeNoDocs: "स्थानीय स्टोर में कोई संयंत्र दस्तावेज़ पंजीकृत नहीं है।",
    knowledgeUploadModalTitle: "स्थानीय दस्तावेज़ अपलोड करें",
    knowledgeUploadModalDrop: "PDF, TXT, या Markdown फ़ाइल यहाँ छोड़ें या चुनने के लिए क्लिक करें",
    knowledgeUploadModalClass: "दस्तावेज़ वर्गीकरण:",
    knowledgeUploadModalSubmit: "दस्तावेज़ शामिल करें व अनुक्रमित करें",
    knowledgeUploadModalClose: "बंद करें",

    // Voice Assistant
    voiceModalTitle: "संप्रभु ध्वनि सहायक",
    voiceSubtitle: "स्थानीय ऑन-प्रिमाइसेस वाक पहचान और ऑडियो उत्तर। शून्य क्लाउड API।",
    voiceListeningState: "सुन रहा हूँ... अपना परिचालन प्रश्न बोलें",
    voiceTranscribingState: "ऑडियो को स्थानीय रूप से ट्रांसक्राइब किया जा रहा है...",
    voiceSpeakingState: "संप्रभु उत्तर बोलकर सुनाया जा रहा है...",
    voiceIdleState: "संप्रभु ध्वनि प्रश्न के लिए माइक्रोफ़ोन तैयार है।",
    voiceErrorState: "ध्वनि प्रसंस्करण में त्रुटि आई।",
    voiceUnavailableTitle: "स्थानीय ध्वनि इंजन स्थापित नहीं है",
    voiceUnavailableDesc: "FORGE Google, Apple या OpenAI क्लाउड वाक API को सख्ती से रोकता है। स्थानीय STT सक्षम करने के लिए इस होस्ट पर vosk या whisper.cpp स्थापित करें। टेक्स्ट कंसोल पूरी तरह कार्यशील है।",
    voiceStartListening: "🎙 सुनना शुरू करें",
    voiceStopListening: "⏹ रोकें और ट्रांसक्राइब करें",
    voiceTransferQuery: "क्वेरी फ़ील्ड में भेजें",
    voiceExecuteQuery: "समीक्षा करें और निष्पादित करें ▶",
    voiceStopSpeaking: "🔇 बोलना बंद करें",
    voiceRetry: "↺ पुनः प्रयास करें",
    voiceClose: "बंद करें",

    // Reports
    reportExportSuccess: "मिशन वर्ड रिपोर्ट सफलतापूर्वक निर्यात की गई।",
    reportExportError: "वर्ड रिपोर्ट बनाने में विफल।",
  },

  kn: {
    // Navigation & Shell
    navMissions: "ಕಾರ್ಯಾಚರಣೆಗಳು (Missions)",
    navKnowledge: "ಸ್ಥಾವರ ಜ್ಞಾನ (Knowledge)",
    navGovernance: "ಅಧಿಕಾರ ನಿರ್ವಹಣೆ (Governance)",
    navAudit: "ಆಡಿಟ್ (Audit)",
    navBoundary: "ರಕ್ಷಣಾ ಗಡಿ (Boundary)",
    navLocalOnly: "ಸ್ಥಳೀಯ ಮಾತ್ರ (Local only)",
    navOffline: "ಆಫ್‌ಲೈನ್ (Offline)",
    navVoiceButton: "ಧ್ವನಿ ಸಹಾಯಕ (Voice)",
    navPersona: "ಪಾತ್ರ (Persona)",
    navPersonaSelectTitle: "ಬಳಕೆದಾರರ ಪಾತ್ರ ಆಯ್ಕೆಮಾಡಿ",
    navRbacBadge: "RBAC ಜಾರಿಯಲ್ಲಿದೆ",
    navRbacExplanation: "ಪಾತ್ರವನ್ನು ಬದಲಾಯಿಸುವುದರಿಂದ ನಿಮ್ಮ ಸ್ಥಾವರ ಅನುಮತಿಗಳು, ಟೂಲ್ ಗಡಿಗಳು ಮತ್ತು ತನಿಖಾ ಅಧಿಕಾರವು ನವೀಕರಿಸಲ್ಪಡುತ್ತದೆ.",
    navContextUpdated: "ಪ್ರವೇಶ ಸಂದರ್ಭ ನವೀಕರಿಸಲಾಗಿದೆ: ಪಾತ್ರ",

    // Hero Section
    heroBadge: "ಪರಿಶೀಲನೆ ಅಗತ್ಯವಿದೆ",
    heroHeading: "ಪ್ರಸ್ತಾಪಿಸುವ ಕೈಗಾರಿಕಾ AI. ನಿರ್ಧಾರ ನಿಮ್ಮದು.",
    heroSubheading: "FORGE ಖಾಸಗಿ ಸ್ಥಾವರ ದಾಖಲೆಗಳ ಮೇಲೆ ಸಾರ್ವಭೌಮ, ಸ್ಥಳೀಯ ತಾರ್ಕಿಕತೆಯನ್ನು ನಿರ್ವಹಿಸುತ್ತದೆ. ನೀತಿಯು ಅಧಿಕಾರವನ್ನು ನಿರ್ಧರಿಸುತ್ತದೆ, ಬಹು-ಮೂಲ ಪುರಾವೆಗಳು ಪ್ರತಿಯೊಂದು ಪ್ರಸ್ತಾಪವನ್ನು ಬೆಂಬಲಿಸುತ್ತವೆ, ಮತ್ತು ಗಣಿತವನ್ನು ಪರಿಶೀಲಿಸಿದ ನಂತರವೇ ಕ್ರಮ ಕೈಗೊಳ್ಳಲಾಗುತ್ತದೆ.",
    heroStartMission: "ಕಾರ್ಯಾಚರಣೆ ಪ್ರಾರಂಭಿಸಿ",
    heroInspectTelemetry: "ಟೆಲಿಮೆಟ್ರಿ ಪರಿಶೀಲಿಸಿ",
    heroBaselineLabel: "ಸಾಮಾನ್ಯ ಮೂಲರೇಖೆ",
    heroBaselineSubtext: "SOP §3.2",
    heroDeviationLabel: "ಕಂಡುಬಂದ ವ್ಯತ್ಯಾಸ",
    heroDeviationSubtext: "PI-204 ವಾಚನ",
    heroAlarmDistanceLabel: "ಎಚ್ಚರಿಕೆಯ ಮಿತಿ ಅಂತರ",
    heroAlarmDistanceSubtext: "33.5 ರಲ್ಲಿ ಎಚ್ಚರಿಕೆ",
    heroDialLabel: "ರಿಯಾಕ್ಟರ್ R-204 · ಟೆಲಿಮೆಟ್ರಿ ವಾಚನ",

    // Mission Views Navigation
    missionViewsLabel: "ವೀಕ್ಷಣೆಗಳು:",
    viewOverview: "ಕಾರ್ಯಾಚರಣೆ ಅವಲೋಕನ",
    viewWorkspace: "AI ಪ್ರಸ್ತಾಪ ಮತ್ತು ಕ್ರಮಗಳು",
    viewEvidence: "ಬೆಂಬಲಿಸುವ ಪುರಾವೆಗಳು",
    viewVerification: "ಪರಿಶೀಲನಾ ಪುರಾವೆ (7 ತಪಾಸಣೆಗಳು)",
    clearanceLabel: "ಗೌಪ್ಯತೆ ಮಟ್ಟ:",
    roleLabel: "ಪಾತ್ರ:",

    // Case Selector Rail
    caseSelectorTitle: "ಕೈಗಾರಿಕಾ ಪ್ರಕರಣ ಆಯ್ಕೆಮಾಡಿ",
    assetLabel: "ಆಸ್ತಿ: ರಿಯಾಕ್ಟರ್ R-204",
    resetButton: "↺ ಸ್ಥಿತಿ ಮರುಹೊಂದಿಸಿ",
    resettingText: "ಮರುಹೊಂದಿಸಲಾಗುತ್ತಿದೆ...",
    case01Number: "01",
    case01Title: "ಪೂರ್ಣ ಕಾರ್ಯಾಚರಣೆಯ ತನಿಖೆ",
    case01Badge: "ಬಹು-ಮೂಲ",
    case01Desc: "ಸ್ಥಾವರ ಕಾರ್ಯವಿಧಾನಗಳು, ಅಲ್ಟ್ರಾಸಾನಿಕ್ ದಪ್ಪ ತಪಾಸಣೆಗಳು ಮತ್ತು ನೇರ ಸಂವೇದಕ ವಾಚನಗಳನ್ನು ಸಂಯೋಜಿಸುತ್ತದೆ.",
    case02Number: "02",
    case02Title: "ಒತ್ತಡ ವ್ಯತ್ಯಾಸ ತಪಾಸಣೆ",
    case02Badge: "ಗೇಜ್ PI-204",
    case02Desc: "ಸ್ಥಳೀಯ ದೃಷ್ಟಿಯಿಂದ ಅನಲಾಗ್ ಡಯಲ್ PI-204 ಅನ್ನು ಓದುತ್ತದೆ ಮತ್ತು SOP ಗೆ ಅನುಗುಣವಾಗಿ ಸುರಕ್ಷಿತ ಅಂತರವನ್ನು ಪರಿಶೀಲಿಸುತ್ತದೆ.",
    case03Number: "03",
    case03Title: "ಅನಧಿಕೃತ ಕಾರ್ಯಾಚರಣೆ ಪರೀಕ್ಷೆ",
    case03Badge: "ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ",
    case03Desc: "AI ನಿರ್ಣಾಯಕ ಕವಾಟ ಮಾಪನಾಂಕ ನಿರ್ಣಯಕ್ಕೆ ಪ್ರಯತ್ನಿಸುತ್ತದೆ; FORGE ಯಾವುದೇ ಟೂಲ್ ಚಾಲನೆಯಾಗುವ ಮುನ್ನ ಅದನ್ನು ನಿರ್ಬಂಧಿಸುತ್ತದೆ.",
    case04Number: "04",
    case04Title: "ಭದ್ರತೆ ಮತ್ತು ಇಂಜೆಕ್ಷನ್ ಪರೀಕ್ಷೆ",
    case04Badge: "ಪ್ರತ್ಯೇಕಿಸಲಾಗಿದೆ (Quarantined)",
    case04Desc: "ಅನಪೇಕ್ಷಿತ ದಾಖಲೆಯೊಂದು AI ಅನ್ನು ನಿಯಂತ್ರಿಸಲು ಪ್ರಯತ್ನಿಸುತ್ತದೆ; FORGE ಇದನ್ನು ಕೇವಲ ಡೇಟಾ ಎಂದು ಪರಿಗಣಿಸುತ್ತದೆ.",
    runButton: "ಚಲಾಯಿಸಿ ▶",
    runningButton: "ಚಾಲನೆಯಲ್ಲಿದೆ...",

    // Console
    consoleTitle: "ತನಿಖಾ ಕನ್ಸೋಲ್",
    consoleSovereignBadge: "ಸಾರ್ವಭೌಮ ತರ್ಕ",
    consoleActiveContext: "ಸಕ್ರಿಯ ಸಂದರ್ಭ:",
    consolePlaceholder: "ಕಾರ್ಯಾಚರಣೆಯ ಪ್ರಶ್ನೆ ಅಥವಾ ತನಿಖಾ ವಿಚಾರಣೆಯನ್ನು ನಮೂದಿಸಿ...",
    consoleImageContext: "ಚಿತ್ರದ ಸಂದರ್ಭ:",
    consoleImageNone: "ಯಾವುದೂ ಇಲ್ಲ (ಪಠ್ಯ ಮಾತ್ರ)",
    consoleImageGauge: "r204_pressure_gauge.png (ಅನಲಾಗ್ ಡಯಲ್ ~33.0 bar)",
    consoleImageCorrosion: "r204_inspection_corrosion.png (ಗೋಡೆ ದಪ್ಪ ~2.2mm)",
    consoleImageCustom: "ಕಸ್ಟಮ್ ಅಪ್‌ಲೋಡ್ ಮಾಡಿದ ಚಿತ್ರ",
    consoleUploadButton: "ಚಿತ್ರ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ...",
    consoleAnalyzeImageOnly: "ಚಿತ್ರವನ್ನು ಮಾತ್ರ ವಿಶ್ಲೇಷಿಸಿ",
    consoleExecuteLoop: "ತನಿಖಾ ಲೂಪ್ ಚಲಾಯಿಸಿ ▶",
    consoleExecutingLoop: "ಪೈಪ್‌ಲೈನ್ ಚಾಲನೆಯಲ್ಲಿದೆ...",
    consoleLangLabel: "ಭಾಷೆ:",
    consoleErrorPrefix: "[ಕಾರ್ಯಗತಗೊಳಿಸುವ ದೋಷ]",

    // Active Run Strip & States
    runIdentityScenario: "ಪ್ರಕರಣ:",
    runIdentityRunId: "ರನ್ ID:",
    runIdentityState: "ಸ್ಥಿತಿ:",
    runIdentityRole: "ಪಾತ್ರ:",
    runIdentityLang: "ಭಾಷೆ:",
    runIdentityRouter: "ರೌಟರ್:",
    runIdentityExportDocx: "📄 ವರ್ಡ್ ವರದಿ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ (.docx)",
    runIdentityGeneratingDocx: "ವರದಿ ಸಿದ್ಧವಾಗುತ್ತಿದೆ...",
    runIdentitySovereignBadge: "ಸಾರ್ವಭೌಮ ಸ್ಥಳೀಯ ರನ್‌ಟೈಮ್ · ಶೂನ್ಯ ಕ್ಲೌಡ್ ಕರೆಗಳು",
    controlPlaneReadyTitle: "ಮೇಲೆ ಒಂದು ಕೈಗಾರಿಕಾ ಪ್ರಕರಣವನ್ನು ಆಯ್ಕೆಮಾಡಿ ಅಥವಾ ಪ್ರಶ್ನೆಯನ್ನು ಕಳುಹಿಸಿ",
    controlPlaneReadyDesc: "ಪ್ರಕರಣ 01, 02, 03, ಅಥವಾ 04 ರ ಮೇಲೆ \"ಚಲಾಯಿಸಿ ▶\" ಕ್ಲಿಕ್ ಮಾಡಿ ಅಥವಾ ನಿಖರ ಸಾಕ್ಷ್ಯಾಧಾರಿತ ಪರಿಶೀಲನೆಗಾಗಿ ಪ್ರಶ್ನೆ ನಮೂದಿಸಿ.",
    pipelineActiveTitle: "ಸಾರ್ವಭೌಮ ಪೈಪ್‌ಲೈನ್ ಸಕ್ರಿಯವಾಗಿದೆ",
    pipelineActiveDesc: "ಖಾಸಗಿ ಸ್ಥಾವರ ಜ್ಞಾನದ ಮೇಲೆ ಸ್ಥಳೀಯ ತರ್ಕ, ನೀತಿ ಮೌಲ್ಯಮಾಪನ ಮತ್ತು ಗಣಿತದ ಪುರಾವೆಗಳ ಪರಿಶೀಲನೆ ಮುಂದುವರಿದಿದೆ.",

    // Conversational Card
    convTitle: "ಸಾರ್ವಭೌಮ ಏಜೆಂಟ್ ಸಂಭಾಷಣೆ",
    convSubtitle: "ನೇರ ಸಹಾಯ · ಶೂನ್ಯ ಕಾಲ್ಪನಿಕ ಟೆಲಿಮೆಟ್ರಿ",
    convBadge: "ಸಂಭಾಷಣಾತ್ಮಕ",
    convNotice: "ಸ್ಥಾವರ ಉಪಕರಣಗಳನ್ನು ಚಲಾಯಿಸದೆ ಅಥವಾ ಕಾಲ್ಪನಿಕ ಅಳತೆಗಳನ್ನು ಸೃಷ್ಟಿಸದೆ ಸಾಮಾನ್ಯ ವಿಚಾರಣೆಗೆ ಉತ್ತರಿಸಲಾಗಿದೆ.",

    // Image Analysis Direct Card
    visionDirectTitle: "ಕ್ಯಾಮೆರಾ / ಗೇಜ್ ಅವಲೋಕನಗಳು",
    visionDirectSubtitle: "ನೇರ ಮಲ್ಟಿಮೋಡಲ್ ವಿಶ್ಲೇಷಣೆ · ಹಳೆಯ ಮಿಷನ್ ಮಾಹಿತಿ ಒಳಗೊಂಡಿಲ್ಲ",
    visionProvenanceFile: "ಫೈಲ್ ಹೆಸರು:",
    visionProvenanceMime: "MIME:",
    visionProvenanceSize: "ಗಾತ್ರ:",
    visionProvenanceSha: "SHA-256:",
    visionConfidence: "ವಿಶ್ವಾಸಾರ್ಹತೆ:",
    visionSeverity: "ತೀವ್ರತೆ:",
    visionObserved: "ಅವಲೋಕನ:",

    // Deep Inspection Sub-Tabs
    subtabFindings: "ಪ್ರಕರಣ ಸಾರಾಂಶ",
    subtabTrace: "ಚಟುವಟಿಕೆ ಟೈಮ್‌ಲೈನ್",
    subtabEvidence: "ಬೆಂಬಲಿಸುವ ಪುರಾವೆಗಳು",
    subtabChecks: "ಪರಿಶೀಲನಾ ಪುರಾವೆ (7 ತಪಾಸಣೆಗಳು)",
    subtabVision: "ಕ್ಯಾಮೆರಾ / ಗೇಜ್ ಅವಲೋಕನಗಳು",

    // Findings & Cards
    cardSynthesizedFindings: "ಸಂಶ್ಲೇಷಿತ ತಾಂತ್ರಿಕ ಸಂಶೋಧನೆಗಳು",
    cardPolicyDecision: "ನೀತಿ ನಿರ್ಧಾರ",
    cardPolicyAction: "ಕ್ರಮ:",
    cardPolicyRoleEvaluated: "ಮೌಲ್ಯಮಾಪನ ಮಾಡಿದ ಪಾತ್ರ:",
    cardPolicyReason: "ಕಾರಣ:",
    cardModelRuntime: "ಮಾದರಿ ಮತ್ತು ರನ್‌ಟೈಮ್",
    cardModelSovereignBadge: "ಸಾರ್ವಭೌಮ ಆನ್-ಪ್ರೆಮಿಸಸ್",
    cardCalculationsTitle: "ಪರಿಶೀಲಿಸಿದ ಗಣಿತದ ಲೆಕ್ಕಾಚಾರಗಳು",
    cardNoCalculations: "ಈ ಪ್ರಶ್ನೆಗೆ ಯಾವುದೇ ಗಣಿತದ ಲೆಕ್ಕಾಚಾರಗಳ ಅಗತ್ಯವಿಲ್ಲ ಅಥವಾ ನಡೆಸಲಾಗಿಲ್ಲ.",
    cardNoEvidence: "ಈ ಸಂಭಾಷಣಾ ಪ್ರಶ್ನೆಗೆ ಬಾಹ್ಯ ದಾಖಲೆಯ ಪುರಾವೆ ಅಗತ್ಯವಿಲ್ಲ.",
    cardRecommendation: "ಶಿಫಾರಸು:",
    latencyLabel: "ವಿಳಂಬತೆ",
    evidenceLabel: "ಪುರಾವೆ",
    policyDecisionLabel: "ನೀತಿ ನಿರ್ಧಾರ",
    verificationLabel: "ಪರಿಶೀಲನೆ",
    timingTitle: "ಕಾರ್ಯಗತಗೊಳಿಸುವ ಸಮಯ:",

    // Knowledge Fabric
    knowledgeTitle: "ಸ್ಥಾವರ ಜ್ಞಾನ ವ್ಯವಸ್ಥೆ",
    knowledgeSubtitle: "ಕ್ಲೌಡ್ ಡೇಟಾ ರವಾನೆಯಿಲ್ಲದೆ ಸ್ಥಳೀಯ ಸಾರ್ವಭೌಮ ವೆಕ್ಟರ್ ಹುಡುಕಾಟ ಮತ್ತು ಏರ್-ಗ್ಯಾಪ್ಡ್ ದಾಖಲೆ ವಿಶ್ಲೇಷಣೆ.",
    knowledgeUploadTitle: "ಸ್ಥಳೀಯ ದಾಖಲೆ ಗ್ರಂಥಾಲಯ",
    knowledgeUploadButton: "📤 ದಾಖಲೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
    knowledgeSearchPlaceholder: "ಕಾರ್ಯಾಚರಣೆಯ ಪ್ರಕ್ರಿಯೆಗಳು, ನಿರ್ವಹಣಾ ವರದಿಗಳು, ವಿಶೇಷಣಗಳನ್ನು ಹುಡುಕಿ...",
    knowledgeSearchButton: "ದಾಖಲೆಗಳನ್ನು ಹುಡುಕಿ ▶",
    knowledgeReaderTitle: "ದಾಖಲೆ ಪರಿವೀಕ್ಷಕ",
    knowledgeExtractedText: "ಹೊರತೆಗೆಯಲಾದ ಪಠ್ಯ ವಿಷಯ",
    knowledgeOcrRequiredBadge: "OCR ಅಗತ್ಯವಿದೆ",
    knowledgeIndexedBadge: "ಸೂಚ್ಯಂಕಿತಗೊಂಡಿದೆ",
    knowledgeChunksLabel: "ವಿಭಾಗಗಳು:",
    knowledgeHashLabel: "SHA-256:",
    knowledgeInspectDocButton: "ದಾಖಲೆ ತೆರೆಯಿರಿ ↗",
    knowledgeEmptySearch: "ನಿಮ್ಮ ಹುಡುಕಾಟಕ್ಕೆ ಹೊಂದಿಕೆಯಾಗುವ ಯಾವುದೇ ದಾಖಲೆ ಕಂಡುಬಂದಿಲ್ಲ.",
    knowledgeNoDocs: "ಸ್ಥಳೀಯ ಸಂಗ್ರಹಣೆಯಲ್ಲಿ ಯಾವುದೇ ಸ್ಥಾವರ ದಾಖಲೆಗಳು ನೋಂದಾಯಿಸಲ್ಪಟ್ಟಿಲ್ಲ.",
    knowledgeUploadModalTitle: "ಸ್ಥಳೀಯ ದಾಖಲೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
    knowledgeUploadModalDrop: "PDF, TXT, ಅಥವಾ Markdown ಫೈಲ್ ಅನ್ನು ಇಲ್ಲಿ ಬಿಡಿ ಅಥವಾ ಆಯ್ಕೆ ಮಾಡಲು ಕ್ಲಿಕ್ ಮಾಡಿ",
    knowledgeUploadModalClass: "ದಾಖಲೆ ವರ್ಗೀಕರಣ:",
    knowledgeUploadModalSubmit: "ದಾಖಲೆ ಸೇರಿಸಿ ಮತ್ತು ಸೂಚ್ಯಂಕಗೊಳಿಸಿ",
    knowledgeUploadModalClose: "ಮುಚ್ಚಿ",

    // Voice Assistant
    voiceModalTitle: "ಸಾರ್ವಭೌಮ ಧ್ವನಿ ಸಹಾಯಕ",
    voiceSubtitle: "ಸ್ಥಳೀಯ ಆನ್-ಪ್ರೆಮಿಸಸ್ ಧ್ವನಿ ಗುರುತಿಸುವಿಕೆ ಮತ್ತು ಆಡಿಯೊ ಪ್ರತಿಕ್ರಿಯೆ. ಶೂನ್ಯ ಕ್ಲೌಡ್ API.",
    voiceListeningState: "ಆಲಿಸುತ್ತಿದೆ... ನಿಮ್ಮ ಕಾರ್ಯಾಚರಣೆಯ ಪ್ರಶ್ನೆಯನ್ನು ಮಾತನಾಡಿ",
    voiceTranscribingState: "ಆಡಿಯೊವನ್ನು ಸ್ಥಳೀಯವಾಗಿ ಪಠ್ಯಕ್ಕೆ ಪರಿವರ್ತಿಸಲಾಗುತ್ತಿದೆ...",
    voiceSpeakingState: "ಸಾರ್ವಭೌಮ ಪ್ರತಿಕ್ರಿಯೆಯನ್ನು ಗಟ್ಟಿಯಾಗಿ ಓದಲಾಗುತ್ತಿದೆ...",
    voiceIdleState: "ಸಾರ್ವಭೌಮ ಧ್ವನಿ ವಿಚಾರಣೆಗೆ ಮೈಕ್ರೊಫೋನ್ ಸಿದ್ಧವಾಗಿದೆ.",
    voiceErrorState: "ಧ್ವನಿ ಸಂಸ್ಕರಣೆಯಲ್ಲಿ ದೋಷ ಕಂಡುಬಂದಿದೆ.",
    voiceUnavailableTitle: "ಸ್ಥಳೀಯ ಧ್ವನಿ ಎಂಜಿನ್ ಸ್ಥಾಪಿಸಲಾಗಿಲ್ಲ",
    voiceUnavailableDesc: "FORGE Google, Apple ಅಥವಾ OpenAI ಕ್ಲೌಡ್ ಧ್ವನಿ API ಗಳನ್ನು ಕಟ್ಟುನಿಟ್ಟಾಗಿ ನಿಷೇಧಿಸುತ್ತದೆ. ಸ್ಥಳೀಯ STT ಸಕ್ರಿಯಗೊಳಿಸಲು vosk ಅಥವಾ whisper.cpp ಸ್ಥಾಪಿಸಿ. ಪಠ್ಯ ಕನ್ಸೋಲ್ 100% ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ.",
    voiceStartListening: "🎙 ಆಲಿಸಲು ಪ್ರಾರಂಭಿಸಿ",
    voiceStopListening: "⏹ ನಿಲ್ಲಿಸಿ ಮತ್ತು ಪರಿವರ್ತಿಸಿ",
    voiceTransferQuery: "ಪ್ರಶ್ನೆ ಕ್ಷೇತ್ರಕ್ಕೆ ಕಳುಹಿಸಿ",
    voiceExecuteQuery: "ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಕಾರ್ಯಗತಗೊಳಿಸಿ ▶",
    voiceStopSpeaking: "🔇 ಮಾತನಾಡುವುದನ್ನು ನಿಲ್ಲಿಸಿ",
    voiceRetry: "↺ ಪುನಃ ಪ್ರಯತ್ನಿಸಿ",
    voiceClose: "ಮುಚ್ಚಿ",

    // Reports
    reportExportSuccess: "ಮಿಷನ್ ವರ್ಡ್ ವರದಿಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಡೌನ್‌ಲೋಡ್ ಮಾಡಲಾಗಿದೆ.",
    reportExportError: "ವರ್ಡ್ ವರದಿ ರಚಿಸಲು ವಿಫಲವಾಗಿದೆ.",
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof TranslationDictionary, params?: Record<string, string | number>) => string;
  formatNumber: (val: number, decimals?: number) => string;
  formatDate: (iso: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key) => translations.en[key] || String(key),
  formatNumber: (val) => String(val),
  formatDate: (iso) => iso,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("forge_language");
        if (saved === "en" || saved === "hi" || saved === "kn") {
          return saved;
        }
      } catch {
        // ignore
      }
    }
    return "en";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("forge_language", lang);
    } catch {
      // ignore
    }
  };

  const t = (key: keyof TranslationDictionary, params?: Record<string, string | number>): string => {
    const dict = translations[language] || translations.en;
    let text = dict[key] || translations.en[key] || String(key);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      });
    }
    return text;
  };

  const formatNumber = (val: number, decimals = 1): string => {
    if (isNaN(val)) return "0";
    return val.toFixed(decimals);
  };

  const formatDate = (iso: string): string => {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      const locale = language === "hi" ? "hi-IN" : language === "kn" ? "kn-IN" : "en-IN";
      return d.toLocaleString(locale, { timeZone: "Asia/Kolkata" });
    } catch {
      return iso;
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, formatNumber, formatDate }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}

/**
 * Audit helper to verify that all translation dictionaries have 100% key completeness.
 */
export function validateTranslationCompleteness(): {
  isComplete: boolean;
  missingInHindi: string[];
  missingInKannada: string[];
} {
  const enKeys = Object.keys(translations.en) as (keyof TranslationDictionary)[];
  const missingInHindi = enKeys.filter((k) => !translations.hi[k] || translations.hi[k].trim() === "");
  const missingInKannada = enKeys.filter((k) => !translations.kn[k] || translations.kn[k].trim() === "");

  return {
    isComplete: missingInHindi.length === 0 && missingInKannada.length === 0,
    missingInHindi,
    missingInKannada,
  };
}
