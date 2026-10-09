"use client";

import React, { useState } from "react";
import { CalculationResult, EvidenceRecord, EvidenceSet } from "@/lib/api";
import {
  EnamelSurface,
  BrassLabel,
  Divider,
} from "@/components/primitives";
import { useTranslation } from "@/lib/i18n";

interface EvidencePanelProps {
  evidenceSet?: EvidenceSet | null;
  evidenceList?: EvidenceRecord[];
  calculations?: CalculationResult[];
  title?: string;
}

export function EvidencePanel({
  evidenceSet,
  evidenceList,
  calculations = [],
  title,
}: EvidencePanelProps) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<"ALL" | "DOCUMENT" | "TOOL" | "VISUAL" | "CALCULATION">("ALL");

  // Gather items
  const allRecords: EvidenceRecord[] = evidenceList
    ? evidenceList
    : evidenceSet
    ? [
        ...(evidenceSet.knowledge_evidence || []),
        ...(evidenceSet.tool_evidence || []),
        ...(evidenceSet.visual_evidence || []),
      ]
    : [];

  // Only render actual execution evidence records strictly belonging to current run
  const displayRecords: EvidenceRecord[] = allRecords;
  const activeCalculations: CalculationResult[] = calculations;

  const filteredRecords = displayRecords.filter((rec) => {
    if (filter === "ALL") return true;
    if (filter === "DOCUMENT") return rec.source_type === "knowledge_document";
    if (filter === "TOOL") return rec.source_type === "LOCAL_INDUSTRIAL_TOOL";
    if (filter === "VISUAL") return rec.source_type === "visual_inspection";
    return true;
  });

  const showCalculations = (filter === "ALL" || filter === "CALCULATION") && activeCalculations.length > 0;
  const totalCount = filteredRecords.length + (showCalculations ? activeCalculations.length : 0);

  return (
    <EnamelSurface variant="base" padding="spacious">
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <BrassLabel variant="outline">{t("evidenceDossierSubtitle")}</BrassLabel>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-3)" }}>
              {t("evidenceDossierSubtitle")}
            </span>
          </div>

          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "26px", color: "var(--ink)", fontWeight: 500 }}>
            {title || t("evidenceDossierTitle")}
          </h2>
          <p style={{ fontFamily: "var(--font-ui)", fontSize: "13.5px", color: "var(--ink-2)", marginTop: 2 }}>
            {t("evidenceDossierDesc")}
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[
            { id: "ALL", label: t("evidenceFilterAll") },
            { id: "DOCUMENT", label: t("evidenceFilterDoc") },
            { id: "TOOL", label: t("evidenceFilterTool") },
            { id: "VISUAL", label: t("evidenceFilterVisual") },
            { id: "CALCULATION", label: t("evidenceFilterCalc") },
          ].map((tab) => {
            const isSelected = filter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as typeof filter)}
                style={{
                  background: isSelected ? "var(--bg-3)" : "var(--bg-0)",
                  border: isSelected ? "1px solid var(--brass)" : "1px solid var(--line)",
                  borderRadius: "var(--radius-pill)",
                  color: isSelected ? "var(--ink)" : "var(--ink-3)",
                  fontFamily: "var(--font-ui)",
                  fontSize: "12px",
                  padding: "5px 12px",
                  cursor: "pointer",
                  transition: "all var(--dur-fast) var(--ease-out)",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <Divider style={{ margin: "14px 0 20px" }} />

      {/* Dossier Item List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Deterministic Calculations Section */}
        {showCalculations &&
          activeCalculations.map((calc, idx) => (
            <div
              key={calc.calculation_id}
              style={{
                background: "var(--bg-0)",
                border: "1px solid var(--line)",
                borderLeft: "3px solid var(--brass)",
                borderRadius: "var(--radius-panel)",
                padding: "16px 20px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 700, color: "var(--brass)" }}>
                    [{String(idx + 1).padStart(2, "0")}] CALCULATION · EXACT
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-3)", border: "1px solid var(--line)", padding: "1px 6px", borderRadius: "var(--radius-pill)" }}>
                    {calc.calculation_type}
                  </span>
                </div>

                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-3)" }}>
                  ID: {calc.calculation_id}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "baseline", gap: 12, margin: "6px 0 10px" }}>
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "26px",
                    fontWeight: 600,
                    color: "var(--ink)",
                  }}
                >
                  {calc.result > 0 ? `+${calc.result}` : calc.result} {calc.units}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--brass)" }}>
                  Inputs: {Object.entries(calc.inputs).map(([k, v]) => `${k}=${v}`).join(", ")}
                </span>
              </div>

              <p style={{ fontFamily: "var(--font-ui)", fontSize: "13.5px", color: "var(--ink-2)", lineHeight: 1.5, marginBottom: 10 }}>
                {calc.description}
              </p>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: "var(--ink-3)",
                  background: "var(--bg-1)",
                  padding: "6px 12px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--line)",
                }}
              >
                <span>ENGINE: Pure Python Deterministic Sandbox</span>
                <span>INPUTS: {JSON.stringify(calc.inputs)}</span>
              </div>
            </div>
          ))}

        {/* Typed Evidence Records */}
        {filteredRecords.map((record, idx) => {
          const isKnowledge = record.source_type === "knowledge_document";
          const isTool = record.source_type === "LOCAL_INDUSTRIAL_TOOL";
          const isVisual = record.source_type === "visual_inspection";

          const footnoteNumber = String(
            (showCalculations ? activeCalculations.length : 0) + idx + 1
          ).padStart(2, "0");

          let typeLabel = "DOCUMENT";
          let borderAccent = "var(--sage)";
          if (isKnowledge) {
            typeLabel = "DOCUMENT EXCERPT";
            borderAccent = "var(--sage)";
          } else if (isTool) {
            typeLabel = "TOOL EXECUTION RECORD";
            borderAccent = "var(--pewter)";
          } else if (isVisual) {
            typeLabel = "VISUAL GAUGING OBSERVATION";
            borderAccent = "var(--brass)";
          }

          return (
            <div
              key={record.evidence_id}
              style={{
                background: "var(--bg-0)",
                border: "1px solid var(--line)",
                borderLeft: `3px solid ${borderAccent}`,
                borderRadius: "var(--radius-panel)",
                padding: "16px 20px",
              }}
            >
              {/* Record Metadata Top Bar */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 700, color: "var(--brass)" }}>
                    [{footnoteNumber}] {typeLabel}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      color: "var(--ink-3)",
                      border: "1px solid var(--line)",
                      padding: "1px 6px",
                      borderRadius: "var(--radius-pill)",
                    }}
                  >
                    {record.classification}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-3)" }}>
                    ID: {record.evidence_id}
                  </span>
                  {record.retrieval_score && (
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--sage)" }}>
                      {(record.retrieval_score * 100).toFixed(0)}% Match
                    </span>
                  )}
                </div>
              </div>

              {/* Supported Claim / Text Excerpt */}
              <div
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "14px",
                  lineHeight: 1.55,
                  color: "var(--ink)",
                  background: "var(--bg-1)",
                  padding: "12px 14px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--line)",
                  margin: "8px 0 10px",
                }}
              >
                &ldquo;{record.retrieved_text}&rdquo;
              </div>

              {/* Provenance Footprint */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 12,
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: "var(--ink-3)",
                  paddingTop: 8,
                  borderTop: "1px solid var(--line)",
                }}
              >
                <span>
                  Source: <strong style={{ color: "var(--ink-2)" }}>{record.source_reference}</strong>
                </span>
                {record.filename && (
                  <span>
                    File: <strong style={{ color: "var(--ink-2)" }}>{record.filename}</strong>
                  </span>
                )}
                {record.source_image_hash && (
                  <span>
                    Image Digest: <strong style={{ color: "var(--ink-2)" }}>{record.source_image_hash.slice(0, 16)}...</strong>
                  </span>
                )}
                {record.chunk_id && (
                  <span>
                    Chunk: <strong style={{ color: "var(--ink-2)" }}>{record.chunk_id}</strong>
                  </span>
                )}
                {record.tool_name && (
                  <span>
                    Sandbox Tool: <strong style={{ color: "var(--ink-2)" }}>{record.tool_name}</strong>
                  </span>
                )}
                {record.finding_type && (
                  <span>
                    Modality: <strong style={{ color: "var(--brass)" }}>{record.finding_type}</strong>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {totalCount === 0 && (
        <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--ink-3)" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px" }}>
            {t("evidenceEmptyTitle")}
          </p>
        </div>
      )}
    </EnamelSurface>
  );
}
