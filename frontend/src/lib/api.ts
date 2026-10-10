/**
 * FORGE Sovereign Control Plane - Complete TypeScript API Client.
 * Strictly consumes real sovereign backend endpoints without external cloud dependencies.
 */

export type Role = "VIEWER" | "ENGINEER" | "ADMINISTRATOR";
export type DataClassification = "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED" | "CRITICAL";
export type PolicyDecisionType = "ALLOW" | "DENY";
export type VerificationStatus = "VERIFIED" | "PARTIALLY_VERIFIED" | "INSUFFICIENT_EVIDENCE" | "NEEDS_REVIEW" | "FAILED";
export type AgentActionType = "direct" | "knowledge" | "tool" | "combined";
export type AgentQueryStatus = "SUCCESS" | "POLICY_DENIED" | "TOOL_ERROR" | "DIRECT_ANSWER" | "INVALID_MODEL_OUTPUT";

export interface PolicyDecision {
  decision: PolicyDecisionType;
  reason: string;
  policy_id?: string;
  requester: string;
  role: Role;
  tool: string;
  classification: DataClassification;
  timestamp: string;
}

export interface KnowledgeQueryPlan {
  query: string;
  classification?: DataClassification;
}

export interface ToolCallPlan {
  tool_name: string;
  arguments: Record<string, unknown>;
}

export interface CalculationRequest {
  calculation: string;
  inputs: Record<string, unknown>;
  expected_units?: string;
}

export interface AgentPlan {
  action: AgentActionType;
  knowledge_queries: KnowledgeQueryPlan[];
  tool_calls: ToolCallPlan[];
  calculations: CalculationRequest[];
  reasoning?: string;
  direct_answer?: string;
}

export interface EvidenceRecord {
  evidence_id: string;
  source_type: string;
  source_reference: string;
  tool_name?: string;
  tool_execution_id?: string;
  retrieved_data: unknown;
  timestamp: string;
  classification: DataClassification;
  verified: boolean;
  document_id?: string;
  chunk_id?: string;
  filename?: string;
  retrieval_score?: number;
  retrieved_text?: string;
  source_image_hash?: string;
  finding_id?: string;
  equipment_id?: string;
  finding_type?: string;
  severity?: string;
}

export interface ConflictRecord {
  metric_or_topic: string;
  source_a: string;
  value_a: string;
  source_b: string;
  value_b: string;
  description: string;
}

export interface EvidenceSet {
  tool_evidence: EvidenceRecord[];
  knowledge_evidence: EvidenceRecord[];
  visual_evidence: EvidenceRecord[];
  policy_decisions: PolicyDecision[];
  execution_identifiers: string[];
  detected_conflicts: ConflictRecord[];
}

export interface VerificationCheck {
  check_id: string;
  check_type: string;
  status: VerificationStatus;
  description: string;
  evidence_ids: string[];
  details: Record<string, unknown>;
}

export interface CalculationResult {
  calculation_id: string;
  calculation_type: string;
  inputs: Record<string, unknown>;
  result: number;
  units: string;
  supporting_evidence_ids: string[];
  timestamp: string;
  description: string;
}

export interface VerificationResult {
  verification_id: string;
  status: VerificationStatus;
  checks: VerificationCheck[];
  evidence_ids: string[];
  calculations: CalculationResult[];
  calculation_results: CalculationResult[];
  conflicts: ConflictRecord[];
  summary: string;
  timestamp: string;
}

export interface AgentQueryRequest {
  query: string;
  scenario_id?: string;
  run_id?: string;
  role?: Role;
  requester?: string;
  classification?: DataClassification;
  has_approval?: boolean;
  image_path?: string;
  image_base64?: string;
  document_path?: string;
  document_base64?: string;
  document_filename?: string;
  language?: "en" | "hi" | "kn";
}

export interface AgentQueryResponse {
  query: string;
  final_answer: string;
  status: AgentQueryStatus;
  language?: string;
  scenario_id?: string;
  run_id?: string;
  execution_state?: string;
  model_route?: Record<string, unknown>;
  plan?: AgentPlan;
  agent_plan?: AgentPlan;
  knowledge_queries: KnowledgeQueryPlan[];
  tool_calls: ToolCallPlan[];
  policy_decisions: PolicyDecision[];
  policy_decision?: PolicyDecision;
  calculations?: CalculationResult[];
  evidence_set?: EvidenceSet;
  verification?: VerificationResult;
  execution_event_id?: string;
  timing?: DemoExecutionTiming;
  model_name?: string;
  provider?: string;
  latency_ms?: number;
  tokens?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}


