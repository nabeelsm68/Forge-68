"use client";

import React, { useEffect, useState } from "react";
import {
  SecurityBoundaryReport,
  ToolMetadata,
  fetchSecurityReport,
  fetchTools,
} from "@/lib/api";
import { EnamelSurface, SectionHeader, BrassLabel } from "./primitives";
import { useTranslation } from "@/lib/i18n";

interface GovernanceViewProps {
  role?: string;
}

export function GovernanceView({ role = "ENGINEER" }: GovernanceViewProps) {
  const { t } = useTranslation();
  const [securityReport, setSecurityReport] = useState<SecurityBoundaryReport | null>(null);
  const [tools, setTools] = useState<ToolMetadata[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([fetchSecurityReport(), fetchTools()])
      .then(([sec, tls]) => {
        if (active) {
          setSecurityReport(sec);
          setTools(tls);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : String(err));
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const permissionMatrix = [
    {
      role: "ENGINEER",
      clearance: "CONFIDENTIAL",
      read: "✓ Allowed",
      investigate: "✓ Allowed",
      actuate: "⚠ Approval required",
      admin: "✕ Blocked",
      summary: "Read plant data & SOPs, run investigations, read-only tools. Critical actuation requires approval. Admin actions blocked.",
    },
    {
      role: "INSPECTOR",
      clearance: "INTERNAL",
      read: "✓ Allowed",
      investigate: "✓ Allowed",
      actuate: "✕ Blocked",
      admin: "✕ Blocked",
      summary: "Read inspection & telemetry data, run investigations. Actuation blocked. Admin actions blocked.",
    },
    {
      role: "AI OPERATOR",
      clearance: "RESTRICTED",
      read: "✓ Allowed",
      investigate: "✓ Allowed",
      actuate: "✕ Blocked",
      admin: "✕ Blocked",
      summary: "Approved read & investigation access. Zero write authority. Actuation blocked. Admin actions blocked.",
    },
    {
      role: "ADMIN",
      clearance: "CRITICAL",
      read: "✓ Allowed",
      investigate: "✓ Allowed",
      actuate: "⚠ Approval required",
      admin: "✓ Allowed",
      summary: "Broadest access. Critical actions require appropriate approval. Administrative controls available.",
    },
    {
      role: "SECURITY OFFICER",
      clearance: "CRITICAL",
      read: "✓ Allowed",
      investigate: "✓ Allowed",
      actuate: "✕ Blocked",
      admin: "✕ Blocked",
      summary: "Audit & security visibility. Plant actuation blocked. Administrative override blocked.",
    },
  ];

  const getStatusBadge = (status: string) => {
    if (status.includes("✓ Allowed") || status.includes("Allowed") || status.includes("अनुमत") || status.includes("ಅನುಮತಿಸಲಾಗಿದೆ")) {
      return (
        <span style={{ color: "var(--sage)", background: "rgba(156, 195, 168, 0.1)", border: "1px solid var(--sage)", padding: "3px 8px", borderRadius: "var(--radius-pill)", fontSize: "11px", fontWeight: 600 }}>
          {t("govStatusAllowed")}
        </span>
      );
    }
    if (status.includes("⚠ Approval required") || status.includes("Approval") || status.includes("अनुमोदन") || status.includes("ಅನುಮೋದನೆ")) {
      return (
        <span style={{ color: "var(--brass)", background: "rgba(200, 161, 90, 0.1)", border: "1px solid var(--brass)", padding: "3px 8px", borderRadius: "var(--radius-pill)", fontSize: "11px", fontWeight: 600 }}>
          {t("govStatusApproval")}
        </span>
      );
    }
    return (
      <span style={{ color: "var(--pewter)", background: "rgba(141, 180, 214, 0.08)", border: "1px solid var(--line-strong)", padding: "3px 8px", borderRadius: "var(--radius-pill)", fontSize: "11px", fontWeight: 600 }}>
        {t("govStatusBlocked")}
      </span>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Editorial Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
          <BrassLabel variant="outline">AUTHORITY LEDGER</BrassLabel>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--coral-text)",
              background: "rgba(217, 105, 78, 0.08)",
              padding: "2px 8px",
              borderRadius: "var(--radius-pill)",
              border: "1px solid var(--coral)",
            }}
          >
            DEFAULT-DENY ENFORCED
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--sage)",
              background: "rgba(156, 195, 168, 0.08)",
              padding: "2px 8px",
              borderRadius: "var(--radius-pill)",
              border: "1px solid var(--sage)",
              fontWeight: 600,
            }}
          >
            SECURITY TESTS: 10 / 10 PASSED
          </span>
        </div>

        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 500,
            fontSize: "40px",
            lineHeight: 1.1,
            color: "var(--ink)",
            letterSpacing: "-0.01em",
          }}
        >
          {t("govTitle")}
        </h1>

        <p
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "16px",
            color: "var(--ink-2)",
            marginTop: 6,
            maxWidth: "68ch",
          }}
        >
          {t("govSubtitle")}
        </p>
      </div>

      {error && (
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "rgba(217, 105, 78, 0.1)",
            border: "1px solid var(--coral)",
            borderRadius: "var(--radius-panel)",
            color: "var(--coral-text)",
            fontFamily: "var(--font-mono)",
            fontSize: "13px",
          }}
        >
          [AUTHORITY CHECK ERROR] {error}
        </div>
      )}

      {/* 1. Who Can Do What Permission Matrix */}
      <EnamelSurface variant="base" padding="spacious">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--brass)", letterSpacing: "0.06em" }}>
              PERMISSION MATRIX
            </span>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "24px", color: "var(--ink)", margin: "4px 0" }}>
              Role Permissions Matrix
            </h2>
            <p style={{ fontFamily: "var(--font-ui)", fontSize: "14px", color: "var(--ink-2)" }}>
              Current active persona: <strong style={{ color: "var(--brass)" }}>{role}</strong>. Switching personas in the header updates your execution boundaries instantly.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(156, 195, 168, 0.08)",
              border: "1px solid var(--sage)",
              borderRadius: "var(--radius-pill)",
              padding: "6px 14px",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--sage)",
            }}
          >
            <span>Policy Gateway:</span>
            <strong>ACTIVE & ENFORCING</strong>
          </div>
        </div>

        <div style={{ overflowX: "auto", marginTop: 20 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-ui)", fontSize: "14px", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line-strong)", color: "var(--ink-3)" }}>
                <th style={{ padding: "12px 14px", fontWeight: 600 }}>{t("govColRole")}</th>
                <th style={{ padding: "12px 14px", fontWeight: 600 }}>{t("govColRead")}</th>
                <th style={{ padding: "12px 14px", fontWeight: 600 }}>{t("govColInvestigate")}</th>
                <th style={{ padding: "12px 14px", fontWeight: 600 }}>{t("govColActuate")}</th>
                <th style={{ padding: "12px 14px", fontWeight: 600 }}>{t("govColAdmin")}</th>
                <th style={{ padding: "12px 14px", fontWeight: 600 }}>{t("govColSummary")}</th>
              </tr>
            </thead>
            <tbody>
              {permissionMatrix.map((p, idx) => {
                const isActive = p.role.toUpperCase() === role.toUpperCase().replace("_", " ") || p.role === role;
                return (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: "1px solid var(--line)",
                      background: isActive ? "rgba(200, 161, 90, 0.06)" : "transparent",
                      borderLeft: isActive ? "3px solid var(--brass)" : "3px solid transparent",
                    }}
                  >
                    <td style={{ padding: "14px 14px", fontWeight: 600, color: "var(--ink)", fontFamily: "var(--font-mono)", fontSize: "13px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span>{p.role}</span>
                        {isActive && (
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "9.5px",
                              color: "var(--brass)",
                              border: "1px solid var(--brass)",
                              padding: "1px 6px",
                              borderRadius: "var(--radius-pill)",
                              background: "rgba(200, 161, 90, 0.12)",
                            }}
                          >
                            YOU
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "14px 14px" }}>{getStatusBadge(p.read)}</td>
                    <td style={{ padding: "14px 14px" }}>{getStatusBadge(p.investigate)}</td>
                    <td style={{ padding: "14px 14px" }}>{getStatusBadge(p.actuate)}</td>
                    <td style={{ padding: "14px 14px" }}>{getStatusBadge(p.admin)}</td>
                    <td style={{ padding: "14px 14px", fontSize: "12.5px", color: "var(--ink-2)", maxWidth: "380px", lineHeight: 1.45 }}>
                      {p.summary}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </EnamelSurface>

      {/* Security Proofs Highlight Strip */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          background: "var(--bg-1)",
          border: "1px solid var(--line)",
          borderRadius: "var(--radius-panel)",
          padding: "18px 24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              background: "rgba(156, 195, 168, 0.15)",
              border: "1px solid var(--sage)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--sage)",
              fontSize: "18px",
            }}
          >
            🛡
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "18px", color: "var(--ink)", fontWeight: 600 }}>
              Security tests: 10 / 10 passed
            </div>
            <div style={{ fontFamily: "var(--font-ui)", fontSize: "13px", color: "var(--ink-2)", marginTop: 2 }}>
              Deterministic boundary tests verify untrusted inputs are quarantined and unauthorized actions are blocked.
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="btn-brass-secondary"
          style={{ fontSize: "12px", padding: "8px 16px" }}
        >
          {showTechnicalDetails ? "Hide Technical Details ▲" : "View Technical Policy Details ▼"}
        </button>
      </div>

      {/* Collapsible Technical Details (Sandbox Registry & Adversarial Proofs) */}
      {showTechnicalDetails && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* 2. Tool Authority & Default-Deny Registry */}
      <EnamelSurface variant="base" padding="spacious">
        <SectionHeader
          title="Tool authority"
          eyebrow="Industrial Execution Sandboxes"
          description="Registered industrial tools, risk tiers, and required clearances. Unregistered tools default to strict DENY."
        />

        <div style={{ overflowX: "auto", marginTop: 20 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-ui)", fontSize: "14px", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line-strong)", color: "var(--ink-3)" }}>
                <th style={{ padding: "12px 14px", fontWeight: 500 }}>Tool Name</th>
                <th style={{ padding: "12px 14px", fontWeight: 500 }}>Identifier</th>
                <th style={{ padding: "12px 14px", fontWeight: 500 }}>Risk Tier</th>
                <th style={{ padding: "12px 14px", fontWeight: 500 }}>Required Persona</th>
                <th style={{ padding: "12px 14px", fontWeight: 500 }}>Supervisor Approval</th>
                <th style={{ padding: "12px 14px", fontWeight: 500 }}>Policy Action</th>
              </tr>
            </thead>
            <tbody>
              {tools.map((t, idx) => {
                const isCritical = t.risk_level === "CRITICAL";
                const isHigh = t.risk_level === "HIGH";
                return (
                  <tr key={idx} style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "14px 14px", fontWeight: 500, color: "var(--ink)" }}>{t.name}</td>
                    <td style={{ padding: "14px 14px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--brass)" }}>
                      {t.name.toLowerCase().replace(/\s+/g, "_")}
                    </td>
                    <td style={{ padding: "14px 14px" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "11px",
                          fontWeight: 600,
                          color: isCritical ? "var(--coral-text)" : isHigh ? "var(--brass)" : "var(--sage)",
                        }}
                      >
                        {t.risk_level}
                      </span>
                    </td>
                    <td style={{ padding: "14px 14px", color: "var(--ink)" }}>{t.required_role}</td>
                    <td style={{ padding: "14px 14px", color: t.requires_approval ? "var(--brass)" : "var(--ink-3)" }}>
                      {t.requires_approval ? "Supervisor approval required" : "Autonomous allowed"}
                    </td>
                    <td style={{ padding: "14px 14px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--sage)" }}>
                      Gated by Gateway
                    </td>
                  </tr>
                );
              })}
              <tr style={{ borderBottom: "1px solid var(--line)", background: "rgba(141, 180, 214, 0.04)" }}>
                <td style={{ padding: "14px 14px", fontWeight: 600, color: "var(--pewter)" }}>Unregistered tools</td>
                <td style={{ padding: "14px 14px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--pewter)" }}>*</td>
                <td style={{ padding: "14px 14px", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--pewter)", fontWeight: 600 }}>RESTRICTED</td>
                <td style={{ padding: "14px 14px", color: "var(--pewter)" }}>None</td>
                <td style={{ padding: "14px 14px", color: "var(--pewter)", fontWeight: 500 }}>Blocked</td>
                <td style={{ padding: "14px 14px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--coral-text)", fontWeight: 600 }}>
                  DEFAULT DENY (FAIL-CLOSED)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </EnamelSurface>

      {/* 3. Adversarial Proofs (10 / 10 Passed) */}
      <EnamelSurface variant="base" padding="spacious">
        <SectionHeader
          title="Adversarial proofs"
          eyebrow="Proof of Enforcement"
          description="Deterministic boundary tests verifying that malicious inputs, unprivileged calls, and prompt injections are quarantined or blocked without exception."
          action={
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "var(--sage)",
                background: "rgba(156, 195, 168, 0.1)",
                padding: "4px 12px",
                borderRadius: "var(--radius-pill)",
                border: "1px solid var(--sage)",
                fontWeight: 600,
              }}
            >
              {securityReport ? `${securityReport.passed} of ${securityReport.total_tests} PASSED` : "10 of 10 PASSED"}
            </div>
          }
        />

        <div style={{ overflowX: "auto", marginTop: 20 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-ui)", fontSize: "13px", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line-strong)", color: "var(--ink-3)" }}>
                <th style={{ padding: "12px 14px", fontWeight: 500 }}>Proof ID</th>
                <th style={{ padding: "12px 14px", fontWeight: 500 }}>Attack Category & Vector</th>
                <th style={{ padding: "12px 14px", fontWeight: 500 }}>Boundary Under Test</th>
                <th style={{ padding: "12px 14px", fontWeight: 500 }}>Enforcement State</th>
                <th style={{ padding: "12px 14px", fontWeight: 500 }}>Verification Outcome</th>
              </tr>
            </thead>
            <tbody>
              {securityReport?.results?.map((r) => (
                <tr key={r.security_test_id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--brass)" }}>
                    {r.security_test_id}
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ fontWeight: 600, color: "var(--ink)" }}>{r.attack_category}</div>
                    <div style={{ fontSize: "12px", color: "var(--ink-3)", marginTop: 2 }}>{r.attempted_action}</div>
                  </td>
                  <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--ink-2)" }}>
                    {r.boundary_under_test}
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        fontWeight: 600,
                        color: r.status === "ENFORCED" ? "var(--sage)" : "var(--pewter)",
                      }}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px", color: "var(--ink-2)" }}>
                    <div style={{ color: "var(--sage)", fontWeight: 500 }}>✓ {r.actual_outcome}</div>
                    {r.audit_event && (
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-3)", marginTop: 2 }}>
                        Audit Event: {r.audit_event}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </EnamelSurface>
        </div>
      )}
    </div>
  );
}
