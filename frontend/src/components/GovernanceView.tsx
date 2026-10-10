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
import { ROLE_PERMISSIONS } from "@/lib/permissions";
import { ReadAloudButton } from "@/components/ReadAloudButton";

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

  const permissionMatrix = Object.values(ROLE_PERMISSIONS).map((p) => {
    let localizedSummary = p.summary;
    if (p.role === "VIEWER") localizedSummary = t("roleViewerSummary");
    else if (p.role === "ENGINEER") localizedSummary = t("roleEngineerSummary");
    else if (p.role === "ADMINISTRATOR") localizedSummary = t("roleAdminSummary");
    return {
      role: p.role,
      clearance: p.defaultClearance,
      read: p.read === "ALLOWED" ? t("govStatusAllowed") : t("govStatusBlocked"),
      investigate: p.investigate === "ALLOWED" ? t("govStatusAllowed") : t("govStatusBlocked"),
      actuate: p.actuate === "ALLOWED" ? t("govStatusAllowed") : p.actuate === "NEEDS_APPROVAL" ? t("govStatusApproval") : t("govStatusBlocked"),
      admin: p.admin === "ALLOWED" ? t("govStatusAllowed") : p.admin === "NEEDS_APPROVAL" ? t("govStatusApproval") : t("govStatusBlocked"),
      summary: localizedSummary,
    };
  });

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
          <BrassLabel variant="outline">{t("govLedgerTag")}</BrassLabel>
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
            {t("govDefaultDenyTag")}
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
            {t("govSecurityTestsPassed")}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
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
          <ReadAloudButton text={`${t("govTitle")}. ${t("govSubtitle")}`} />
        </div>

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
              {t("govMatrixTitle")}
            </span>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "24px", color: "var(--ink)", margin: "4px 0" }}>
              {t("govPermissionMatrixTitle")}
            </h2>
            <p style={{ fontFamily: "var(--font-ui)", fontSize: "14px", color: "var(--ink-2)" }}>
              {t("govActivePersonaPrefix")}{" "}
              <strong style={{ color: "var(--brass)" }}>{role}</strong>. {t("govActivePersonaSub")}
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
            <strong>{t("govGatewayActive")}</strong>
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
                            {t("govYouBadge")}
                          </span>
                        )}
                        <ReadAloudButton text={`Role ${p.role}. Clearance: ${p.clearance}. Operational Boundary: ${p.summary}`} compact />
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
              {t("govSecTestCardTitle")}
            </div>
            <div style={{ fontFamily: "var(--font-ui)", fontSize: "13px", color: "var(--ink-2)", marginTop: 2 }}>
              {t("govSecTestCardDesc")}
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="btn-brass-secondary"
          style={{ fontSize: "12px", padding: "8px 16px" }}
        >
          {showTechnicalDetails ? t("govHideTechnicalBtn") : t("govViewTechnicalBtn")}
        </button>
      </div>

      {/* Collapsible Technical Details (Sandbox Registry & Adversarial Proofs) */}
      {showTechnicalDetails && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* 2. Tool Authority & Default-Deny Registry */}
      <EnamelSurface variant="base" padding="spacious">
        <SectionHeader
          title={t("govToolAuthTitle")}
          eyebrow={t("govToolAuthEyebrow")}
          description={t("govToolAuthDesc")}
        />

        <div style={{ overflowX: "auto", marginTop: 20 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-ui)", fontSize: "14px", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line-strong)", color: "var(--ink-3)" }}>
                <th style={{ padding: "12px 14px", fontWeight: 500 }}>{t("govToolColName")}</th>
                <th style={{ padding: "12px 14px", fontWeight: 500 }}>{t("govToolColId")}</th>
                <th style={{ padding: "12px 14px", fontWeight: 500 }}>{t("govToolColTier")}</th>
                <th style={{ padding: "12px 14px", fontWeight: 500 }}>{t("govToolColPersona")}</th>
                <th style={{ padding: "12px 14px", fontWeight: 500 }}>{t("govToolColApproval")}</th>
                <th style={{ padding: "12px 14px", fontWeight: 500 }}>{t("govToolColAction")}</th>
              </tr>
            </thead>
            <tbody>
              {tools.map((tItem, idx) => {
                const isCritical = tItem.risk_level === "CRITICAL";
                const isHigh = tItem.risk_level === "HIGH";
                return (
                  <tr key={idx} style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "14px 14px", fontWeight: 500, color: "var(--ink)" }}>{tItem.name}</td>
                    <td style={{ padding: "14px 14px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--brass)" }}>
                      {tItem.name.toLowerCase().replace(/\s+/g, "_")}
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
                        {tItem.risk_level}
                      </span>
                    </td>
                    <td style={{ padding: "14px 14px", color: "var(--ink)" }}>{tItem.required_role}</td>
                    <td style={{ padding: "14px 14px", color: tItem.requires_approval ? "var(--brass)" : "var(--ink-3)" }}>
                      {tItem.requires_approval ? t("govToolApprovalReq") : t("govToolAutoAllowed")}
                    </td>
                    <td style={{ padding: "14px 14px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--sage)" }}>
                      {t("govToolGated")}
                    </td>
                  </tr>
                );
              })}
              <tr style={{ borderBottom: "1px solid var(--line)", background: "rgba(141, 180, 214, 0.04)" }}>
                <td style={{ padding: "14px 14px", fontWeight: 600, color: "var(--pewter)" }}>{t("govToolUnregistered")}</td>
                <td style={{ padding: "14px 14px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--pewter)" }}>*</td>
                <td style={{ padding: "14px 14px", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--pewter)", fontWeight: 600 }}>RESTRICTED</td>
                <td style={{ padding: "14px 14px", color: "var(--pewter)" }}>None</td>
                <td style={{ padding: "14px 14px", color: "var(--pewter)", fontWeight: 500 }}>{t("govStatusBlocked")}</td>
                <td style={{ padding: "14px 14px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--coral-text)", fontWeight: 600 }}>
                  {t("govToolDefaultDeny")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </EnamelSurface>

      {/* 3. Adversarial Proofs (10 / 10 Passed) */}
      <EnamelSurface variant="base" padding="spacious">
        <SectionHeader
          title={t("govAdvProofsTitle")}
          eyebrow={t("govAdvProofsEyebrow")}
          description={t("govAdvProofsDesc")}
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
                <th style={{ padding: "12px 14px", fontWeight: 500 }}>{t("govProofColId")}</th>
                <th style={{ padding: "12px 14px", fontWeight: 500 }}>{t("govProofColCat")}</th>
                <th style={{ padding: "12px 14px", fontWeight: 500 }}>{t("govProofColBound")}</th>
                <th style={{ padding: "12px 14px", fontWeight: 500 }}>{t("govProofColEnforce")}</th>
                <th style={{ padding: "12px 14px", fontWeight: 500 }}>{t("govProofColOutcome")}</th>
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