export interface ImageProvenance {
  image_id: string;
  filename: string;
  mime_type: string;
  file_size_bytes: number;
  sha256_hash: string;
  classification: DataClassification;
  ingested_at: string;
  width?: number;
  height?: number;
}

export interface VisualFinding {
  finding_id: string;
  finding_type: string;
  description: string;
  equipment_id?: string;
  location?: string;
  severity: string;
  observed_value?: number;
  unit?: string;
  confidence: number;
  source_image_hash: string;
  provenance: {
    image_hash: string;
    image_filename: string;
    location_notes?: string;
    observer_model: string;
  };
  raw_observation?: string;
}

export interface VisionAnalyzeRequest {
  image_path?: string;
  image_base64?: string;
  filename?: string;
  equipment_id?: string;
  prompt?: string;
  classification?: DataClassification;
  role?: Role;
  requester?: string;
}

export interface VisionAnalyzeResponse {
  status: string;
  image_provenance: ImageProvenance;
  findings: VisualFinding[];
  evidence_records: EvidenceRecord[];
  model_metadata: Record<string, unknown>;
  classification: DataClassification;
  verification?: VerificationResult;
}

export interface SovereigntyStatusResponse {
  status: string;
  air_gapped: boolean;
  cloud_ai_sdks_blocked: boolean;
  external_network_calls_blocked: boolean;
  model_provider: {
    type: string;
    default_model: string;
    base_url: string;
    online: boolean;
    cloud_fallback: boolean;
  };
  vision_provider: {
    type: string;
    default_model: string;
    max_image_size_bytes: number;
    local_only: boolean;
  };
  embedding_provider: {
    type: string;
    model: string;
    local_only: boolean;
  };
  policy_gateway: {
    default_decision: string;
    strict_clearance_enforced: boolean;
  };
  verification_engine: {
    deterministic_checks_count: number;
    python_calculations_registered: number;
    llm_self_verification_prohibited: boolean;
  };
  audit_sink: {
    active_events_count: number;
    tamper_evident: boolean;
  };
}

export interface AgentTraceEvent {
  event_id: string;
  timestamp: string;
  event_type: string;
  requester: string;
  role: Role;
  details: Record<string, unknown>;
}

export interface ExecutionEvent {
  event_id: string;
  timestamp: string;
  requester: string;
  role: Role;
  tool: string;
  classification: DataClassification;
  risk: string;
  decision: PolicyDecisionType;
  reason: string;
  approval_required: boolean;
  approved: boolean;
  execution_status: string;
  parameters?: Record<string, unknown>;
  output_summary?: string;
}

export interface AuditEventsResponse {
  total_agent_events: number;
  total_tool_events: number;
  agent_events: AgentTraceEvent[];
  tool_events: ExecutionEvent[];
}

export interface KnowledgeDocumentSummary {
  filename: string;
  file_path: string;
  size_bytes: number;
  classification: string;
}

export interface KnowledgeDocsResponse {
  ingested_documents: Array<{
    document_id: string;
    filename: string;
    file_path: string;
    classification: DataClassification;
    chunks_count: number;
    sha256_hash: string;
  }>;
  available_demo_documents: KnowledgeDocumentSummary[];
  total_ingested: number;
  total_available: number;
}

export interface DocumentChunk {
  chunk_id: string;
  document_id: string;
  chunk_index: number;
  text: string;
  token_count: number;
  metadata: Record<string, unknown>;
}

export interface RetrievalResult {
  chunk: DocumentChunk;
  score: number;
  rank: number;
}

export interface KnowledgeSearchResponse {
  query: string;
  total_results: number;
  results: RetrievalResult[];
  evidence: EvidenceRecord[];
  synthesized_answer?: string;
  cited_sources?: string[];
  language?: string;
}

export interface ToolMetadata {
  name: string;
  version: string;
  description: string;
  risk_level: string;
  required_role: Role;
  required_classification: DataClassification;
  requires_approval: boolean;
  input_schema: Record<string, unknown>;
}

export interface VisionSamplesResponse {
  samples: Array<{
    filename: string;
    file_path: string;
    size_bytes: number;
    equipment_id?: string;
  }>;
}

export interface ModelsResponse {
  provider?: string;
  models?: string[];
  default_model?: string;
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  environment: string;
  sovereign_mode: boolean;
  model_provider: string;
  default_model: string;
  model_provider_online: boolean;
}

