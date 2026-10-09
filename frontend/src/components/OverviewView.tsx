"use client";

import React, { useEffect, useState } from "react";
import {
  AuditEventsResponse,
  HealthResponse,
  KnowledgeDocsResponse,
  SovereigntyStatusResponse,
  fetchAuditEvents,
  fetchHealth,
  fetchKnowledgeDocuments,
  fetchSovereigntyStatus,
} from "@/lib/api";
import {
  EnamelSurface,
  VerdictBadge,
  BrassLabel,
  Metric,
  StatusIndicator,
  Divider,
} from "@/components/primitives";
import { useTranslation } from "@/lib/i18n";

interface OverviewViewProps {
  onNavigateToWorkspace: () => void;
}

export function OverviewView({ onNavigateToWorkspace }: OverviewViewProps) {
  const { t } = useTranslation();
  const [sovereignty, setSovereignty] = useState<SovereigntyStatusResponse | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [audit, setAudit] = useState<AuditEventsResponse | null>(null);
  const [knowledge, setKnowledge] = useState<KnowledgeDocsResponse | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [sovRes, healthRes, auditRes, knowRes] = await Promise.all([
          fetchSovereigntyStatus().catch(() => null),
          fetchHealth().catch(() => null),
          fetchAuditEvents(10).catch(() => null),
          fetchKnowledgeDocuments().catch(() => null),
        ]);
        setSovereignty(sovRes);
        setHealth(healthRes);
        setAudit(auditRes);
        setKnowledge(knowRes);
      } catch {
        // ignore
      }
    }
    loadData();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Industrial Case File Header */}
      <EnamelSurface variant="base" padding="spacious" style={{ position: "relative" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
          <div style={{ maxWidth: 780 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
              <BrassLabel variant="outline">{t("overviewCaseBadge")}</BrassLabel>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  color: "var(--ink-3)",
                  letterSpacing: "0.06em",
                }}
              >
                {t("overviewFacilityUnit")}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  color: "var(--brass)",
                  padding: "2px 8px",
                  border: "1px solid var(--line-strong)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                {t("overviewConfidential")}
              </span>
            </div>

            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 500,
                fontSize: "clamp(28px, 3.2vw, 42px)",
                lineHeight: 1.1,
                color: "var(--ink)",
                letterSpacing: "-0.01em",
                marginBottom: 10,
              }}
            >
              {t("overviewHeading")}
            </h1>

            <p
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "15px",
                lineHeight: 1.6,
                color: "var(--ink-2)",
              }}
            >
              {t("overviewSubheading")}
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12 }}>
            <VerdictBadge verdict="REVIEW_REQUIRED" />
            <button
              onClick={onNavigateToWorkspace}
              className="btn-brass-primary"
              style={{ whiteSpace: "nowrap" }}
            >
              {t("overviewOpenWorkspace")}
            </button>
          </div>
        </div>

        <Divider style={{ margin: "20px 0" }} />

        {/* Primary Case Condition Matrix (Section 4 Specification) */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--ink-3)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {t("overviewOperationalParams")}
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--ink-3)",
              }}
            >
              {t("overviewTelemetryPoint")}
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 16,
              background: "var(--bg-0)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-panel)",
              padding: "16px 20px",
            }}
          >
            <Metric
              value="33.0"
              unit="bar"
              label={t("overviewCurrentCondition")}
              subtext={t("overviewCurrentConditionSub")}
              highlight={true}
            />
            <div style={{ borderLeft: "1px solid var(--line)", paddingLeft: 16 }}>
              <Metric
                value="31.2"
                unit="bar"
                label={t("overviewNormalBaseline")}
                subtext={t("overviewNormalBaselineSub")}
              />
            </div>
            <div style={{ borderLeft: "1px solid var(--line)", paddingLeft: 16 }}>
              <Metric
                value="+1.8"
                unit="bar"
                label={t("overviewObservedDeviation")}
                subtext={t("overviewObservedDeviationSub")}
                highlight={true}
              />
            </div>
            <div style={{ borderLeft: "1px solid var(--line)", paddingLeft: 16 }}>
              <Metric
                value="33.5"
                unit="bar"
                label={t("overviewHighAlarmLimit")}
                subtext={t("overviewHighAlarmLimitSub")}
              />
            </div>
            <div style={{ borderLeft: "1px solid var(--line)", paddingLeft: 16 }}>
              <Metric
                value="35.0"
                unit="bar"
                label={t("overviewTripThreshold")}
                subtext={t("overviewTripThresholdSub")}
              />
            </div>
          </div>
        </div>
      </EnamelSurface>

      {/* Case Dossier Sections (3 Supporting Operational Layers) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: 20,
        }}
      >
        {/* Layer 1: Multi-Source Evidence Dossier */}
        <EnamelSurface variant="elevated" padding="normal">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--brass)",
                letterSpacing: "0.04em",
              }}
            >
              {t("overviewLayer1Title")}
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--ink-3)",
              }}
            >
              {knowledge?.total_available || 5} {t("overviewRecordsIndexed")}
            </span>
          </div>

          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "20px",
              color: "var(--ink)",
              marginBottom: 8,
              fontWeight: 500,
            }}
          >
            {t("overviewLayer1Heading")}
          </h3>

          <p style={{ fontFamily: "var(--font-ui)", fontSize: "13.5px", color: "var(--ink-2)", lineHeight: 1.5, marginBottom: 14 }}>
            {t("overviewLayer1Desc")}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { id: "01", type: "DOCUMENT", title: "SOP-R204 Rev C", note: "31.2 bar normal operating limit" },
              { id: "02", type: "GAUGE", title: "Analog Dial PI-204", note: "33.0 bar visual & telemetry reading" },
              { id: "03", type: "CALCULATION", title: "Variance Engine", note: "+1.8 bar delta, 0.5 bar to alarm" },
              { id: "04", type: "INSPECTION", title: "Ultrasonic Wall Scan", note: "2.2 mm shell thickness (nominal 2.5 mm)" },
            ].map((ev) => (
              <div
                key={ev.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "var(--bg-0)",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--radius-sm)",
                  padding: "8px 12px",
                  fontSize: "12.5px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--brass)", fontSize: "11px" }}>
                    [{ev.id}]
                  </span>
                  <span style={{ color: "var(--ink)", fontWeight: 500 }}>{ev.title}</span>
                </div>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--ink-3)", fontSize: "11.5px" }}>
                  {ev.note}
                </span>
              </div>
            ))}
          </div>
        </EnamelSurface>

        {/* Layer 2: Independent Deterministic Verification */}
        <EnamelSurface variant="elevated" padding="normal">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--sage)",
                letterSpacing: "0.04em",
              }}
            >
              {t("overviewLayer2Title")}
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--sage)",
              }}
            >
              {t("overviewChecksActive")}
            </span>
          </div>

          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "20px",
              color: "var(--ink)",
              marginBottom: 8,
              fontWeight: 500,
            }}
          >
            {t("overviewLayer2Heading")}
          </h3>

          <p style={{ fontFamily: "var(--font-ui)", fontSize: "13.5px", color: "var(--ink-2)", lineHeight: 1.5, marginBottom: 14 }}>
            {t("overviewLayer2Desc")}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { name: "Provenance", state: "PASS" },
              { name: "Completeness", state: "PASS" },
              { name: "Policy Gateway", state: "PASS" },
              { name: "Classification", state: "PASS" },
              { name: "Consistency", state: "PASS" },
              { name: "Calculation", state: "PASS" },
              { name: "Grounding", state: "PASS" },
              { name: "Self-Verification", state: "PROHIBITED" },
            ].map((chk, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "var(--bg-0)",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--radius-sm)",
                  padding: "7px 10px",
                  fontSize: "12px",
                }}
              >
                <span style={{ color: "var(--ink-2)" }}>{chk.name}</span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: chk.state === "PASS" ? "var(--sage)" : "var(--coral-text)",
                  }}
                >
                  {chk.state}
                </span>
              </div>
            ))}
          </div>
        </EnamelSurface>

        {/* Layer 3: Sovereign Controls & Policy Authority */}
        <EnamelSurface variant="elevated" padding="normal">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--brass)",
                letterSpacing: "0.04em",
              }}
            >
              {t("overviewLayer3Title")}
            </span>
            <StatusIndicator status="verified" label="Enforced" />
          </div>

          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "20px",
              color: "var(--ink)",
              marginBottom: 8,
              fontWeight: 500,
            }}
          >
            {t("overviewLayer3Heading")}
          </h3>

          <p style={{ fontFamily: "var(--font-ui)", fontSize: "13.5px", color: "var(--ink-2)", lineHeight: 1.5, marginBottom: 14 }}>
            {t("overviewLayer3Desc")}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontFamily: "var(--font-mono)", fontSize: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", background: "var(--bg-0)", borderRadius: "var(--radius-sm)", border: "1px solid var(--line)" }}>
              <span style={{ color: "var(--ink-3)" }}>{t("overviewGatewayPolicy")}</span>
              <span style={{ color: "var(--coral-text)", fontWeight: 600 }}>{t("overviewDefaultDenyVal")}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", background: "var(--bg-0)", borderRadius: "var(--radius-sm)", border: "1px solid var(--line)" }}>
              <span style={{ color: "var(--ink-3)" }}>{t("overviewReasoningRuntime")}</span>
              <span style={{ color: "var(--ink)" }}>
                {sovereignty?.model_provider?.default_model || "qwen3:8b (Ollama Loopback)"} ({health?.model_provider_online ? "Ready" : "Offline"})
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", background: "var(--bg-0)", borderRadius: "var(--radius-sm)", border: "1px solid var(--line)" }}>
              <span style={{ color: "var(--ink-3)" }}>{t("overviewOutsideAI")}</span>
              <span style={{ color: "var(--sage)", fontWeight: 600 }}>{t("overviewNoneConfigured")}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", background: "var(--bg-0)", borderRadius: "var(--radius-sm)", border: "1px solid var(--line)" }}>
              <span style={{ color: "var(--ink-3)" }}>{t("overviewAuditLogging")}</span>
              <span style={{ color: "var(--ink)" }}>
                {((audit?.total_agent_events || 0) + (audit?.tool_events?.length || 0))} {t("overviewAppendOnlyEvents")}
              </span>
            </div>
          </div>
        </EnamelSurface>
      </div>
    </div>
  );
}
