"use client";

import React, { useState } from "react";
import { useTranslation, Language } from "@/lib/i18n";

export interface TelemetryDataPoint {
  day: string;
  dateStr: string;
  value: number;
  status: "NORMAL" | "ELEVATED" | "ALARM" | "CRITICAL";
}

export interface MetricDefinition {
  id: "pressure" | "temperature" | "thickness" | "vibration";
  label: { en: string; hi: string; kn: string };
  unit: string;
  data: TelemetryDataPoint[];
  baseline: number;
  alarmLimit?: number;
  tripLimit?: number;
  minScale: number;
  maxScale: number;
  color: string;
  gradientId: string;
}

const HISTORICAL_METRICS: MetricDefinition[] = [
  {
    id: "pressure",
    label: {
      en: "Discharge Pressure (PI-204)",
      hi: "डिस्चार्ज दबाव (PI-204)",
      kn: "ಡಿಸ್ಚಾರ್ಜ್ ಒತ್ತಡ (PI-204)",
    },
    unit: "bar",
    baseline: 31.2,
    alarmLimit: 33.5,
    tripLimit: 35.0,
    minScale: 28.0,
    maxScale: 36.0,
    color: "var(--brass)",
    gradientId: "grad-pressure",
    data: [
      { day: "D-6", dateStr: "2026-10-04", value: 31.2, status: "NORMAL" },
      { day: "D-5", dateStr: "2026-10-05", value: 31.4, status: "NORMAL" },
      { day: "D-4", dateStr: "2026-10-06", value: 31.3, status: "NORMAL" },
      { day: "D-3", dateStr: "2026-10-07", value: 31.8, status: "NORMAL" },
      { day: "D-2", dateStr: "2026-10-08", value: 32.2, status: "NORMAL" },
      { day: "D-1", dateStr: "2026-10-09", value: 32.6, status: "ELEVATED" },
      { day: "Today", dateStr: "2026-10-10", value: 33.0, status: "ELEVATED" },
    ],
  },
  {
    id: "temperature",
    label: {
      en: "Catalyst Bed Temp (TI-204)",
      hi: "उत्प्रेरक बिस्तर तापमान (TI-204)",
      kn: "ವೇಗವರ್ಧಕ ತಾಪಮಾನ (TI-204)",
    },
    unit: "°C",
    baseline: 405.0,
    alarmLimit: 415.0,
    tripLimit: 425.0,
    minScale: 380.0,
    maxScale: 435.0,
    color: "#e67e22",
    gradientId: "grad-temp",
    data: [
      { day: "D-6", dateStr: "2026-10-04", value: 398.5, status: "NORMAL" },
      { day: "D-5", dateStr: "2026-10-05", value: 401.0, status: "NORMAL" },
      { day: "D-4", dateStr: "2026-10-06", value: 402.8, status: "NORMAL" },
      { day: "D-3", dateStr: "2026-10-07", value: 406.2, status: "NORMAL" },
      { day: "D-2", dateStr: "2026-10-08", value: 409.5, status: "NORMAL" },
      { day: "D-1", dateStr: "2026-10-09", value: 412.0, status: "ELEVATED" },
      { day: "Today", dateStr: "2026-10-10", value: 413.8, status: "ELEVATED" },
    ],
  },
  {
    id: "thickness",
    label: {
      en: "PAUT Shell Wall Thickness",
      hi: "PAUT शेल दीवार मोटाई",
      kn: "PAUT ಗೋಡೆ ದಪ್ಪ",
    },
    unit: "mm",
    baseline: 75.0,
    alarmLimit: 69.5,
    tripLimit: 68.2, // Retirement threshold
    minScale: 65.0,
    maxScale: 76.0,
    color: "var(--sage)",
    gradientId: "grad-thick",
    data: [
      { day: "2024", dateStr: "Design Baseline", value: 75.0, status: "NORMAL" },
      { day: "2025-Q1", dateStr: "Annual UT-01", value: 74.2, status: "NORMAL" },
      { day: "2025-Q3", dateStr: "Mid-Term Survey", value: 73.6, status: "NORMAL" },
      { day: "2026-Q1", dateStr: "Scheduled NDT", value: 73.1, status: "NORMAL" },
      { day: "2026-Q3", dateStr: "Latest UT-204", value: 72.8, status: "NORMAL" },
      { day: "Current", dateStr: "Current Thickness", value: 72.8, status: "NORMAL" },
    ],
  },
  {
    id: "vibration",
    label: {
      en: "Agitator Drive Vibration",
      hi: "आंदोलक ड्राइव कंपन",
      kn: "ಮಿಕ್ಸರ್ ಡ್ರೈವ್ ಕಂಪನ",
    },
    unit: "mm/s",
    baseline: 1.8,
    alarmLimit: 4.5,
    tripLimit: 7.1,
    minScale: 0.0,
    maxScale: 8.0,
    color: "#3498db",
    gradientId: "grad-vib",
    data: [
      { day: "D-6", dateStr: "2026-10-04", value: 1.8, status: "NORMAL" },
      { day: "D-5", dateStr: "2026-10-05", value: 2.0, status: "NORMAL" },
      { day: "D-4", dateStr: "2026-10-06", value: 2.1, status: "NORMAL" },
      { day: "D-3", dateStr: "2026-10-07", value: 2.4, status: "NORMAL" },
      { day: "D-2", dateStr: "2026-10-08", value: 2.8, status: "NORMAL" },
      { day: "D-1", dateStr: "2026-10-09", value: 3.2, status: "NORMAL" },
      { day: "Today", dateStr: "2026-10-10", value: 3.5, status: "NORMAL" },
    ],
  },
];

