"use client";

import React from "react";
import { useTranslation } from "@/lib/i18n";
import { PressureDial } from "./PressureDial";

export interface EngineeringVisualizationsProps {
  currentPressure?: number;
  baselinePressure?: number;
  alarmPressure?: number;
  tripPressure?: number;
  wallMeasured?: number;
  wallDesign?: number;
  wallRetirement?: number;
  verificationPassedCount?: number;
  verificationTotalCount?: number;
  showWallThickness?: boolean;
}

export function EngineeringVisualizations({
  currentPressure = 33.0,
  baselinePressure = 31.2,
  alarmPressure = 33.5,
  tripPressure = 35.0,
  wallMeasured = 10.4,
  wallDesign = 12.0,
  wallRetirement = 8.0,
  verificationPassedCount = 7,
  verificationTotalCount = 7,
  showWallThickness = true,
}: EngineeringVisualizationsProps) {
  const { language } = useTranslation();

  const deviation = (currentPressure - baselinePressure).toFixed(1);
  const deviationSign = currentPressure >= baselinePressure ? "+" : "";
  const deviationPct = (((currentPressure - baselinePressure) / baselinePressure) * 100).toFixed(1);
  const marginToTrip = Math.max(0, tripPressure - currentPressure).toFixed(1);
  const marginToAlarm = Math.max(0, alarmPressure - currentPressure).toFixed(1);

  // Pressure progress percentage across baseline-to-trip window
  const pressurePct = Math.min(
    100,
    Math.max(0, ((currentPressure - 28.0) / (tripPressure - 28.0)) * 100)
  ).toFixed(1);

  // Wall thickness calculations
  const remainingAllowance = (wallMeasured - wallRetirement).toFixed(1);
  const wallPct = Math.min(
    100,
    Math.max(0, ((wallMeasured - wallRetirement) / (wallDesign - wallRetirement)) * 100)
  ).toFixed(1);

  // Localization dict
  const labels = {
    en: {
      cardTitle: "Engineering Visualizations & Operating Thresholds",
      r204Title: "Reactor R-204 Pressure Boundary Track",
      baseline: "Baseline Normal",
      current: "PI-204 Reading",
      alarm: "High Alarm",
      trip: "Safety Trip",
      deviation: "Deviation",
      marginTrip: "Remaining Trip Margin",
      marginAlarm: "Headroom to Alarm",
      statusElevated: "ELEVATED (WITHIN MARGIN)",
      wallTitle: "Reactor Shell Wall Thickness (PAUT Ultrasonic Inspection)",
      wallDesignLbl: "Design Spec",
      wallMeasuredLbl: "Current Measured",
      wallRetireLbl: "Retirement Limit (t_min)",
      wallMarginLbl: "Remaining Corrosion Allowance",
      verifTitle: "Deterministic Verification Matrix",
      verifSubtitle: "Independent deterministic safety checks recorded in audit log",
    },
    hi: {
      cardTitle: "इंजीनियरिंग विज़ुअलाइज़ेशन एवं परिचालन सीमाएँ",
      r204Title: "रिएक्टर R-204 दबाव सीमा ट्रैक (Pressure Boundary Track)",
      baseline: "बेसलाइन सामान्य",
      current: "PI-204 रीडिंग",
      alarm: "उच्च अलार्म",
      trip: "सुरक्षा ट्रिप",
      deviation: "विचलन (Delta)",
      marginTrip: "शेष ट्रिप मार्जिन",
      marginAlarm: "अलार्म तक का हेडरूम",
      statusElevated: "उन्नत (मार्जिन के भीतर सुरक्षित)",
      wallTitle: "रिएक्टर शेल दीवार की मोटाई (PAUT अल्ट्रासोनिक निरीक्षण)",
      wallDesignLbl: "डिज़ाइन मानक",
      wallMeasuredLbl: "वर्तमान मापी गई",
      wallRetireLbl: "सेवानिवृत्ति सीमा (t_min)",
      wallMarginLbl: "शेष क्षरण मार्जिन (Corrosion Allowance)",
      verifTitle: "नियतात्मक सत्यापन मैट्रिक्स",
      verifSubtitle: "ऑडिट लॉग में दर्ज स्वतंत्र नियतात्मक सुरक्षा जाँचें",
    },
    kn: {
      cardTitle: "ಇಂಜಿನಿಯರಿಂಗ್ ದೃಶ್ಯೀಕರಣಗಳು ಮತ್ತು ಕಾರ್ಯಾಚರಣೆಯ ಮಿತಿಗಳು",
      r204Title: "ರಿಯಾಕ್ಟರ್ R-204 ಒತ್ತಡ ಗಡಿ ಟ್ರ್ಯಾಕ್ (Pressure Boundary Track)",
      baseline: "ಮೂಲ ಸಾಮಾನ್ಯ",
      current: "PI-204 ವಾಚನ",
      alarm: "ಹೈ ಅಲಾರಾಂ",
      trip: "ಸುರಕ್ಷತಾ ಟ್ರಿಪ್",
      deviation: "ವ್ಯತ್ಯಾಸ (Delta)",
      marginTrip: "ಉಳಿದ ಟ್ರಿಪ್ ಅಂತರ",
      marginAlarm: "ಅಲಾರಾಂ ವರೆಗಿನ ಅಂತರ",
      statusElevated: "ಹೆಚ್ಚಳ (ಸುರಕ್ಷಿತ ಅಂತರದಲ್ಲಿ)",
      wallTitle: "ರಿಯಾಕ್ಟರ್ ಶೆಲ್ ಗೋಡೆಯ ದಪ್ಪ (PAUT ಅಲ್ಟ್ರಾಸಾನಿಕ್ ತಪಾಸಣೆ)",
      wallDesignLbl: "ವಿನ್ಯಾಸ ಮಾನದಂಡ",
      wallMeasuredLbl: "ಪ್ರಸ್ತುತ ಅಳತೆ",
      wallRetireLbl: "ನಿವೃತ್ತಿ ಮಿತಿ (t_min)",
      wallMarginLbl: "ಉಳಿದ ಸವೆತ ಭದ್ರತಾ ಅಂತರ",
      verifTitle: "ನಿರ್ಣಾಯಕ ಪರಿಶೀಲನಾ ಮ್ಯಾಟ್ರಿಕ್ಸ್",
      verifSubtitle: "ಆಡಿಟ್ ಲಾಗ್‌ನಲ್ಲಿ ದಾಖಲಾದ ಸ್ವತಂತ್ರ ನಿರ್ಣಾಯಕ ಸುರಕ್ಷತಾ ತಪಾಸಣೆಗಳು",
    },
  }[language] || {
    cardTitle: "Engineering Visualizations & Operating Thresholds",
    r204Title: "Reactor R-204 Pressure Boundary Track",
    baseline: "Baseline Normal",
    current: "PI-204 Reading",
    alarm: "High Alarm",
    trip: "Safety Trip",
    deviation: "Deviation",
    marginTrip: "Remaining Trip Margin",
    marginAlarm: "Headroom to Alarm",
    statusElevated: "ELEVATED (WITHIN MARGIN)",
    wallTitle: "Reactor Shell Wall Thickness (PAUT Ultrasonic Inspection)",
    wallDesignLbl: "Design Spec",
    wallMeasuredLbl: "Current Measured",
    wallRetireLbl: "Retirement Limit (t_min)",
    wallMarginLbl: "Remaining Corrosion Allowance",
    verifTitle: "Deterministic Verification Matrix",
    verifSubtitle: "Independent deterministic safety checks recorded in audit log",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
        padding: "1.25rem",
        background: "var(--bg-panel, #0D1520)",
        border: "1px solid var(--border-subtle, #1E2D3D)",
        borderRadius: "8px",
        marginTop: "1rem",
        marginBottom: "1rem",
      }}
      className="forge-engineering-visualizations"
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle, #1E2D3D)", paddingBottom: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ color: "var(--brass, #C5A059)", fontSize: "1.1rem" }}>⚙</span>
          <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ink, #E2E8F0)" }}>
            {labels.cardTitle}
          </h4>
        </div>
        <span
          style={{
            fontSize: "0.72rem",
            padding: "0.2rem 0.6rem",
            borderRadius: "4px",
            background: "rgba(197, 160, 89, 0.12)",
            color: "var(--brass, #C5A059)",
            border: "1px solid rgba(197, 160, 89, 0.3)",
            fontWeight: 600,
          }}
        >
          {labels.statusElevated}
        </span>
      </div>

      {/* Grid: Dial on left, track and metrics on right */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(240px, 300px) 1fr", gap: "1.5rem", alignItems: "center" }}>
        {/* Dial Component */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <PressureDial
            value={currentPressure}
            normal={baselinePressure}
            alarm={alarmPressure}
            trip={tripPressure}
            tag="PI-204"
            unit="bar"
            size={220}
          />
        </div>

        {/* Telemetry Multi-Threshold Bar Track */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--ink, #E2E8F0)" }}>
                {labels.r204Title}
              </span>
              <span style={{ fontSize: "0.82rem", fontFamily: "monospace", color: "var(--brass, #C5A059)", fontWeight: 700 }}>
                {currentPressure.toFixed(1)} bar / {tripPressure.toFixed(1)} bar
              </span>
            </div>

            {/* Track Bar with threshold markers */}
            <div style={{ position: "relative", height: "18px", background: "#060A10", borderRadius: "9px", overflow: "hidden", border: "1px solid #1E2D3D" }}>
              {/* Colored fill bar */}
              <div
                style={{
                  height: "100%",
                  width: `${pressurePct}%`,
                  background: "linear-gradient(90deg, #10B981 0%, #059669 60%, #F59E0B 85%, #EF4444 100%)",
                  transition: "width 0.8s ease-out",
                }}
              />
            </div>

            {/* Threshold Labels under the track */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.4rem", fontSize: "0.72rem", color: "#64748B" }}>
              <span>{labels.baseline}: <strong>{baselinePressure.toFixed(1)} bar</strong></span>
              <span style={{ color: "#F59E0B" }}>{labels.alarm}: <strong>{alarmPressure.toFixed(1)} bar</strong></span>
              <span style={{ color: "#EF4444" }}>{labels.trip}: <strong>{tripPressure.toFixed(1)} bar</strong></span>
            </div>
          </div>

          {/* Metric Badges */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.6rem" }}>
            <div style={{ padding: "0.6rem", background: "#060A10", borderRadius: "6px", border: "1px solid #1E2D3D" }}>
              <div style={{ fontSize: "0.68rem", color: "#94A3B8", marginBottom: "0.2rem" }}>{labels.deviation}</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#F59E0B", fontFamily: "monospace" }}>
                {deviationSign}{deviation} bar ({deviationSign}{deviationPct}%)
              </div>
            </div>

            <div style={{ padding: "0.6rem", background: "#060A10", borderRadius: "6px", border: "1px solid #1E2D3D" }}>
              <div style={{ fontSize: "0.68rem", color: "#94A3B8", marginBottom: "0.2rem" }}>{labels.marginAlarm}</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#10B981", fontFamily: "monospace" }}>
                {marginToAlarm} bar
              </div>
            </div>

            <div style={{ padding: "0.6rem", background: "#060A10", borderRadius: "6px", border: "1px solid #1E2D3D" }}>
              <div style={{ fontSize: "0.68rem", color: "#94A3B8", marginBottom: "0.2rem" }}>{labels.marginTrip}</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--brass, #C5A059)", fontFamily: "monospace" }}>
                {marginToTrip} bar
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wall Thickness Visualization (if applicable) */}
      {showWallThickness && (
        <div style={{ borderTop: "1px solid #1E2D3D", paddingTop: "0.85rem", marginTop: "0.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--ink, #E2E8F0)" }}>
              {labels.wallTitle}
            </span>
            <span style={{ fontSize: "0.78rem", color: "#10B981", fontWeight: 700, fontFamily: "monospace" }}>
              {wallMeasured.toFixed(1)} mm ({labels.wallMarginLbl}: +{remainingAllowance} mm)
            </span>
          </div>

          {/* Wall Thickness Track Bar */}
          <div style={{ position: "relative", height: "14px", background: "#060A10", borderRadius: "7px", overflow: "hidden", border: "1px solid #1E2D3D" }}>
            <div
              style={{
                height: "100%",
                width: `${wallPct}%`,
                background: "linear-gradient(90deg, #F59E0B 0%, #10B981 70%)",
                transition: "width 0.8s ease-out",
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.35rem", fontSize: "0.72rem", color: "#64748B" }}>
            <span style={{ color: "#EF4444" }}>{labels.wallRetireLbl}: <strong>{wallRetirement.toFixed(1)} mm</strong></span>
            <span style={{ color: "#10B981" }}>{labels.wallMeasuredLbl}: <strong>{wallMeasured.toFixed(1)} mm</strong></span>
            <span>{labels.wallDesignLbl}: <strong>{wallDesign.toFixed(1)} mm</strong></span>
          </div>
        </div>
      )}

      {/* 7-Point Verification Matrix Summary Bar */}
      <div style={{ borderTop: "1px solid #1E2D3D", paddingTop: "0.75rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ color: "#10B981", fontSize: "0.9rem" }}>✓</span>
          <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#E2E8F0" }}>
            {labels.verifTitle}:
          </span>
          <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
            {labels.verifSubtitle}
          </span>
        </div>
        <span
          style={{
            fontSize: "0.75rem",
            padding: "0.15rem 0.5rem",
            borderRadius: "4px",
            background: "rgba(16, 185, 129, 0.15)",
            color: "#10B981",
            fontWeight: 700,
            border: "1px solid rgba(16, 185, 129, 0.3)",
          }}
        >
          {verificationPassedCount} / {verificationTotalCount} VERIFIED
        </span>
      </div>
    </div>
  );
}