export async function fetchModels(): Promise<ModelsResponse> {
  try {
    const sov = await fetchSovereigntyStatus();
    return {
      provider: sov.model_provider.type,
      models: [sov.model_provider.default_model],
      default_model: sov.model_provider.default_model,
    };
  } catch {
    return {
      provider: "ollama",
      models: ["qwen3:8b"],
      default_model: "qwen3:8b",
    };
  }
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export interface ApiFetchOptions extends RequestInit {
  timeoutMs?: number;
}

async function apiFetch<T>(endpoint: string, options: ApiFetchOptions = {}): Promise<T> {
  const { timeoutMs = 30000, ...fetchOptions } = options;
  const url = `${BACKEND_URL}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...fetchOptions,
      signal: fetchOptions.signal || controller.signal,
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        ...fetchOptions.headers,
      },
    });

    if (!res.ok) {
      let errorDetail = `HTTP ${res.status}`;
      try {
        const errJson = await res.json();
        errorDetail = errJson.detail || JSON.stringify(errJson);
      } catch {
        // fallback
      }
      throw new Error(errorDetail);
    }

    return res.json();
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`Request to ${endpoint} timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}


export async function fetchHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>("/health");
}

export async function fetchSovereigntyStatus(): Promise<SovereigntyStatusResponse> {
  return apiFetch<SovereigntyStatusResponse>("/api/v1/system/sovereignty");
}

export async function fetchTools(): Promise<ToolMetadata[]> {
  return apiFetch<ToolMetadata[]>("/api/v1/tools");
}

export async function fetchAuditEvents(limit: number = 100): Promise<AuditEventsResponse> {
  return apiFetch<AuditEventsResponse>(`/api/v1/audit/events?limit=${limit}`);
}

export async function fetchKnowledgeDocuments(): Promise<KnowledgeDocsResponse> {
  return apiFetch<KnowledgeDocsResponse>("/api/v1/knowledge/documents");
}

export async function searchKnowledge(
  query: string,
  top_k: number = 5,
  classification?: DataClassification,
  language?: "en" | "hi" | "kn",
  synthesize: boolean = true
): Promise<KnowledgeSearchResponse> {
  return apiFetch<KnowledgeSearchResponse>("/api/v1/knowledge/search", {
    method: "POST",
    body: JSON.stringify({
      query,
      top_k,
      classification,
      language,
      synthesize,
    }),
    timeoutMs: 60000,
  });
}

export async function ingestKnowledgeDocument(
  file_path: string,
  classification?: DataClassification,
  document_type?: string,
  equipment_ids?: string[]
): Promise<unknown> {
  return apiFetch("/api/v1/knowledge/ingest", {
    method: "POST",
    body: JSON.stringify({
      file_path,
      classification,
      document_type,
      equipment_ids,
    }),
    timeoutMs: 30000,
  });
}

export async function queryAgent(request: AgentQueryRequest): Promise<AgentQueryResponse> {
  return apiFetch<AgentQueryResponse>("/api/v1/agent/query", {
    method: "POST",
    body: JSON.stringify(request),
    timeoutMs: 120000,
  });
}

export async function analyzeVision(request: VisionAnalyzeRequest): Promise<VisionAnalyzeResponse> {
  return apiFetch<VisionAnalyzeResponse>("/api/v1/vision/analyze", {
    method: "POST",
    body: JSON.stringify(request),
    timeoutMs: 90000,
  });
}

export async function fetchVisionSamples(): Promise<VisionSamplesResponse> {
  return apiFetch<VisionSamplesResponse>("/api/v1/vision/samples");
}

// =========================================================================
// Milestone 9: Industrial Mission & Demo Harness APIs
// =========================================================================

export type DemoScenarioId =
  | "r204_investigation"
  | "r204_pressure_variance"
  | "policy_denial"
  | "prompt_injection";

export interface DemoScenarioMetadata {
  id: DemoScenarioId;
  title: string;
  description: string;
  prompt: string;
  role: Role;
  clearance: DataClassification;
  image_path?: string;
  expected_status: AgentQueryStatus;
  expected_verification: string;
  highlights: string[];
}

export interface DemoRunRequest {
  scenario: DemoScenarioId;
  scenario_id?: DemoScenarioId;
  run_id?: string;
  role?: Role;
  classification?: DataClassification;
  deterministic?: boolean;
  language?: "en" | "hi" | "kn";
}

