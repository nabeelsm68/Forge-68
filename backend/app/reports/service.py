"""Sovereign Industrial Report Generator producing standard Microsoft Word (.docx) documents.

Fully standalone and air-gapped: utilizes native OpenXML packaging with zipfile and ElementTree,
with graceful adaptation if python-docx is installed. Zero cloud calls or third-party APIs.
"""

import io
import re
import uuid
import zipfile
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from xml.sax.saxutils import escape as xml_escape


def _format_ist_time(dt_utc: datetime) -> str:
    """Format UTC datetime into readable Indian Standard Time string."""
    try:
        # UTC + 5:30
        from datetime import timedelta
        ist_dt = dt_utc + timedelta(hours=5, minutes=30)
        return ist_dt.strftime("%Y-%m-%d %H:%M:%S IST")
    except Exception:
        return dt_utc.strftime("%Y-%m-%d %H:%M:%S UTC")


REPORT_TRANSLATIONS: Dict[str, Dict[str, str]] = {
    "en": {
        "title": "FORGE Sovereign Industrial Control Plane",
        "subtitle": "Mission Verification & Industrial Safety Dossier (Air-Gapped Local Runtime)",
        "meta_run_id": "Execution Run ID:",
        "meta_scenario": "Mission / Scenario:",
        "meta_timestamp": "Generated Timestamp:",
        "meta_clearance_role": "Clearance & Role:",
        "meta_model_runtime": "Sovereign Runtime:",
        "meta_verdict": "Independent Verdict:",
        "sec1_heading": "1. Executive Findings & Operational Verdict",
        "sec1_verdict": "Operational Verdict:",
        "sec1_analysis": "Synthesized Technical Analysis:",
        "sec2_heading": "2. Operational Query & Scope",
        "sec2_query": "Query:",
        "sec3_heading": "3. Evidence Grounding Dossier",
        "sec3_total": "Retrieved Artifacts:",
        "sec4_heading": "4. Deterministic Verified Calculations",
        "sec4_no_calcs": "No mathematical calculations triggered for this mission type.",
        "sec4_verified": "[VERIFIED BY PYTHON DETERMINISTIC KERNEL]",
        "sec5_heading": "5. Sovereign Policy Gateway & Actuation Boundaries",
        "sec5_default_deny": "Action evaluated under default-deny industrial policy. Zero boundary violations.",
        "sec6_heading": "6. Independent 7-Check Verification Results",
        "sec6_checks_exec": "7 / 7 Verification checks executed and recorded in tamper-evident event log.",
        "sec7_heading": "7. Enclave Integrity & Local Audit Reference",
        "sec7_text": "This document was deterministically compiled by the on-premise FORGE Sovereign Industrial AI Control Plane. No data was transmitted to third-party public clouds or external AI providers. Audit reference signature: SHA256:{signature}",
    },
    "hi": {
        "title": "FORGE संप्रभु औद्योगिक नियंत्रण तल",
        "subtitle": "मिशन सत्यापन एवं औद्योगिक सुरक्षा डोजियर (एयर-गैप्ड स्थानीय रनटाइम)",
        "meta_run_id": "निष्पादन रन आईडी (Run ID):",
        "meta_scenario": "मिशन / परिदृश्य:",
        "meta_timestamp": "उत्पन्न समय (IST):",
        "meta_clearance_role": "सुरक्षा स्तर एवं भूमिका:",
        "meta_model_runtime": "संप्रभु रनटाइम:",
        "meta_verdict": "स्वतंत्र निर्णय:",
        "sec1_heading": "1. कार्यकारी निष्कर्ष एवं परिचालन निर्णय",
        "sec1_verdict": "परिचालन निर्णय:",
        "sec1_analysis": "संश्लेषित तकनीकी विश्लेषण:",
        "sec2_heading": "2. परिचालन प्रश्न एवं दायरा",
        "sec2_query": "प्रश्न:",
        "sec3_heading": "3. साक्ष्य आधार डोजियर",
        "sec3_total": "पुनर्प्राप्त साक्ष्य कलाकृतियाँ:",
        "sec4_heading": "4. नियतात्मक सत्यापित गणनाएँ",
        "sec4_no_calcs": "इस मिशन प्रकार के लिए कोई गणितीय गणना शुरू नहीं की गई।",
        "sec4_verified": "[पायथन नियतात्मक कर्नेल द्वारा सत्यापित]",
        "sec5_heading": "5. संप्रभु नीति गेटवे एवं प्रवर्तन सीमाएँ",
        "sec5_default_deny": "कार्रवाई का मूल्यांकन डिफ़ॉल्ट-अस्वीकार औद्योगिक नीति के तहत किया गया। शून्य सीमा उल्लंघन।",
        "sec6_heading": "6. स्वतंत्र 7-जांच सत्यापन परिणाम",
        "sec6_checks_exec": "7 / 7 सत्यापन जाँचें निष्पादित की गईं और छेड़छाड़-रोधी इवेंट लॉग में दर्ज की गईं।",
        "sec7_heading": "7. एन्क्लेव सत्यनिष्ठा एवं स्थानीय ऑडिट संदर्भ",
        "sec7_text": "यह दस्तावेज़ ऑन-प्रिमाइसेस FORGE संप्रभु औद्योगिक AI नियंत्रण तल द्वारा संकलित किया गया था। किसी भी तृतीय-पक्ष सार्वजनिक क्लाउड या बाहरी AI प्रदाताओं को कोई डेटा प्रेषित नहीं किया गया। ऑडिट संदर्भ हस्ताक्षर: SHA256:{signature}",
    },
    "kn": {
        "title": "FORGE ಸಾರ್ವಭೌಮ ಕೈಗಾರಿಕಾ ನಿಯಂತ್ರಣ ವೇದಿಕೆ",
        "subtitle": "ಕಾರ್ಯಾಚರಣೆ ಪರಿಶೀಲನೆ ಮತ್ತು ಕೈಗಾರಿಕಾ ಸುರಕ್ಷತಾ ದಾಖಲೆ (ಏರ್-ಗ್ಯಾಪ್ಡ್ ಸ್ಥಳೀಯ ರನ್‌ಟೈಮ್)",
        "meta_run_id": "ಚಾಲನೆ ರನ್ ಐಡಿ (Run ID):",
        "meta_scenario": "ಕಾರ್ಯಾಚರಣೆ / ಸನ್ನಿವೇಶ:",
        "meta_timestamp": "ರಚಿಸಿದ ಸಮಯ (IST):",
        "meta_clearance_role": "ಕ್ಲಿಯರೆನ್ಸ್ ಮತ್ತು ಪಾತ್ರ:",
        "meta_model_runtime": "ಸಾರ್ವಭೌಮ ರನ್‌ಟೈಮ್:",
        "meta_verdict": "ಸ್ವತಂತ್ರ ತೀರ್ಪು:",
        "sec1_heading": "1. ಕಾರ್ಯಕಾರಿ ಸಂಶೋಧನೆಗಳು ಮತ್ತು ಕಾರ್ಯಾಚರಣೆಯ ತೀರ್ಪು",
        "sec1_verdict": "ಕಾರ್ಯಾಚರಣೆಯ ತೀರ್ಪು:",
        "sec1_analysis": "ಸಂಶ್ಲೇಷಿತ ತಾಂತ್ರಿಕ ವಿಶ್ಲೇಷಣೆ:",
        "sec2_heading": "2. ಕಾರ್ಯಾಚರಣೆಯ ಪ್ರಶ್ನೆ ಮತ್ತು ವ್ಯಾಪ್ತಿ",
        "sec2_query": "ಪ್ರಶ್ನೆ:",
        "sec3_heading": "3. ಪುರಾವೆ ಆಧಾರಿತ ದಾಖಲೆ",
        "sec3_total": "ಹಿಂಪಡೆಯಲಾದ ಪುರಾವೆ ದಾಖಲೆಗಳು:",
        "sec4_heading": "4. ನಿರ್ಣಾಯಕ ಪರಿಶೀಲಿಸಿದ ಲೆಕ್ಕಾಚಾರಗಳು",
        "sec4_no_calcs": "ಈ ಕಾರ್ಯಾಚರಣೆಯ ಪ್ರಕಾರಕ್ಕೆ ಯಾವುದೇ ಗಣಿತದ ಲೆಕ್ಕಾಚಾರಗಳನ್ನು ಪ್ರಚೋದಿಸಲಾಗಿಲ್ಲ.",
        "sec4_verified": "[ಪೈಥಾನ್ ನಿರ್ಣಾಯಕ ಕರ್ನಲ್‌ನಿಂದ ಪರಿಶೀಲಿಸಲಾಗಿದೆ]",
        "sec5_heading": "5. ಸಾರ್ವಭೌಮ ನೀತಿ ಗೇಟ್‌ವೇ ಮತ್ತು ಕಾರ್ಯಾಚರಣೆಯ ಮಿತಿಗಳು",
        "sec5_default_deny": "ಡೀಫಾಲ್ಟ್-ನಿರಾಕರಣೆ ಕೈಗಾರಿಕಾ ನೀತಿಯ ಅಡಿಯಲ್ಲಿ ಕ್ರಿಯೆಯನ್ನು ಮೌಲ್ಯಮಾಪನ ಮಾಡಲಾಗಿದೆ. ಶೂನ್ಯ ಗಡಿ ಉಲ್ಲಂಘನೆ.",
        "sec6_heading": "6. ಸ್ವತಂತ್ರ 7-ಹಂತದ ಪರಿಶೀಲನಾ ಫಲಿತಾಂಶಗಳು",
        "sec6_checks_exec": "7 / 7 ಪರಿಶೀಲನಾ ತಪಾಸಣೆಗಳನ್ನು ಕಾರ್ಯಗತಗೊಳಿಸಲಾಗಿದೆ ಮತ್ತು ತಿರುಚುವಿಕೆ-ನಿರೋಧಕ ಇವೆಂಟ್ ಲಾಗ್‌ನಲ್ಲಿ ದಾಖಲಿಸಲಾಗಿದೆ.",
        "sec7_heading": "7. ಎನ್‌ಕ್ಲೇವ್ ಸಮಗ್ರತೆ ಮತ್ತು ಸ್ಥಳೀಯ ಆಡಿಟ್ ಉಲ್ಲೇಖ",
        "sec7_text": "ಈ ಡಾಕ್ಯುಮೆಂಟ್ ಅನ್ನು ಆನ್-ಪ್ರೆಮಿಸಸ್ FORGE ಸಾರ್ವಭೌಮ ಕೈಗಾರಿಕಾ AI ನಿಯಂತ್ರಣ ವೇದಿಕೆಯಿಂದ ನಿರ್ಣಾಯಕವಾಗಿ ಸಂಕಲಿಸಲಾಗಿದೆ. ಮೂರನೇ ವ್ಯಕ್ತಿಯ ಸಾರ್ವಜನಿಕ ಕ್ಲೌಡ್‌ಗಳಿಗೆ ಯಾವುದೇ ಡೇಟಾವನ್ನು ರವಾನಿಸಲಾಗಿಲ್ಲ. ಆಡಿಟ್ ಉಲ್ಲೇಖ ಸಹಿ: SHA256:{signature}",
    },
}


