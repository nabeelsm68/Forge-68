"use client";

import React, { useEffect, useState } from "react";
import {
  DataClassification,
  DocumentContentResponse,
  KnowledgeDocsResponse,
  KnowledgeSearchResponse,
  fetchDocumentContent,
  fetchKnowledgeDocuments,
  ingestKnowledgeDocument,
  searchKnowledge,
  uploadKnowledgeDocument,
} from "@/lib/api";
import {
  EnamelSurface,
  BrassLabel,
  Divider,
} from "@/components/primitives";
import { useTranslation } from "@/lib/i18n";
import { ReadAloudButton } from "@/components/ReadAloudButton";

interface KnowledgeViewProps {
  clearance: DataClassification;
}

export function KnowledgeView({ clearance }: KnowledgeViewProps) {
  const { t, language } = useTranslation();
  const [docsData, setDocsData] = useState<KnowledgeDocsResponse | null>(null);
  const [isLoadingDocs, setIsLoadingDocs] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("Reactor R-204 operating pressure trip limits");
  const [searchResults, setSearchResults] = useState<KnowledgeSearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [ingestStatus, setIngestStatus] = useState<string | null>(null);
  const [isIngesting, setIsIngesting] = useState<boolean>(false);

  // Document Reader State
  const [readerDoc, setReaderDoc] = useState<DocumentContentResponse | null>(null);
  const [isLoadingReader, setIsLoadingReader] = useState<boolean>(false);
  const [readerError, setReaderError] = useState<string | null>(null);
  const [isReaderModalOpen, setIsReaderModalOpen] = useState<boolean>(false);
  const [readerViewTab, setReaderViewTab] = useState<"text" | "chunks">("text");

  // Document Upload State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadClassification, setUploadClassification] = useState<DataClassification>("INTERNAL");
  const [uploadEquipment, setUploadEquipment] = useState<string>("R-204");
  const [uploadDocType, setUploadDocType] = useState<string>("TECHNICAL_MANUAL");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);

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

  const handleOpenReader = async (docIdOrFilename: string) => {
    setIsLoadingReader(true);
    setReaderError(null);
    setReaderDoc(null);
    setIsReaderModalOpen(true);

    try {
      // Try exact document_id first
      const content = await fetchDocumentContent(docIdOrFilename);
      setReaderDoc(content);
    } catch (err: unknown) {
      // If docId is filename, locate in ingested docs
      const matchingIngested = docsData?.ingested_documents?.find(
        (d) => d.document_id === docIdOrFilename || d.filename === docIdOrFilename || docIdOrFilename.includes(d.filename)
      );
      if (matchingIngested) {
        try {
          const content = await fetchDocumentContent(matchingIngested.document_id);
          setReaderDoc(content);
          return;
        } catch (innerErr) {
          setReaderError(innerErr instanceof Error ? innerErr.message : String(innerErr));
          return;
        }
      }
      setReaderError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoadingReader(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    try {
      const res = await searchKnowledge(searchQuery.trim(), 5, clearance, language, true);
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

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError("Please select a file to upload (.pdf, .txt, or .md).");
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccessMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("classification", uploadClassification);
      formData.append("document_type", uploadDocType);
      formData.append("equipment_ids", uploadEquipment);

      const res = await uploadKnowledgeDocument(formData);
      setUploadSuccessMsg(
        `Successfully indexed ${res.filename} (${res.chunks_count} chunks created, SHA-256: ${res.content_hash.slice(0, 10)}...).`
      );
      setUploadFile(null);
      await loadDocuments();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("OCR_REQUIRED")) {
        setUploadError(`OCR Limit: Scanned/image-only PDF detected. Requires local OCR engine: ${msg}`);
      } else {
        setUploadError(`Upload failed: ${msg}`);
      }
    } finally {
      setIsUploading(false);
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
      title: filename.replace(/_/g, " ").replace(/\.[^/.]+$/, ""),
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
              <BrassLabel variant="outline">PLANT KNOWLEDGE FABRIC</BrassLabel>
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
              {t("knowledgeTitle")}
            </h1>

            <p style={{ fontFamily: "var(--font-ui)", fontSize: "15px", color: "var(--ink-2)", marginTop: 6, maxWidth: 680 }}>
              {t("knowledgeSubtitle")}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="btn-brass-primary"
              style={{ fontSize: "12px", padding: "8px 16px" }}
            >
              {t("knowledgeUploadButton")}
            </button>
            <button
              onClick={loadDocuments}
              disabled={isLoadingDocs}
              className="btn-brass-secondary"
              style={{ fontSize: "12px", padding: "8px 14px" }}
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
              SEARCH PLANT ARCHIVE WITH SEMANTIC GROUNDING
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
              {isSearching ? "Searching..." : t("knowledgeSearchButton")}
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
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.3fr", gap: 24 }} className="library-split-grid">
        {/* Left Column: Industrial Plant Records Library */}
        <EnamelSurface variant="base" padding="normal">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--brass)", letterSpacing: "0.06em" }}>
              INDEXED PLANT DOCUMENTS ({docsData?.ingested_documents?.length ?? 0} INDEXED / {docsData?.available_demo_documents?.length ?? 0} ON-DISK)
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-3)" }}>
              ASSET: R-204
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Display Ingested Documents first with full metadata */}
            {docsData?.ingested_documents && docsData.ingested_documents.length > 0 ? (
              docsData.ingested_documents.map((doc, idx) => {
                const meta = getDocumentMeta(doc.filename);
                const accessible = isDocAccessible(doc.classification);
                const format = doc.filename.split(".").pop()?.toUpperCase() || "TXT";

                return (
                  <div
                    key={`ingested-${idx}`}
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
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
                            fontSize: "10px",
                            background: "var(--bg-2)",
                            color: "var(--ink-2)",
                            padding: "1px 6px",
                            borderRadius: "var(--radius-sm)",
                          }}
                        >
                          {format}
                        </span>
                      </div>
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
                        {accessible ? `✓ ${doc.classification}` : `🔒 ${doc.classification}`}
                      </span>
                    </div>

                    <h3 style={{ fontFamily: "var(--font-ui)", fontSize: "15px", fontWeight: 600, color: "var(--ink)", margin: 0 }}>
                      {doc.filename}
                    </h3>

                    <p style={{ fontFamily: "var(--font-ui)", fontSize: "12.5px", color: "var(--ink-2)", lineHeight: 1.45, margin: 0 }}>
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
                        flexWrap: "wrap",
                        gap: 8,
                      }}
                    >
                      <div style={{ display: "flex", gap: 10 }}>
                        <span>Chunks: <strong style={{ color: "var(--ink)" }}>{doc.chunks_count}</strong></span>
                        <span>Hash: <span style={{ color: "var(--brass)" }}>{doc.sha256_hash ? `${doc.sha256_hash.slice(0, 8)}...` : "SHA256"}</span></span>
                      </div>

                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => handleOpenReader(doc.document_id)}
                          disabled={!accessible}
                          className="btn-brass-primary"
                          style={{
                            fontSize: "11px",
                            padding: "4px 10px",
                            borderRadius: "var(--radius-sm)",
                            cursor: accessible ? "pointer" : "not-allowed",
                          }}
                        >
                          🔍 Open Reader
                        </button>
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
                            padding: "4px 8px",
                            cursor: accessible ? "pointer" : "not-allowed",
                          }}
                        >
                          {isIngesting ? "..." : "Re-Index ↺"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : docsData?.available_demo_documents && docsData.available_demo_documents.length > 0 ? (
              docsData.available_demo_documents.map((doc, idx) => {
                const meta = getDocumentMeta(doc.filename);
                const accessible = isDocAccessible(doc.classification);
                return (
                  <div
                    key={`demo-${idx}`}
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
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "var(--brass)" }}>
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
                        }}
                      >
                        {doc.classification}
                      </span>
                    </div>

                    <h3 style={{ fontFamily: "var(--font-ui)", fontSize: "15px", fontWeight: 600, color: "var(--ink)", margin: 0 }}>
                      {meta.title} ({doc.filename})
                    </h3>

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
                      <span>Size: {(doc.size_bytes / 1024).toFixed(1)} KB</span>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => handleOpenReader(doc.filename)}
                          className="btn-brass-primary"
                          style={{ fontSize: "11px", padding: "4px 10px" }}
                        >
                          🔍 Open Reader
                        </button>
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
                            padding: "4px 8px",
                          }}
                        >
                          Index Now ↺
                        </button>
                      </div>
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

        {/* Right Column: Search Results with Reader Deep-Links */}
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
              {/* Grounded Synthesis / Human-Readable Answer Card */}
              {(() => {
                const hasSynthesized = !!(searchResults.synthesized_answer && searchResults.synthesized_answer.trim());
                const summary = getSearchAnswerSummary(searchResults.results);
                const answerText = hasSynthesized
                  ? searchResults.synthesized_answer!
                  : `${summary?.headline || ""} ${summary?.detail || ""}`;
                const citedSources = searchResults.cited_sources && searchResults.cited_sources.length > 0
                  ? searchResults.cited_sources
                  : [summary?.source || "plant_archive"];

                return (
                  <div
                    style={{
                      background: "rgba(156, 195, 168, 0.08)",
                      border: "1px solid var(--sage)",
                      borderRadius: "var(--radius-panel)",
                      padding: "16px 18px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--sage)", fontWeight: 600 }}>
                          {t("knowledgeSynthesisTitle")}
                        </span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-3)" }}>
                          {t("knowledgeSynthesisSubtitle")}
                        </span>
                        {citedSources.map((src, sIdx) => (
                          <span
                            key={sIdx}
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "10px",
                              color: "var(--brass)",
                              background: "rgba(200, 169, 126, 0.12)",
                              border: "1px solid var(--brass)",
                              borderRadius: "var(--radius-pill)",
                              padding: "1px 6px",
                            }}
                          >
                            {src}
                          </span>
                        ))}
                      </div>
                      <ReadAloudButton text={answerText} />
                    </div>

                    {hasSynthesized ? (
                      <div
                        style={{
                          fontFamily: "var(--font-ui)",
                          fontSize: "14px",
                          color: "var(--ink)",
                          lineHeight: 1.6,
                          whiteSpace: "pre-line",
                        }}
                      >
                        {answerText}
                      </div>
                    ) : (
                      <>
                        <p style={{ fontFamily: "var(--font-ui)", fontSize: "15px", fontWeight: 600, color: "var(--ink)", lineHeight: 1.45, marginBottom: 6 }}>
                          {summary?.headline}
                        </p>
                        <p style={{ fontFamily: "var(--font-ui)", fontSize: "13px", color: "var(--ink-2)", lineHeight: 1.5 }}>
                          {summary?.detail}
                        </p>
                      </>
                    )}

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 8,
                        marginTop: 12,
                        paddingTop: 8,
                        borderTop: "1px solid rgba(156, 195, 168, 0.2)",
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        color: "var(--ink-3)",
                      }}
                    >
                      <span>
                        {t("knowledgePrimarySource")}{" "}
                        <strong style={{ color: "var(--brass)" }}>{String(citedSources[0] || "plant_archive")}</strong>
                      </span>
                      <span style={{ color: "var(--sage)" }}>
                        {t("knowledgeOnPremData")}
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--brass)", letterSpacing: "0.06em" }}>
                  {t("knowledgeRetrievedPassages")} ({searchResults.results.length})
                </span>
                <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
              </div>

              {/* Source Passages with Complete Provenance Fields & Reader Actions */}
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
                        <button
                          onClick={() => handleOpenReader(r.chunk.document_id || docName)}
                          className="btn-brass-secondary"
                          style={{ fontSize: "10px", padding: "2px 8px" }}
                        >
                          Inspect Document ↗
                        </button>
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
                      <span>Doc ID: {r.chunk.document_id}</span>
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

      {/* DOCUMENT READER MODAL */}
      {isReaderModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => setIsReaderModalOpen(false)}
        >
          <div
            style={{
              background: "var(--bg-1)",
              border: "1px solid var(--line-strong)",
              borderRadius: "var(--radius-panel)",
              width: "100%",
              maxWidth: "850px",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid var(--line)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "var(--bg-0)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <BrassLabel variant="solid">DOCUMENT READER</BrassLabel>
                <h2 style={{ fontFamily: "var(--font-ui)", fontSize: "16px", fontWeight: 600, color: "var(--ink)", margin: 0 }}>
                  {readerDoc?.filename || "Loading Document..."}
                </h2>
              </div>
              <button
                onClick={() => setIsReaderModalOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--ink-3)",
                  fontSize: "18px",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Subhead / Metadata Badges */}
            {readerDoc && (
              <div
                style={{
                  padding: "10px 20px",
                  background: "var(--bg-2)",
                  borderBottom: "1px solid var(--line)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 10,
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                }}
              >
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <span>
                    Classification: <strong style={{ color: "var(--brass)" }}>{readerDoc.classification}</strong>
                  </span>
                  <span>·</span>
                  <span>
                    OCR Status:{" "}
                    <strong
                      style={{
                        color: readerDoc.ocr_status === "EXTRACTED" ? "var(--sage)" : "var(--coral-text)",
                      }}
                    >
                      {readerDoc.ocr_status}
                    </strong>
                  </span>
                  <span>·</span>
                  <span>
                    Chunks: <strong style={{ color: "var(--ink)" }}>{readerDoc.chunks_count}</strong>
                  </span>
                </div>

                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ color: "var(--ink-3)" }}>
                    SHA-256: {readerDoc.content_hash.slice(0, 16)}...
                  </span>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      onClick={() => setReaderViewTab("text")}
                      style={{
                        background: readerViewTab === "text" ? "var(--brass)" : "var(--bg-0)",
                        color: readerViewTab === "text" ? "#000" : "var(--ink-2)",
                        border: "1px solid var(--line)",
                        borderRadius: "var(--radius-sm)",
                        padding: "2px 8px",
                        fontSize: "10px",
                        cursor: "pointer",
                      }}
                    >
                      Full Text
                    </button>
                    <button
                      onClick={() => setReaderViewTab("chunks")}
                      style={{
                        background: readerViewTab === "chunks" ? "var(--brass)" : "var(--bg-0)",
                        color: readerViewTab === "chunks" ? "#000" : "var(--ink-2)",
                        border: "1px solid var(--line)",
                        borderRadius: "var(--radius-sm)",
                        padding: "2px 8px",
                        fontSize: "10px",
                        cursor: "pointer",
                      }}
                    >
                      Chunks ({readerDoc.chunks.length})
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Body */}
            <div style={{ padding: "20px", overflowY: "auto", flex: 1 }}>
              {isLoadingReader ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--ink-3)" }}>
                  Extracting and verifying document content on sovereign storage...
                </div>
              ) : readerError ? (
                <div
                  style={{
                    padding: "16px",
                    background: "rgba(217, 105, 78, 0.08)",
                    border: "1px solid var(--coral)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--coral-text)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "13px",
                  }}
                >
                  [READER ERROR] {readerError}
                </div>
              ) : readerDoc ? (
                readerViewTab === "text" ? (
                  <pre
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "12px",
                      color: "var(--ink-1)",
                      lineHeight: 1.6,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      background: "var(--bg-0)",
                      padding: "16px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--line)",
                      margin: 0,
                    }}
                  >
                    {readerDoc.extracted_text}
                  </pre>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {readerDoc.chunks.map((chk, i) => (
                      <div
                        key={i}
                        style={{
                          background: "var(--bg-0)",
                          border: "1px solid var(--line)",
                          borderRadius: "var(--radius-sm)",
                          padding: "12px",
                        }}
                      >
                        <div
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "10.5px",
                            color: "var(--brass)",
                            marginBottom: 6,
                          }}
                        >
                          Chunk #{chk.chunk_index} · ID: {chk.chunk_id}
                        </div>
                        <p style={{ fontFamily: "var(--font-ui)", fontSize: "13px", color: "var(--ink)", margin: 0, lineHeight: 1.5 }}>
                          {chk.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )
              ) : null}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "12px 20px",
                borderTop: "1px solid var(--line)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "var(--bg-0)",
              }}
            >
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--sage)" }}>
                ✓ Cryptographic hash and provenance verified locally.
              </span>
              <button
                onClick={() => setIsReaderModalOpen(false)}
                className="btn-brass-secondary"
                style={{ fontSize: "12px", padding: "6px 14px" }}
              >
                Close Reader
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT UPLOAD MODAL */}
      {isUploadModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => setIsUploadModalOpen(false)}
        >
          <div
            style={{
              background: "var(--bg-1)",
              border: "1px solid var(--line-strong)",
              borderRadius: "var(--radius-panel)",
              width: "100%",
              maxWidth: "540px",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid var(--line)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "var(--bg-0)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <BrassLabel variant="solid">LOCAL INGESTION</BrassLabel>
                <h2 style={{ fontFamily: "var(--font-ui)", fontSize: "16px", fontWeight: 600, color: "var(--ink)", margin: 0 }}>
                  Upload Plant Document
                </h2>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--ink-3)",
                  fontSize: "18px",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleUploadSubmit} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--brass)", marginBottom: 6 }}>
                  DOCUMENT FILE (.PDF, .TXT, .MD — MAX 25MB)
                </label>
                <input
                  type="file"
                  accept=".pdf,.txt,.md"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  required
                  style={{
                    width: "100%",
                    padding: "8px",
                    background: "var(--bg-0)",
                    border: "1px solid var(--line)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--ink)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--brass)", marginBottom: 6 }}>
                    CLASSIFICATION LEVEL
                  </label>
                  <select
                    value={uploadClassification}
                    onChange={(e) => setUploadClassification(e.target.value as DataClassification)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      background: "var(--bg-0)",
                      border: "1px solid var(--line)",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--ink)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "12px",
                    }}
                  >
                    <option value="INTERNAL">INTERNAL</option>
                    <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                    <option value="RESTRICTED">RESTRICTED</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--brass)", marginBottom: 6 }}>
                    DOCUMENT TYPE
                  </label>
                  <select
                    value={uploadDocType}
                    onChange={(e) => setUploadDocType(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      background: "var(--bg-0)",
                      border: "1px solid var(--line)",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--ink)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "12px",
                    }}
                  >
                    <option value="TECHNICAL_MANUAL">TECHNICAL_MANUAL</option>
                    <option value="SOP">OPERATING_SOP</option>
                    <option value="INSPECTION">INSPECTION_REPORT</option>
                    <option value="MAINTENANCE">MAINTENANCE_LOG</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--brass)", marginBottom: 6 }}>
                  EQUIPMENT ASSET TAGS (COMMA SEPARATED)
                </label>
                <input
                  type="text"
                  value={uploadEquipment}
                  onChange={(e) => setUploadEquipment(e.target.value)}
                  placeholder="e.g. R-204, PI-204"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    background: "var(--bg-0)",
                    border: "1px solid var(--line)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--ink)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                  }}
                />
              </div>

              {uploadError && (
                <div
                  style={{
                    padding: "8px 12px",
                    background: "rgba(217, 105, 78, 0.08)",
                    border: "1px solid var(--coral)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--coral-text)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                  }}
                >
                  {uploadError}
                </div>
              )}

              {uploadSuccessMsg && (
                <div
                  style={{
                    padding: "8px 12px",
                    background: "rgba(156, 195, 168, 0.08)",
                    border: "1px solid var(--sage)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--sage)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                  }}
                >
                  ✓ {uploadSuccessMsg}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="btn-brass-secondary"
                  style={{ fontSize: "12px", padding: "8px 16px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !uploadFile}
                  className="btn-brass-primary"
                  style={{ fontSize: "12px", padding: "8px 20px" }}
                >
                  {isUploading ? "Ingesting & Indexing..." : "Ingest Document ▶"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
