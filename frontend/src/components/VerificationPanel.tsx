"use client";

import React, { useState } from "react";
import { VerificationResult, VerificationStatus } from "@/lib/api";
import {
  EnamelSurface,
  VerdictBadge,
  BrassLabel,
  Divider,
} from "@/components/primitives";
import { useTranslation } from "@/lib/i18n";
import { ReadAloudButton } from "@/components/ReadAloudButton";

interface VerificationPanelProps {
  verification?: VerificationResult | null;
}

export function VerificationPanel({ verification }: VerificationPanelProps) {
  const { t } = useTranslation();
  const [expandedCheckName, setExpandedCheckName] = useState<string | null>(null);

  // Baseline 7 checks for Reactor R-204 investigation if none dynamically provided
  const baselineChecks = [
    {
      check_name: "PROVENANCE",
      plainTitle: "Sources traceable",
      title: t("verificationCheckProvTitle"),
      status: "VERIFIED" as VerificationStatus,
      description: "All ingested document chunks, tool telemetry, and visual observations possess verifiable source references and SHA-256 digests.",
      details: "Evidence records verified to source digests. No orphaned claims detected.",
    },
    {
      check_name: "COMPLETENESS",
      plainTitle: "Evidence complete",
      title: t("verificationCheckCompTitle"),
      status: "VERIFIED" as VerificationStatus,
      description: "Every reasoning claim in the agent's plan has corresponding backing records across knowledge, tooling, and sensor telemetry.",
      details: "Evidence coverage confirmed across ingested references and tool records.",
    },
    {
      check_name: "POLICY",
      plainTitle: "Within policy rules",
      title: t("verificationCheckPolicyTitle"),
      status: "VERIFIED" as VerificationStatus,
      description: "All requested operations evaluated against role clearance. Zero execution of unauthorized, critical-risk, or write-actuation tool handlers.",
      details: "Gateway default-deny confirmed. Critical mutations blocked.",
    },
    {
      check_name: "CLASSIFICATION",
      plainTitle: "Within your access",
      title: t("verificationCheckClassTitle"),
      status: "VERIFIED" as VerificationStatus,
      description: "Data classification levels respected. Requester clearance strictly subsumes retrieved document tiers.",
      details: "Zero clearance leakage. Bounded within sovereign enclave.",
    },
    {
      check_name: "PARAMETER_CONSISTENCY",
      plainTitle: "Values agree",
      title: t("verificationCheckParamTitle"),
      status: "VERIFIED" as VerificationStatus,
      description: "Operating readings and engineering baselines are compared across multiple sources. Variances are flagged for review.",
      details: "Cross-source parameter consistency verified against available reference baselines.",
    },
    {
      check_name: "CALCULATION",
      plainTitle: "Math independently checked",
      title: t("verificationCheckCalcTitle"),
      status: "VERIFIED" as VerificationStatus,
      description: "All numerical variances and engineering calculations are calculated by pure Python code, not by the language model.",
      details: "Deterministic math verified via Python engine.",
    },
    {
      check_name: "GROUNDING",
      plainTitle: "Answer supported by evidence",
      title: t("verificationCheckGroundTitle"),
      status: "VERIFIED" as VerificationStatus,
      description: "Response text is checked for factual grounding against verified evidence. Speculative assertions are purged.",
      details: "Asserted quantities verified against backing evidence records.",
    },
  ];

  if (!verification) {
    return (
      <EnamelSurface variant="base" padding="spacious">
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <BrassLabel variant="outline">{t("verificationGatewayTitle")}</BrassLabel>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "24px", color: "var(--ink)", marginTop: 12, marginBottom: 8, fontWeight: 500 }}>
            {t("verificationEmptyTitle")}
          </h2>
          <p style={{ fontFamily: "var(--font-ui)", fontSize: "14px", color: "var(--ink-2)", maxWidth: "54ch", margin: "0 auto" }}>
            {t("verificationEmptyDesc")}
          </p>
        </div>
      </EnamelSurface>
    );
  }

  const activeChecks = verification.checks && verification.checks.length > 0
    ? verification.checks.map((chk) => {
        const matchingBaseline = baselineChecks.find((b) => b.check_name === chk.check_type);
        const detailsStr = chk.details && Object.keys(chk.details).length > 0
          ? (typeof chk.details === "string" ? chk.details : JSON.stringify(chk.details))
          : (chk.evidence_ids && chk.evidence_ids.length > 0
              ? `Evaluated against ${chk.evidence_ids.length} evidence records.`
              : matchingBaseline?.details || "Deterministic verification check evaluated.");

        return {
          check_name: chk.check_type,
          plainTitle: matchingBaseline?.plainTitle || chk.check_type.replace(/_/g, " "),
          title: matchingBaseline?.title || chk.check_type.replace(/_/g, " "),
          status: chk.status,
          description: chk.description,
          details: detailsStr,
        };
      })
    : [];

  const currentStatus = verification.status || "REVIEW_REQUIRED";
  const summaryText = verification.summary || "Independent verification evaluation complete.";

  const toggleCheck = (name: string) => {
    setExpandedCheckName((prev) => (prev === name ? null : name));
  };

  return (
    <EnamelSurface variant="base" padding="spacious">
      {/* Top Banner: Core North Star Thesis */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <BrassLabel variant="outline">THE MODEL DOES NOT VERIFY ITSELF</BrassLabel>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--sage)",
                background: "rgba(156, 195, 168, 0.08)",
                padding: "2px 8px",
                borderRadius: "var(--radius-pill)",
                border: "1px solid var(--sage)",
              }}
            >
              7 INDEPENDENT CODE CHECKS
            </span>
          </div>

          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "28px", color: "var(--ink)", fontWeight: 500 }}>
            {t("verificationGatewaySubtitle")}
          </h2>

          <p style={{ fontFamily: "var(--font-ui)", fontSize: "14px", color: "var(--ink-2)", marginTop: 4, maxWidth: 680 }}>
            {t("verificationGatewayDesc")}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-3)", textTransform: "uppercase" }}>
            Deterministic Verdict
          </span>
          <VerdictBadge verdict={currentStatus} />
        </div>
      </div>

      <Divider style={{ margin: "14px 0 20px" }} />

      {/* Summary Callout */}
      <div
        style={{
          background: "var(--bg-0)",
          border: "1px solid var(--line)",
          borderLeft: "3px solid var(--brass)",
          borderRadius: "var(--radius-panel)",
          padding: "14px 18px",
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--brass)", letterSpacing: "0.06em" }}>
            VERIFICATION ASSESSMENT SUMMARY
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-3)" }}>
              Checks Evaluated: {activeChecks.length} / 7
            </span>
            <ReadAloudButton text={summaryText} compact />
          </div>
        </div>

        <p style={{ fontFamily: "var(--font-ui)", fontSize: "14px", color: "var(--ink)", lineHeight: 1.55 }}>
          {summaryText}
        </p>

        {verification?.conflicts && verification.conflicts.length > 0 && (
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--brass)", fontWeight: 600 }}>
              Flagged Parameter Discrepancy:
            </span>
            {verification.conflicts.map((c, i) => (
              <p key={i} style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--ink-2)", marginTop: 2 }}>
                • {c.metric_or_topic}: {c.source_a} ({c.value_a}) vs {c.source_b} ({c.value_b}) — {c.description}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* THE VERTICAL VERIFICATION SPINE (7 Discrete Checks) */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0, position: "relative" }}>
        {activeChecks.map((chk, idx) => {
          const isLast = idx === activeChecks.length - 1;
          const isExpanded = expandedCheckName === chk.check_name;
          const isPassed = chk.status === "VERIFIED";

          return (
            <div key={chk.check_name} style={{ display: "flex", alignItems: "flex-start", gap: 16, position: "relative" }}>
              {/* Left Column: Number Node and Connecting Spine Wire */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 32, flexShrink: 0 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "var(--bg-0)",
                    border: `1.5px solid ${isPassed ? "var(--sage)" : "var(--brass)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: isPassed ? "var(--sage)" : "var(--brass)",
                    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",
                    zIndex: 2,
                  }}
                >
                  {String(idx + 1).padStart(2, "0")}
                </div>

                {!isLast && (
                  <div
                    style={{
                      width: 2,
                      height: 52,
                      background: "var(--line)",
                      margin: "4px 0",
                    }}
                  />
                )}
              </div>

              {/* Right Column: Check Content Block */}
              <div
                onClick={() => toggleCheck(chk.check_name)}
                style={{
                  flex: 1,
                  background: isExpanded ? "var(--bg-2)" : "var(--bg-0)",
                  border: isExpanded ? "1px solid var(--brass)" : "1px solid var(--line)",
                  borderRadius: "var(--radius-panel)",
                  padding: "12px 16px",
                  marginBottom: isLast ? 0 : 16,
                  cursor: "pointer",
                  transition: "all var(--dur-fast) var(--ease-out)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--brass)", letterSpacing: "0.06em" }}>
                      CHECK {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span style={{ fontFamily: "var(--font-ui)", fontSize: "15px", fontWeight: 600, color: "var(--ink)" }}>
                      {chk.plainTitle}
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-3)" }}>
                      · {chk.title}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        fontWeight: 600,
                        color: isPassed ? "var(--sage)" : "var(--brass)",
                        background: isPassed ? "rgba(156, 195, 168, 0.1)" : "rgba(200, 161, 90, 0.1)",
                        padding: "2px 8px",
                        borderRadius: "var(--radius-pill)",
                        border: `1px solid ${isPassed ? "var(--sage)" : "var(--brass)"}`,
                      }}
                    >
                      {chk.status === "VERIFIED" ? "PASS" : chk.status}
                    </span>
                    <span style={{ color: "var(--ink-3)", fontSize: "12px" }}>
                      {isExpanded ? "▲" : "▼"}
                    </span>
                  </div>
                </div>

                <p style={{ fontFamily: "var(--font-ui)", fontSize: "13px", color: "var(--ink-2)", lineHeight: 1.5, marginTop: 6 }}>
                  {chk.description}
                </p>

                {isExpanded && (
                  <div
                    style={{
                      marginTop: 10,
                      paddingTop: 10,
                      borderTop: "1px solid var(--line)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "12px",
                      color: "var(--brass)",
                      background: "var(--bg-1)",
                      padding: "8px 12px",
                      borderRadius: "var(--radius-sm)",
                    }}
                  >
                    Verification Trace: {chk.details}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Deterministic Status Terminal Node */}
      <div
        style={{
          marginTop: 24,
          padding: "16px 20px",
          background: "var(--bg-0)",
          border: "1px solid var(--line-strong)",
          borderRadius: "var(--radius-panel)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-3)", letterSpacing: "0.06em" }}>
            FINAL DETERMINISTIC PIPELINE STATUS
          </span>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "22px", color: "var(--ink)", fontWeight: 500, marginTop: 2 }}>
            Trust Boundary Assured: Human Operator Review Retained
          </h3>
        </div>

        <VerdictBadge verdict={currentStatus} />
      </div>
    </EnamelSurface>
  );
}
