"use client";

import React, { useEffect, useState } from "react";
import {
  DataClassification,
  KnowledgeDocsResponse,
  KnowledgeSearchResponse,
  fetchKnowledgeDocuments,
  ingestKnowledgeDocument,
  searchKnowledge,
} from "@/lib/api";
import {
  EnamelSurface,
  BrassLabel,
  Divider,
} from "@/components/primitives";

interface KnowledgeViewProps {
  clearance: DataClassification;
}

export function KnowledgeView({ clearance }: KnowledgeViewProps) {
  const [docsData, setDocsData] = useState<KnowledgeDocsResponse | null>(null);
  const [isLoadingDocs, setIsLoadingDocs] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("Reactor R-204 operating pressure trip limits");
  const [searchResults, setSearchResults] = useState<KnowledgeSearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [ingestStatus, setIngestStatus] = useState<string | null>(null);
  const [isIngesting, setIsIngesting] = useState<boolean>(false);

  const loadDocuments = async () => {
    setIsLoadingDocs(true);
    try {
      const res = await fetchKnowledgeDocuments();
      setDocsData(res);
    } catch (err: unknown) {
      console.error("Failed to load knowledge documents", err);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetchKnowledgeDocuments()
      .then((res) => {
        if (active) {
          setDocsData(res);
          setIsLoadingDocs(false);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          console.error("Failed to load knowledge documents", err);
          setIsLoadingDocs(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    try {
      const res = await searchKnowledge(searchQuery.trim(), 5, clearance);
      setSearchResults(res);
    } catch (err: unknown) {
      setSearchError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSearching(false);
    }
  };

  const handleQuickIngest = async (filePath: string, classification: DataClassification) => {
    setIsIngesting(true);
    setIngestStatus(null);
    try {
      await ingestKnowledgeDocument(filePath, classification, "technical_specification", ["R-204"]);
      setIngestStatus(`Indexed: ${filePath.split("/").pop() || filePath}`);
      await loadDocuments();
    } catch (err: unknown) {
      setIngestStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsIngesting(false);
    }
  };

  // Clearance rank helper
  const clearanceRank: Record<string, number> = {
    INTERNAL: 0,
    RESTRICTED: 1,
    CONFIDENTIAL: 2,
    HIGHLY_CONFIDENTIAL: 3,
    CRITICAL: 3,
  };

  const isDocAccessible = (docClass: string) => {
    const userRank = clearanceRank[clearance] ?? 1;
    const docRank = clearanceRank[docClass] ?? 1;
    return userRank >= docRank;
  };

  // Human-friendly title mapper for demo specifications
  const getDocumentMeta = (filename: string) => {
    if (filename.includes("operating_sop")) {
      return {
        title: "Operating SOP",
        subtext: "Operating limits, normal baselines, and safety thresholds.",
        category: "STANDARD PROCEDURE",
      };
    }
    if (filename.includes("inspection_report")) {
      return {
        title: "Inspection Report",
        subtext: "Ultrasonic shell thickness survey and weld joint data.",
        category: "NDT SURVEY",
      };
    }
    if (filename.includes("equipment_specification")) {
      return {
        title: "Equipment Specification",
        subtext: "Pressure vessel R-204 design envelope and metallurgy.",
        category: "VESSEL SPEC",
      };
    }
    if (filename.includes("maintenance_history")) {
      return {
        title: "Maintenance History",
        subtext: "Overhaul logs and relief valve calibration records.",
        category: "PLANT HISTORY",
      };
    }
    if (filename.includes("adversarial")) {
      return {
        title: "Restricted Advisory Bulletin",
        subtext: "Quarantine sample containing untrusted prompt injection.",
        category: "SECURITY TEST FIXTURE",
      };
    }
    return {
      title: filename.replace(/_/g, " ").replace(".md", ""),
      subtext: "Technical documentation record stored in sovereign archive.",
      category: "DOCUMENT",
    };
  };

  // Grounded search summary derived from top retrieved chunk
  const getSearchAnswerSummary = (results: KnowledgeSearchResponse["results"]) => {
    if (!results || results.length === 0) return null;
    const topChunk = results[0]?.chunk;
    const topText = topChunk?.text || "";

    const sentences = topText.split(/(?<=[.?!])\s+/);
    const lead = sentences.slice(0, 2).join(" ");
    const filename = String(topChunk?.metadata?.filename || topChunk?.metadata?.title || "Technical Document");

    return {
      headline: lead.length > 20 ? lead : topText.slice(0, 160) + "...",
      detail: `Retrieved from ${filename} [chunk: ${topChunk.chunk_id}] with ${(results[0].score * 100).toFixed(1)}% semantic relevance.`,
      source: filename,
    };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Header Banner */}
      <EnamelSurface variant="base" padding="spacious">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
              <BrassLabel variant="outline">PLANT KNOWLEDGE</BrassLabel>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-3)" }}>
                PLANT UNIT 4 · HYDROCRACKER ASSET R-204
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
                }}
              >
                ON-PREMISE LOCAL VECTOR ARCHIVE
              </span>
            </div>

            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "38px", color: "var(--ink)", fontWeight: 500, lineHeight: 1.1 }}>
              Plant Knowledge
            </h1>

            <p style={{ fontFamily: "var(--font-ui)", fontSize: "15px", color: "var(--ink-2)", marginTop: 6, maxWidth: 680 }}>
              Private documents FORGE can use to answer questions. All retrieval happens locally on sovereign hardware with zero cloud exposure.
              Your active clearance is <strong style={{ color: "var(--brass)" }}>{clearance}</strong>.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={loadDocuments}
              disabled={isLoadingDocs}
              className="btn-brass-secondary"
              style={{ fontSize: "12px", padding: "6px 14px" }}
            >
              {isLoadingDocs ? "Refreshing..." : "↻ Refresh Records"}
            </button>
          </div>
        </div>

        <Divider style={{ margin: "20px 0" }} />

        {/* PROMINENT SEARCH BAR */}
        <form onSubmit={handleSearch} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--brass)", letterSpacing: "0.06em" }}>
              ASK A QUESTION ABOUT PLANT RECORDS
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-3)" }}>
              Clearance Enforced: {clearance}
            </span>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ask a question, e.g. 'What is the trip limit for Reactor R-204?'..."
              style={{
                flex: 1,
                minWidth: 280,
                background: "var(--bg-0)",
                border: "1px solid var(--line)",
                borderRadius: "var(--radius-panel)",
                color: "var(--ink)",
                fontFamily: "var(--font-ui)",
                fontSize: "14px",
                padding: "12px 16px",
                outline: "none",
                transition: "border-color var(--dur-fast) var(--ease-out)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--brass)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--line)")}
            />
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="btn-brass-primary"
              style={{ padding: "12px 24px", fontSize: "13px" }}
            >
              {isSearching ? "Searching..." : "Search Records ▶"}
            </button>
          </div>

          {/* Quick Query Suggestions */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-3)" }}>
              Suggested Queries:
            </span>
            {[
              "Reactor R-204 normal operating pressure",
              "R-204 high pressure trip limit shutdown threshold",
              "Relief valve PSV-204 set pressure and calibration",
              "Minimum shell wall thickness PAUT inspection",
            ].map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSearchQuery(q);
                }}
                style={{
                  background: "var(--bg-0)",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--radius-pill)",
                  color: "var(--ink-2)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  padding: "3px 10px",
                  cursor: "pointer",
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </form>

        {ingestStatus && (
          <div
            style={{
              marginTop: 14,
              padding: "8px 12px",
              background: "rgba(156, 195, 168, 0.08)",
              border: "1px solid var(--sage)",
              borderRadius: "var(--radius-sm)",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              color: "var(--sage)",
            }}
          >
            ✓ {ingestStatus}
          </div>
        )}

        {searchError && (
          <div
            style={{
              marginTop: 14,
              padding: "8px 12px",
              background: "rgba(217, 105, 78, 0.08)",
              border: "1px solid var(--coral)",
              borderRadius: "var(--radius-sm)",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              color: "var(--coral-text)",
            }}
          >
            [SEARCH ERROR] {searchError}
          </div>
        )}
      </EnamelSurface>

      {/* Main Two-Column Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 24 }} className="library-split-grid">
        {/* Left Column: Industrial Plant Records */}
        <EnamelSurface variant="base" padding="normal">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--brass)", letterSpacing: "0.06em" }}>
              PLANT DOCUMENTS ({docsData?.available_demo_documents.length ?? 5})
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-3)" }}>
              ASSET: REACTOR R-204
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {docsData?.available_demo_documents && docsData.available_demo_documents.length > 0 ? (
              docsData.available_demo_documents.map((doc, idx) => {
                const meta = getDocumentMeta(doc.filename);
                const accessible = isDocAccessible(doc.classification);
                return (
                  <div
                    key={idx}
                    style={{
                      background: "var(--bg-0)",
                      border: "1px solid var(--line)",
                      borderLeft: `3px solid ${accessible ? "var(--sage)" : "var(--coral)"}`,
                      borderRadius: "var(--radius-panel)",
                      padding: "14px 16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      opacity: accessible ? 1 : 0.75,
                      transition: "border-color var(--dur-fast) var(--ease-out)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "10.5px",
                          color: "var(--brass)",
                          letterSpacing: "0.04em",
                        }}
                      >
                        {meta.category}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "11px",
                          color: accessible ? "var(--sage)" : "var(--coral-text)",
                          border: `1px solid ${accessible ? "var(--sage)" : "var(--coral)"}`,
                          padding: "1px 8px",
                          borderRadius: "var(--radius-pill)",
                          background: accessible ? "rgba(156, 195, 168, 0.08)" : "rgba(217, 105, 78, 0.08)",
                        }}
                      >
                        {accessible ? `✓ Accessible (${doc.classification})` : `🔒 Restricted (${doc.classification})`}
                      </span>
                    </div>

                    <h3 style={{ fontFamily: "var(--font-ui)", fontSize: "15px", fontWeight: 600, color: "var(--ink)" }}>
                      {accessible ? `✓ ${meta.title}` : `🔒 ${meta.title}`}
                    </h3>

                    <p style={{ fontFamily: "var(--font-ui)", fontSize: "12.5px", color: "var(--ink-2)", lineHeight: 1.45 }}>
                      {meta.subtext}
                    </p>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingTop: 8,
                        borderTop: "1px solid var(--line)",
                        fontSize: "11px",
                        fontFamily: "var(--font-mono)",
                        color: "var(--ink-3)",
                      }}
                    >
                      <span>
                        Size: {(doc.size_bytes / 1024).toFixed(1)} KB
                      </span>
                      <button
                        onClick={() => handleQuickIngest(doc.file_path, doc.classification as DataClassification)}
                        disabled={isIngesting || !accessible}
                        style={{
                          background: "var(--bg-1)",
                          border: "1px solid var(--line-strong)",
                          borderRadius: "var(--radius-sm)",
                          color: accessible ? "var(--brass)" : "var(--pewter)",
                          fontFamily: "var(--font-mono)",
                          fontSize: "11px",
                          padding: "3px 8px",
                          cursor: accessible ? "pointer" : "not-allowed",
                        }}
                      >
                        {isIngesting ? "Indexing..." : "Re-Index ↺"}
                      </button>
                    </div>

                    {/* Secondary Technical Metadata */}
                    <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--ink-3)", opacity: 0.7 }}>
                      Ref: {doc.file_path}
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: "20px", textAlign: "center", color: "var(--ink-3)" }}>
                Loading plant technical documents...
              </div>
            )}
          </div>
        </EnamelSurface>

        {/* Right Column: Human-Readable Answer First, then Source Passages */}
        <EnamelSurface variant="base" padding="normal">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--brass)", letterSpacing: "0.06em" }}>
              ANSWER & SUPPORTING PASSAGES ({searchResults?.results.length ?? 0})
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-3)" }}>
              Sovereign Vector Retrieval
            </span>
          </div>

          {searchResults && searchResults.results.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Human-Readable Answer Card */}
              {(() => {
                const summary = getSearchAnswerSummary(searchResults.results);
                return (
                  <div
                    style={{
                      background: "rgba(156, 195, 168, 0.08)",
                      border: "1px solid var(--sage)",
                      borderRadius: "var(--radius-panel)",
                      padding: "16px 18px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--sage)", fontWeight: 600 }}>
                        TOP RETRIEVED SYNTHESIS
                      </span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-3)" }}>
                        Synthesized from private plant records
                      </span>
                    </div>

                    <p style={{ fontFamily: "var(--font-ui)", fontSize: "15px", fontWeight: 600, color: "var(--ink)", lineHeight: 1.45, marginBottom: 6 }}>
                      {summary?.headline}
                    </p>

                    <p style={{ fontFamily: "var(--font-ui)", fontSize: "13px", color: "var(--ink-2)", lineHeight: 1.5 }}>
                      {summary?.detail}
                    </p>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 8,
                        marginTop: 10,
                        paddingTop: 8,
                        borderTop: "1px solid rgba(156, 195, 168, 0.2)",
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        color: "var(--ink-3)",
                      }}
                    >
                      <span>
                        Primary Source: <strong style={{ color: "var(--brass)" }}>{String(summary?.source || "plant_archive")}</strong>
                      </span>
                      <span style={{ color: "var(--sage)" }}>
                        ✓ 100% on-premise local data
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--brass)", letterSpacing: "0.06em" }}>
                  RETRIEVED PASSAGES ({searchResults.results.length})
                </span>
                <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
              </div>

              {/* Source Passages with Complete Provenance Fields */}
              {searchResults.results.map((r, idx) => {
                const docName = (r.chunk.metadata?.title as string) || (r.chunk.metadata?.filename as string) || "Technical Document";
                const sourcePath = (r.chunk.metadata?.file_path as string) || (r.chunk.metadata?.source_path as string) || (r.chunk.metadata?.filename as string) || r.chunk.document_id;
                const section = (r.chunk.metadata?.section as string) || (r.chunk.metadata?.header as string) || `Chunk #${r.chunk.chunk_index}`;
                const chunkClass = ((r.chunk.metadata?.classification as string) || clearance);
                const asset = Array.isArray(r.chunk.metadata?.equipment_ids) && r.chunk.metadata.equipment_ids.length > 0
                  ? r.chunk.metadata.equipment_ids.join(", ")
                  : (r.chunk.metadata?.equipment_id as string) || "Reactor R-204";

                return (
                  <div
                    key={idx}
                    style={{
                      background: "var(--bg-0)",
                      border: "1px solid var(--line)",
                      borderLeft: "3px solid var(--sage)",
                      borderRadius: "var(--radius-panel)",
                      padding: "14px 16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--brass)", fontWeight: 600 }}>
                          PASSAGE [{String(idx + 1).padStart(2, "0")}]
                        </span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "var(--ink)", background: "var(--bg-2)", padding: "1px 6px", borderRadius: "var(--radius-sm)" }}>
                          {docName}
                        </span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--ink-3)", border: "1px solid var(--line)", padding: "1px 6px", borderRadius: "var(--radius-pill)" }}>
                          {chunkClass}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--sage)", fontWeight: 600 }}>
                          {(r.score * 100).toFixed(1)}% MATCH
                        </span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--ink-3)" }}>
                          (Score: {r.score.toFixed(3)})
                        </span>
                      </div>
                    </div>

                    {/* Section & Asset Association */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "var(--ink-3)" }}>
                      <span>Section: <strong style={{ color: "var(--ink-2)" }}>{section}</strong></span>
                      <span>·</span>
                      <span>Asset: <strong style={{ color: "var(--brass)" }}>{asset}</strong></span>
                      <span>·</span>
                      <span>Source: <span style={{ color: "var(--ink-3)" }}>{sourcePath}</span></span>
                    </div>

                    <p
                      style={{
                        fontFamily: "var(--font-ui)",
                        fontSize: "13.5px",
                        color: "var(--ink)",
                        lineHeight: 1.55,
                        background: "var(--bg-1)",
                        padding: "10px 12px",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--line)",
                        margin: "4px 0",
                      }}
                    >
                      &ldquo;{r.chunk.text}&rdquo;
                    </p>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontFamily: "var(--font-mono)",
                        fontSize: "10px",
                        color: "var(--ink-3)",
                      }}
                    >
                      <span>Document ID: {r.chunk.document_id}</span>
                      <span>Chunk ID: {r.chunk.chunk_id}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : searchResults && searchResults.results.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", background: "var(--bg-0)", border: "1px solid var(--line)", borderRadius: "var(--radius-panel)" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--coral-text)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                NO MATCHING RECORDS FOUND
              </div>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "20px", color: "var(--ink)", marginBottom: 8, fontWeight: 500 }}>
                No records matched &ldquo;{searchQuery}&rdquo;
              </h3>
              <p style={{ fontFamily: "var(--font-ui)", fontSize: "13.5px", color: "var(--ink-2)", maxWidth: "48ch", margin: "0 auto 16px" }}>
                Zero document chunks met the semantic threshold under clearance level <strong>{clearance}</strong>. Check spelling or try a broader search query.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("Reactor R-204 operating pressure");
                  searchKnowledge("Reactor R-204 operating pressure", 5, clearance).then(setSearchResults).catch(() => {});
                }}
                className="btn-brass-secondary"
                style={{ fontSize: "12px", padding: "6px 14px" }}
              >
                Reset to default query: Reactor R-204 operating pressure ↺
              </button>
            </div>
          ) : (
            <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--ink-3)" }}>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "20px", color: "var(--ink-2)", marginBottom: 6 }}>
                Ready to search plant records
              </p>
              <p style={{ fontFamily: "var(--font-ui)", fontSize: "13px" }}>
                Ask any operational question or select a suggestion above to inspect sovereign vector retrievals.
              </p>
            </div>
          )}
        </EnamelSurface>
      </div>

      <style jsx>{`
        @media (max-width: 960px) {
          .library-split-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