export interface DemoRunResponse extends AgentQueryResponse {
  scenario: DemoScenarioId;
  scenario_id: DemoScenarioId;
  run_id: string;
  execution_state: string;
  scenario_title: string;
  execution_phases: string[];
  audit_events: Array<{
    event_id: string;
    type: string;
    details: Record<string, unknown>;
    timestamp: string;
  }>;
  security_events: Array<{
    event_id: string;
    type: string;
    details: Record<string, unknown>;
    timestamp: string;
  }>;
  visual_findings: VisualFinding[];
  calculations: CalculationResult[];
  timing?: DemoExecutionTiming;
  is_synthetic: boolean;
  synthetic_notice: string;
  dossier?: {
    finding_summary?: string;
    operational_status?: string;
    verdict?: string;
    evidence_count?: number;
  };
}

export interface DemoExecutionTiming {
  total_duration_ms: number;
  planning_duration_ms: number;
  knowledge_retrieval_duration_ms: number;
  tool_execution_duration_ms: number;
  vision_duration_ms: number;
  verification_duration_ms: number;
  synthesis_duration_ms: number;
}

export interface DemoResetResponse {
  status: string;
  cleared_audit_events_count: number;
  cleared_security_events_count: number;
  reset_counters: Record<string, number>;
  knowledge_documents_preserved: number;
  equipment_records_preserved: number;
  models_preserved: boolean;
  message: string;
}

export interface PreflightCheckResult {
  component: string;
  status: "READY" | "WARNING" | "MISSING" | "FAILED";
  detected_value: string;
  requirement: string;
  message: string;
  manual_fix_command?: string | null;
}

export interface PreflightReport {
  timestamp: string;
  all_ready: boolean;
  deterministic_fallback_ready: boolean;
  runtime_mode: string;
  reasoning_status: string;
  vision_status: string;
  summary: string;
  checks: PreflightCheckResult[];
}

export async function fetchDemoScenarios(): Promise<DemoScenarioMetadata[]> {
  return apiFetch<DemoScenarioMetadata[]>("/api/v1/demo/scenarios");
}

export async function runDemoScenario(request: DemoRunRequest): Promise<DemoRunResponse> {
  return apiFetch<DemoRunResponse>("/api/v1/demo/run", {
    method: "POST",
    body: JSON.stringify(request),
    timeoutMs: 120000,
  });
}

export async function resetDemo(): Promise<DemoResetResponse> {
  return apiFetch<DemoResetResponse>("/api/v1/demo/reset", {
    method: "POST",
  });
}

export async function fetchPreflightReport(): Promise<PreflightReport> {
  return apiFetch<PreflightReport>("/api/v1/system/preflight");
}

export async function fetchDiagnostics(): Promise<{
  preflight: PreflightReport;
  reasoning: Record<string, unknown>;
  vision: Record<string, unknown>;
}> {
  return apiFetch("/api/v1/system/diagnostics");
}


// =========================================================================
// Milestone 10: Security Boundary Matrix & Report Types
// =========================================================================

export interface SecurityTestResult {
  security_test_id: string;
  attack_category: string;
  attempted_action: string;
  boundary_under_test: string;
  expected_outcome: string;
  actual_outcome: string;
  status: "BLOCKED" | "QUARANTINED" | "REJECTED" | "ENFORCED" | string;
  passed: boolean;
  audit_event?: string;
  execution_evidence: Record<string, unknown>;
}

export interface SecurityBoundaryReport {
  report_title: string;
  timestamp: string;
  total_tests: number;
  passed: number;
  failed: number;
  blocked: number;
  boundary_violations: number;
  results: SecurityTestResult[];
}

export async function fetchSecurityReport(): Promise<SecurityBoundaryReport> {
  return apiFetch<SecurityBoundaryReport>("/api/v1/security/report");
}

export async function fetchSecurityMatrix(): Promise<SecurityTestResult[]> {
  return apiFetch<SecurityTestResult[]>("/api/v1/security/matrix");
}

// =========================================================================
// Enamel & Brass: Section 12.1 Typed Runtime Capabilities Model
// =========================================================================

export interface RuntimeCapabilities {
  mode: "demo_harness" | "live";
  reasoning: {
    model: string;
    installed: boolean;
    reachable: boolean;
    live_for_runs: boolean;
  };
  vision: {
    model: string;
    installed: boolean;
    mode: "fixture" | "live";
  };
  embedding: {
    model: string;
    kind: "local_model" | "deterministic_fallback";
  };
  policy: {
    default: string;
  };
  outside_ai_services_configured: number;
  inference_endpoint_is_loopback: boolean;
  dependency_scan: {
    ran: boolean;
    cloud_sdks_found: number;
    at: string;
  };
  egress_counter: number | null;
  audit: {
    persisted: boolean;
    hash_chained: boolean;
    total_events: number;
  };
  security_tests: {
    last_run_at: string | null;
    total: number;
    passed: number | null;
  };
}