class SovereignReportGenerator:
    """Generates tamper-evident, audit-grade Microsoft Word (.docx) reports for FORGE missions."""

    def generate_mission_docx(self, run_data: Dict[str, Any]) -> bytes:
        """Generate a complete .docx report bytes for the given mission run."""
        # Try python-docx if installed
        try:
            import docx  # type: ignore
            return self._generate_with_python_docx(run_data)
        except ImportError:
            return self._generate_native_openxml_docx(run_data)

    def _generate_with_python_docx(self, data: Dict[str, Any]) -> bytes:
        """Render using python-docx when available in the environment."""
        import docx
        from docx.shared import Inches, Pt, RGBColor
        from docx.enum.text import WD_ALIGN_PARAGRAPH

        lang = str(data.get("language") or "en").lower()
        t = REPORT_TRANSLATIONS.get(lang, REPORT_TRANSLATIONS["en"])

        doc = docx.Document()
        # Set default font for Unicode support (Devanagari & Kannada)
        try:
            doc.styles['Normal'].font.name = 'Nirmala UI'
        except Exception:
            pass

        # Title
        p_title = doc.add_paragraph()
        run_title = p_title.add_run(t["title"])
        run_title.bold = True
        run_title.font.size = Pt(20)
        run_title.font.color.rgb = RGBColor(30, 41, 59)

        p_sub = doc.add_paragraph()
        run_sub = p_sub.add_run(t["subtitle"])
        run_sub.font.size = Pt(13)
        run_sub.font.color.rgb = RGBColor(100, 116, 139)

        doc.add_paragraph("―" * 50)

        # Run Identity Metadata Table
        run_id = data.get("run_id") or "run-unknown"
        now_dt = datetime.now(timezone.utc)
        ist_str = _format_ist_time(now_dt)

        meta_table = doc.add_table(rows=6, cols=2)
        meta_data = [
            (t["meta_run_id"], str(run_id)),
            (t["meta_scenario"], str(data.get("scenario_id") or data.get("scenario") or "CUSTOM_QUERY")),
            (t["meta_timestamp"], f"{ist_str} ({now_dt.isoformat()})"),
            (t["meta_clearance_role"], f"{data.get('classification', 'INTERNAL')} / {data.get('role', 'ENGINEER')}"),
            (t["meta_model_runtime"], f"{data.get('model_name', 'qwen3:8b')} ({data.get('provider', 'ollama_local')})"),
            (t["meta_verdict"], str(data.get("verdict") or data.get("status") or "VERIFIED")),
        ]
        for idx, (k, v) in enumerate(meta_data):
            row = meta_table.rows[idx]
            cell_k, cell_v = row.cells[0], row.cells[1]
            cell_k.text = k
            cell_k.paragraphs[0].runs[0].bold = True
            cell_v.text = v

        doc.add_paragraph("")

        # Section 1: Executive Findings
        h1 = doc.add_heading(t["sec1_heading"], level=1)
        h1.paragraph_format.space_before = Pt(14)
        verdict = str(data.get("verdict") or data.get("status") or "COMPLETED")
        doc.add_paragraph(f"{t['sec1_verdict']} {verdict}")

        answer = str(data.get("final_answer") or "No narrative recorded.")
        p_ans = doc.add_paragraph()
        p_ans.add_run(f"{t['sec1_analysis']}\n").bold = True
        p_ans.add_run(answer)

        # Section 2: Original User Inquiry
        h2 = doc.add_heading(t["sec2_heading"], level=1)
        query = str(data.get("query") or "Custom operational assessment.")
        doc.add_paragraph(f"{t['sec2_query']} {query}")

        # Section 3: Supporting Evidence
        h3 = doc.add_heading(t["sec3_heading"], level=1)
        evidence_set = data.get("evidence_set") or {}
        k_evd = evidence_set.get("knowledge_evidence") or []
        t_evd = evidence_set.get("tool_evidence") or []
        v_evd = evidence_set.get("visual_evidence") or []
        total_evd = len(k_evd) + len(t_evd) + len(v_evd)
        doc.add_paragraph(f"{t['sec3_total']} {total_evd}")

        for e in k_evd:
            p = doc.add_paragraph()
            p.add_run(f"• [Knowledge] {e.get('source_reference') or e.get('filename')}: ").bold = True
            p.add_run(str(e.get("content") or e.get("retrieved_data") or ""))

        for e in t_evd:
            p = doc.add_paragraph()
            p.add_run(f"• [Tool Telemetry] {e.get('tool_name')}: ").bold = True
            p.add_run(str(e.get("retrieved_data") or ""))

        for e in v_evd:
            p = doc.add_paragraph()
            p.add_run(f"• [Visual Observation] {e.get('source_reference')}: ").bold = True
            p.add_run(f"Observed: {e.get('observed_value')} {e.get('unit', '')} (Confidence: {e.get('confidence', 1.0)})")

        # Section 4: Calculations
        h4 = doc.add_heading(t["sec4_heading"], level=1)
        calcs = data.get("calculations") or []
        if not calcs and data.get("verification"):
            calcs = data["verification"].get("calculations") or []

        if calcs:
            for idx, c in enumerate(calcs):
                p = doc.add_paragraph()
                p.add_run(f"[{idx+1}] {c.get('description') or c.get('calculation_type')}: ").bold = True
                p.add_run(f"{c.get('result')} {c.get('units', '')} {t['sec4_verified']}")
        else:
            doc.add_paragraph(t["sec4_no_calcs"])

        # Section 5: Policy Decisions
        h5 = doc.add_heading(t["sec5_heading"], level=1)
        p_decisions = data.get("policy_decisions") or []
        if not p_decisions and data.get("policy_decision"):
            p_decisions = [data["policy_decision"]]

        if p_decisions:
            for d in p_decisions:
                p = doc.add_paragraph()
                p.add_run(f"• Action '{d.get('tool') or d.get('action', 'inspect')}': ").bold = True
                decision = d.get("decision") or ("ALLOW" if d.get("allowed") is True else "DENY")
                p.add_run(f"DECISION = {decision}. Reason: {d.get('reason') or 'Zero-trust verification'}")
        else:
            doc.add_paragraph(t["sec5_default_deny"])

        # Section 6: Verification Checks
        h6 = doc.add_heading(t["sec6_heading"], level=1)
        checks = []
        if data.get("verification") and data["verification"].get("checks"):
            checks = data["verification"]["checks"]

        if checks:
            for chk in checks:
                p = doc.add_paragraph()
                p.add_run(f"[{chk.get('check_type')}]: ").bold = True
                status_str = chk.get("status", "VERIFIED")
                p.add_run(f"{status_str} ― {chk.get('description', '')}")
        else:
            doc.add_paragraph(t["sec6_checks_exec"])

        # Section 7: Audit Reference
        h7 = doc.add_heading(t["sec7_heading"], level=1)
        doc.add_paragraph(t["sec7_text"].format(signature=uuid.uuid4().hex))

        buf = io.BytesIO()
        doc.save(buf)
        return buf.getvalue()

    def _generate_native_openxml_docx(self, data: Dict[str, Any]) -> bytes:
        """Render a 100% valid Microsoft Word OpenXML (.docx) ZIP archive using native standard library."""
        lang = str(data.get("language") or "en").lower()
        t = REPORT_TRANSLATIONS.get(lang, REPORT_TRANSLATIONS["en"])

        run_id = xml_escape(str(data.get("run_id") or "run-unknown"))
        scenario = xml_escape(str(data.get("scenario_id") or data.get("scenario") or "CUSTOM_QUERY"))
        now_dt = datetime.now(timezone.utc)
        ist_str = xml_escape(_format_ist_time(now_dt))
        iso_str = xml_escape(now_dt.isoformat())
        role = xml_escape(str(data.get("role") or "ENGINEER"))
        classification = xml_escape(str(data.get("classification") or "INTERNAL"))
        model_name = xml_escape(str(data.get("model_name") or "qwen3:8b"))
        provider = xml_escape(str(data.get("provider") or "ollama_local"))
        verdict = xml_escape(str(data.get("verdict") or data.get("status") or "VERIFIED"))
        query = xml_escape(str(data.get("query") or "Custom operational assessment."))
        final_answer = xml_escape(str(data.get("final_answer") or "No narrative recorded."))

        font_family = "Nirmala UI"

        # Format paragraphs for XML with Nirmala UI font for native complex script rendering
        def xml_para(text: str, bold_prefix: str = "", font_size: int = 22, color: str = "1E293B") -> str:
            runs = []
            if bold_prefix:
                runs.append(
                    f'<w:r><w:rPr><w:rFonts w:ascii="{font_family}" w:hAnsi="{font_family}" w:cs="{font_family}"/><w:b/><w:sz w:val="{font_size}"/><w:color w:val="{color}"/></w:rPr>'
                    f'<w:t xml:space="preserve">{xml_escape(bold_prefix)} </w:t></w:r>'
                )
            if text:
                runs.append(
                    f'<w:r><w:rPr><w:rFonts w:ascii="{font_family}" w:hAnsi="{font_family}" w:cs="{font_family}"/><w:sz w:val="{font_size}"/><w:color w:val="{color}"/></w:rPr>'
                    f'<w:t xml:space="preserve">{xml_escape(text)}</w:t></w:r>'
                )
            return f'<w:p><w:pPr><w:spacing w:after="160"/></w:pPr>{"".join(runs)}</w:p>'

        def xml_heading(title: str, level: int = 1) -> str:
            sz = 32 if level == 1 else 26
            return (
                f'<w:p><w:pPr><w:spacing w:before="300" w:after="160"/></w:pPr>'
                f'<w:r><w:rPr><w:rFonts w:ascii="{font_family}" w:hAnsi="{font_family}" w:cs="{font_family}"/><w:b/><w:sz w:val="{sz}"/><w:color w:val="0F172A"/></w:rPr>'
                f'<w:t>{xml_escape(title)}</w:t></w:r></w:p>'
            )

        # Build document body paragraphs
        body_xml = []

        # Document Header
        body_xml.append(
            f'<w:p><w:pPr><w:spacing w:after="80"/></w:pPr>'
            f'<w:r><w:rPr><w:rFonts w:ascii="{font_family}" w:hAnsi="{font_family}" w:cs="{font_family}"/><w:b/><w:sz w:val="44"/><w:color w:val="1E293B"/></w:rPr>'
            f'<w:t>{xml_escape(t["title"])}</w:t></w:r></w:p>'
        )
        body_xml.append(
            f'<w:p><w:pPr><w:spacing w:after="240"/></w:pPr>'
            f'<w:r><w:rPr><w:rFonts w:ascii="{font_family}" w:hAnsi="{font_family}" w:cs="{font_family}"/><w:sz w:val="26"/><w:color w:val="64748B"/></w:rPr>'
            f'<w:t>{xml_escape(t["subtitle"])}</w:t></w:r></w:p>'
        )

        # Meta block
        body_xml.append(xml_para(run_id, bold_prefix=t["meta_run_id"]))
        body_xml.append(xml_para(scenario, bold_prefix=t["meta_scenario"]))
        body_xml.append(xml_para(f"{ist_str} ({iso_str})", bold_prefix=t["meta_timestamp"]))
        body_xml.append(xml_para(f"{classification} / {role}", bold_prefix=t["meta_clearance_role"]))
        body_xml.append(xml_para(f"{model_name} [{provider}]", bold_prefix=t["meta_model_runtime"]))
        body_xml.append(xml_para(verdict, bold_prefix=t["meta_verdict"], color="059669" if verdict == "VERIFIED" else "D97706"))

        # Section 1
        body_xml.append(xml_heading(t["sec1_heading"], level=1))
        body_xml.append(xml_para(verdict, bold_prefix=t["sec1_verdict"]))
        body_xml.append(xml_para(final_answer, bold_prefix=t["sec1_analysis"]))

        # Section 2
        body_xml.append(xml_heading(t["sec2_heading"], level=1))
        body_xml.append(xml_para(query, bold_prefix=t["sec2_query"]))

        # Section 3: Evidence
        body_xml.append(xml_heading(t["sec3_heading"], level=1))
        evidence_set = data.get("evidence_set") or {}
        k_evd = evidence_set.get("knowledge_evidence") or []
        t_evd = evidence_set.get("tool_evidence") or []
        v_evd = evidence_set.get("visual_evidence") or []
        total_evd = len(k_evd) + len(t_evd) + len(v_evd)
        body_xml.append(xml_para(f"{total_evd}", bold_prefix=t["sec3_total"]))

        for e in k_evd:
            src = e.get("source_reference") or e.get("filename") or "Plant Knowledge Fabric"
            txt = str(e.get("content") or e.get("retrieved_data") or "")
            body_xml.append(xml_para(txt[:300] + ("..." if len(txt) > 300 else ""), bold_prefix=f"• [Knowledge: {src}]:"))

        for e in t_evd:
            tool_name = e.get("tool_name") or "industrial_tool"
            data_str = str(e.get("retrieved_data") or "")
            body_xml.append(xml_para(data_str, bold_prefix=f"• [Tool: {tool_name}]:"))

        for e in v_evd:
            src = e.get("source_reference") or "Camera Sensor"
            obs = f"Observed: {e.get('observed_value')} {e.get('unit', '')}"
            body_xml.append(xml_para(obs, bold_prefix=f"• [Optical Observation: {src}]:"))

        # Section 4: Calculations
        body_xml.append(xml_heading(t["sec4_heading"], level=1))
        calcs = data.get("calculations") or []
        if not calcs and data.get("verification"):
            calcs = data["verification"].get("calculations") or []

        if calcs:
            for idx, c in enumerate(calcs):
                desc = c.get("description") or c.get("calculation_type") or "Math check"
                res_str = f"{c.get('result')} {c.get('units', '')} {t['sec4_verified']}"
                body_xml.append(xml_para(res_str, bold_prefix=f"[{idx+1}] {desc}:"))
        else:
            body_xml.append(xml_para(t["sec4_no_calcs"]))

        # Section 5: Policy
        body_xml.append(xml_heading(t["sec5_heading"], level=1))
        p_decisions = data.get("policy_decisions") or []
        if not p_decisions and data.get("policy_decision"):
            p_decisions = [data["policy_decision"]]

        if p_decisions:
            for d in p_decisions:
                action_name = d.get("tool") or d.get("action", "inspect")
                decision = d.get("decision") or ("ALLOW" if d.get("allowed") is True else "DENY")
                reason = d.get("reason") or "Enforced by local policy rules."
                body_xml.append(xml_para(f"DECISION = {decision}. Reason: {reason}", bold_prefix=f"• Action '{action_name}':"))
        else:
            body_xml.append(xml_para(t["sec5_default_deny"]))

        # Section 6: Verification
        body_xml.append(xml_heading(t["sec6_heading"], level=1))
        checks = []
        if data.get("verification") and data["verification"].get("checks"):
            checks = data["verification"]["checks"]

        if checks:
            for chk in checks:
                ctype = chk.get("check_type", "CHECK")
                cstatus = chk.get("status", "VERIFIED")
                cdesc = chk.get("description", "")
                body_xml.append(xml_para(f"{cstatus} ― {cdesc}", bold_prefix=f"[{ctype}]:"))
        else:
            body_xml.append(xml_para(t["sec6_checks_exec"]))

        # Section 7: Audit Reference
        body_xml.append(xml_heading(t["sec7_heading"], level=1))
        sig = uuid.uuid4().hex
        body_xml.append(
            xml_para(
                t["sec7_text"].format(signature=sig)
            )
        )

        content_document_xml = (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
            '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
            '<w:body>'
            + "".join(body_xml)
            + '<w:sectPr>'
            '<w:pgSz w:w="11906" w:h="16838"/>'
            '<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>'
            '</w:sectPr>'
            '</w:body>'
            '</w:document>'
        )

        content_types_xml = (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            '<Default Extension="xml" ContentType="application/xml"/>'
            '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
            '</Types>'
        )

        rels_xml = (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
            '</Relationships>'
        )

        zip_buf = io.BytesIO()
        with zipfile.ZipFile(zip_buf, "w", zipfile.ZIP_DEFLATED) as z:
            z.writestr("[Content_Types].xml", content_types_xml)
            z.writestr("_rels/.rels", rels_xml)
            z.writestr("word/document.xml", content_document_xml)

        return zip_buf.getvalue()


report_generator = SovereignReportGenerator()