export function TelemetryTrendChart() {
  const { language } = useTranslation();
  const [selectedMetricId, setSelectedMetricId] = useState<string>("pressure");
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  const activeMetric = HISTORICAL_METRICS.find((m) => m.id === selectedMetricId) || HISTORICAL_METRICS[0];
  const langKey = (["en", "hi", "kn"].includes(language) ? language : "en") as Language;

  // Compute Statistics
  const values = activeMetric.data.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const avgVal = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  const currentVal = values[values.length - 1];

  // SVG dimensions
  const svgWidth = 640;
  const svgHeight = 220;
  const paddingLeft = 50;
  const paddingRight = 30;
  const paddingTop = 25;
  const paddingBottom = 35;
  const plotWidth = svgWidth - paddingLeft - paddingRight;
  const plotHeight = svgHeight - paddingTop - paddingBottom;

  const getY = (val: number) => {
    const range = activeMetric.maxScale - activeMetric.minScale;
    const norm = (val - activeMetric.minScale) / range;
    return paddingTop + plotHeight - norm * plotHeight;
  };

  const getX = (idx: number) => {
    const step = plotWidth / (activeMetric.data.length - 1);
    return paddingLeft + idx * step;
  };

  // Build SVG Path
  const points = activeMetric.data.map((d, i) => ({ x: getX(i), y: getY(d.value) }));
  const pathD = points.reduce((acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`, "");
  const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${(paddingTop + plotHeight).toFixed(1)} L ${points[0].x.toFixed(1)} ${(paddingTop + plotHeight).toFixed(1)} Z`;

  // Localized texts
  const tStrings = {
    en: {
      title: "7-Day Historical Statistical Telemetry & Trend Analysis",
      subtitle: "Deterministic on-premise sensor readings for Hydrocracker Unit R-204",
      minLbl: "7-Day Min",
      maxLbl: "7-Day Max",
      avgLbl: "7-Day Mean",
      currLbl: "Current Telemetry",
      baselineLbl: "Baseline Normal",
      alarmLbl: "Alarm Threshold",
      tripLbl: "Trip Limit",
    },
    hi: {
      title: "7-दिवसीय ऐतिहासिक सांख्यिकी एवं परिचालन ट्रेंड विश्लेषण",
      subtitle: "हाइड्रोक्रैकर इकाई R-204 के लिए ऑन-प्रिमाइसेस नियतात्मक सेंसर डेटा",
      minLbl: "7-दिन न्यूनतम",
      maxLbl: "7-दिन अधिकतम",
      avgLbl: "7-दिन औसत",
      currLbl: "वर्तमान रीडिंग",
      baselineLbl: "बेसलाइन सामान्य",
      alarmLbl: "अलार्म सीमा",
      tripLbl: "सुरक्षा ट्रिप",
    },
    kn: {
      title: "7-ದಿನಗಳ ಐತಿಹಾಸಿಕ ಸಂಖ್ಯಾಶಾಸ್ತ್ರೀಯ ಮತ್ತು ಟ್ರೆಂಡ್ ವಿಶ್ಲೇಷಣೆ",
      subtitle: "ಹೈಡ್ರೋಕ್ರ್ಯಾಕರ್ ಘಟಕ R-204 ಗಾಗಿ ಆನ್-ಪ್ರೆಮಿಸಸ್ ಸೆನ್ಸಾರ್ ದಾಖಲೆಗಳು",
      minLbl: "7-ದಿನ ಕನಿಷ್ಠ",
      maxLbl: "7-ದಿನ ಗರಿಷ್ಠ",
      avgLbl: "7-ದಿನ ಸರಾಸರಿ",
      currLbl: "ಪ್ರಸ್ತುತ ವಾಚನ",
      baselineLbl: "ಮೂಲ ಸಾಮಾನ್ಯ",
      alarmLbl: "ಅಲಾರಾಂ ಮಿತಿ",
      tripLbl: "ಸುರಕ್ಷತಾ ಟ್ರಿಪ್",
    },
  }[langKey];

  return (
    <div
      style={{
        background: "var(--bg-0)",
        border: "1px solid var(--line)",
        borderRadius: "var(--radius-panel)",
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Title & Metric Selection Strip */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--brass)", letterSpacing: "0.06em" }}>
              HISTORICAL TELEMETRY · 7-DAY WINDOW
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10.5px",
                color: "var(--sage)",
                background: "rgba(156, 195, 168, 0.1)",
                border: "1px solid var(--sage)",
                padding: "1px 6px",
                borderRadius: "var(--radius-pill)",
              }}
            >
              ASME SEC VIII COMPLIANT
            </span>
          </div>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "20px", color: "var(--ink)", fontWeight: 500, margin: 0 }}>
            {tStrings.title}
          </h3>
          <p style={{ fontFamily: "var(--font-ui)", fontSize: "12.5px", color: "var(--ink-2)", margin: "4px 0 0" }}>
            {tStrings.subtitle}
          </p>
        </div>

        {/* Tab Switcher for Metrics */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {HISTORICAL_METRICS.map((m) => {
            const isSelected = m.id === selectedMetricId;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMetricId(m.id)}
                style={{
                  background: isSelected ? "var(--bg-2)" : "var(--bg-1)",
                  border: isSelected ? "1px solid var(--brass)" : "1px solid var(--line)",
                  borderRadius: "var(--radius-pill)",
                  color: isSelected ? "var(--ink)" : "var(--ink-2)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "11.5px",
                  padding: "5px 12px",
                  cursor: "pointer",
                  transition: "all var(--dur-fast) var(--ease-out)",
                }}
              >
                {m.label[langKey]}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Summary Strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: 12,
          padding: "12px 16px",
          background: "var(--bg-1)",
          borderRadius: "var(--radius-panel)",
          border: "1px solid var(--line)",
        }}
      >
        <div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-3)" }}>{tStrings.currLbl}</span>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "20px", color: "var(--brass)", fontWeight: 600, marginTop: 2 }}>
            {currentVal} <span style={{ fontSize: "13px", fontWeight: 400 }}>{activeMetric.unit}</span>
          </div>
        </div>
        <div style={{ borderLeft: "1px solid var(--line)", paddingLeft: 12 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-3)" }}>{tStrings.baselineLbl}</span>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "20px", color: "var(--sage)", fontWeight: 600, marginTop: 2 }}>
            {activeMetric.baseline} <span style={{ fontSize: "13px", fontWeight: 400 }}>{activeMetric.unit}</span>
          </div>
        </div>
        <div style={{ borderLeft: "1px solid var(--line)", paddingLeft: 12 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-3)" }}>{tStrings.minLbl}</span>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "18px", color: "var(--ink)", fontWeight: 600, marginTop: 2 }}>
            {minVal} <span style={{ fontSize: "12px", fontWeight: 400 }}>{activeMetric.unit}</span>
          </div>
        </div>
        <div style={{ borderLeft: "1px solid var(--line)", paddingLeft: 12 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-3)" }}>{tStrings.maxLbl}</span>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "18px", color: "var(--ink)", fontWeight: 600, marginTop: 2 }}>
            {maxVal} <span style={{ fontSize: "12px", fontWeight: 400 }}>{activeMetric.unit}</span>
          </div>
        </div>
        <div style={{ borderLeft: "1px solid var(--line)", paddingLeft: 12 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-3)" }}>{tStrings.avgLbl}</span>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "18px", color: "var(--ink-2)", fontWeight: 600, marginTop: 2 }}>
            {avgVal} <span style={{ fontSize: "12px", fontWeight: 400 }}>{activeMetric.unit}</span>
          </div>
        </div>
      </div>

      {/* Responsive SVG Chart */}
      <div style={{ width: "100%", overflowX: "auto" }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ width: "100%", height: "auto", minWidth: "500px", overflow: "visible" }}
        >
          <defs>
            <linearGradient id={activeMetric.gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--brass)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--brass)" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid lines and horizontal references */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const yPos = paddingTop + ratio * plotHeight;
            const val = (activeMetric.maxScale - ratio * (activeMetric.maxScale - activeMetric.minScale)).toFixed(1);
            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={yPos}
                  x2={paddingLeft + plotWidth}
                  y2={yPos}
                  stroke="var(--line)"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={yPos + 4}
                  textAnchor="end"
                  fill="var(--ink-3)"
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Threshold Lines */}
          {activeMetric.tripLimit !== undefined && (
            <g>
              <line
                x1={paddingLeft}
                y1={getY(activeMetric.tripLimit)}
                x2={paddingLeft + plotWidth}
                y2={getY(activeMetric.tripLimit)}
                stroke="var(--coral)"
                strokeDasharray="3 3"
                strokeWidth="1.5"
              />
              <text
                x={paddingLeft + plotWidth - 4}
                y={getY(activeMetric.tripLimit) - 4}
                textAnchor="end"
                fill="var(--coral-text)"
                fontSize="10"
                fontFamily="var(--font-mono)"
                fontWeight="600"
              >
                {tStrings.tripLbl}: {activeMetric.tripLimit} {activeMetric.unit}
              </text>
            </g>
          )}

          {activeMetric.alarmLimit !== undefined && (
            <g>
              <line
                x1={paddingLeft}
                y1={getY(activeMetric.alarmLimit)}
                x2={paddingLeft + plotWidth}
                y2={getY(activeMetric.alarmLimit)}
                stroke="#e67e22"
                strokeDasharray="3 3"
                strokeWidth="1.2"
              />
              <text
                x={paddingLeft + plotWidth - 4}
                y={getY(activeMetric.alarmLimit) - 4}
                textAnchor="end"
                fill="#e67e22"
                fontSize="10"
                fontFamily="var(--font-mono)"
                fontWeight="600"
              >
                {tStrings.alarmLbl}: {activeMetric.alarmLimit} {activeMetric.unit}
              </text>
            </g>
          )}

          {/* Nominal Baseline Reference */}
          <line
            x1={paddingLeft}
            y1={getY(activeMetric.baseline)}
            x2={paddingLeft + plotWidth}
            y2={getY(activeMetric.baseline)}
            stroke="var(--sage)"
            strokeDasharray="2 2"
            strokeWidth="1"
          />

          {/* Area fill */}
          <path d={areaD} fill={`url(#${activeMetric.gradientId})`} />

          {/* Primary Trend Line */}
          <path
            d={pathD}
            fill="none"
            stroke="var(--brass)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {activeMetric.data.map((d, idx) => {
            const cx = getX(idx);
            const cy = getY(d.value);
            const isHovered = hoveredPointIndex === idx;

            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredPointIndex(idx)}
                onMouseLeave={() => setHoveredPointIndex(null)}
                style={{ cursor: "pointer" }}
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 6 : 4}
                  fill={d.status === "ELEVATED" ? "var(--brass)" : d.status === "ALARM" ? "#e67e22" : "var(--sage)"}
                  stroke="var(--bg-0)"
                  strokeWidth="2"
                  style={{ transition: "r 0.15s ease" }}
                />

                {/* X-axis date labels */}
                <text
                  x={cx}
                  y={paddingTop + plotHeight + 16}
                  textAnchor="middle"
                  fill="var(--ink-2)"
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                >
                  {d.day}
                </text>

                {/* Hover value tooltip */}
                {isHovered && (
                  <g>
                    <rect
                      x={cx - 36}
                      y={cy - 30}
                      width="72"
                      height="22"
                      rx="4"
                      fill="var(--bg-2)"
                      stroke="var(--brass)"
                      strokeWidth="1"
                    />
                    <text
                      x={cx}
                      y={cy - 15}
                      textAnchor="middle"
                      fill="var(--ink)"
                      fontSize="11"
                      fontFamily="var(--font-mono)"
                      fontWeight="600"
                    >
                      {d.value} {activeMetric.unit}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