export async function fetchRuntimeCapabilities(): Promise<RuntimeCapabilities> {
  return apiFetch<RuntimeCapabilities>("/api/runtime/capabilities");
}

// =========================================================================
// Phase 2, 4, 5: Document Reader, Upload, Word Report, Model Routing APIs
// =========================================================================

export interface DocumentChunkItem {
  chunk_id: string;
  chunk_index: number;
  text: string;
}

export interface DocumentContentResponse {
  document_id: string;
  filename: string;
  classification: string;
  document_type: string;
  chunks_count: number;
  content_hash: string;
  ocr_status: "EXTRACTED" | "OCR_REQUIRED" | "FAILED" | string;
  extracted_text: string;
  chunks: DocumentChunkItem[];
}

export async function fetchDocumentContent(documentId: string): Promise<DocumentContentResponse> {
  return apiFetch<DocumentContentResponse>(`/api/v1/knowledge/documents/${encodeURIComponent(documentId)}/content`);
}

export async function uploadKnowledgeDocument(formData: FormData): Promise<{
  document_id: string;
  filename: string;
  chunks_count: number;
  content_hash: string;
  classification: string;
}> {
  const url = `${BACKEND_URL}/api/v1/knowledge/upload`;
  const res = await fetch(url, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const errorText = await res.text();
    let parsedMessage = errorText;
    try {
      const errObj = JSON.parse(errorText);
      parsedMessage = errObj.detail || errObj.message || errorText;
    } catch {
      // Keep errorText
    }
    throw new Error(parsedMessage || `Upload failed with HTTP ${res.status}`);
  }
  return res.json();
}

export async function exportWordReport(runData: Record<string, unknown>): Promise<Blob> {
  const url = `${BACKEND_URL}/api/v1/reports/export`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(runData),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `Report export failed with HTTP ${res.status}`);
  }
  return res.blob();
}

export interface ModelRouteInfo {
  task: string;
  target_model: string;
  provider: string;
  status: string;
  reason: string;
  vram_profile: string;
  is_local: boolean;
  notes: string;
}

export async function fetchModelRoutes(): Promise<ModelRouteInfo[]> {
  return apiFetch<ModelRouteInfo[]>("/api/v1/models/routes");
}

export interface VoiceEngineStatus {
  stt_available: boolean;
  tts_available: boolean;
  stt_engine: string;
  tts_engine: string;
  supported_languages: string[];
  installed_models: Record<string, string>;
  stt_models?: Record<string, string>;
  tts_voices?: Record<string, string>;
  installed_voices_details?: Array<{ id: string; name: string; languages?: string[]; engine?: string }>;
  models_loaded?: Record<string, boolean>;
  inference_tested?: Record<string, boolean>;
  cloud_providers_configured?: number;
  sovereign_guarantee: string;
  setup_instructions: Record<string, string>;
}

export interface VoiceTranscribeResponse {
  status: "SUCCESS" | "EMPTY_AUDIO" | "ENGINE_UNAVAILABLE" | "ERROR";
  text: string;
  language: string;
  confidence: number;
  engine: string;
  error_message?: string;
  sovereign_verified: boolean;
}

export interface VoiceSynthesizeResponse {
  status: "SUCCESS" | "VOICE_UNAVAILABLE" | "ENGINE_UNAVAILABLE" | "ERROR";
  audio_format: string;
  audio_base64?: string;
  engine: string;
  language: string;
  voice_name?: string;
  error_message?: string;
}

export async function fetchVoiceStatus(): Promise<VoiceEngineStatus> {
  return apiFetch<VoiceEngineStatus>("/api/v1/voice/status", { timeoutMs: 4000 });
}

export async function transcribeVoiceAudio(
  audioBlob: Blob,
  language: "en" | "hi" | "kn" = "en"
): Promise<VoiceTranscribeResponse> {
  const url = `${BACKEND_URL}/api/v1/voice/transcribe`;
  const formData = new FormData();
  formData.append("file", audioBlob, "speech_recording.wav");
  formData.append("language", language);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const res = await fetch(url, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || `Audio transcription failed with HTTP ${res.status}`);
    }
    return res.json();
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Local speech transcription timed out after 60000ms");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function synthesizeVoiceSpeech(
  text: string,
  language: "en" | "hi" | "kn" = "en"
): Promise<VoiceSynthesizeResponse> {
  return apiFetch<VoiceSynthesizeResponse>("/api/v1/voice/synthesize", {
    method: "POST",
    body: JSON.stringify({ text, language }),
    timeoutMs: 60000,
  });
}



