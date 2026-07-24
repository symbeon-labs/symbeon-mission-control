import os
import sys
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY

def generate_pdf():
    pdf_filename = "Symbeon_Mission_Control_Executive_OnePager.pdf"
    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=letter,
        rightMargin=0.5 * inch,
        leftMargin=0.5 * inch,
        topMargin=0.5 * inch,
        bottomMargin=0.5 * inch
    )

    styles = getSampleStyleSheet()

    # Color Palette
    PRIMARY_CYAN = colors.HexColor("#00D2FF")
    DEEP_BG = colors.HexColor("#0B0F17")
    SLATE_CARD = colors.HexColor("#161F30")
    TEXT_WHITE = colors.HexColor("#FFFFFF")
    TEXT_MUTED = colors.HexColor("#94A3B8")
    ACCENT_GOLD = colors.HexColor("#F59E0B")
    SUCCESS_GREEN = colors.HexColor("#10B981")

    # Custom Styles
    style_title = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=PRIMARY_CYAN,
        alignment=TA_LEFT
    )

    style_subtitle = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=TEXT_WHITE,
        alignment=TA_LEFT
    )

    style_tagline = ParagraphStyle(
        'DocTagline',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=10,
        leading=14,
        textColor=TEXT_MUTED,
        alignment=TA_LEFT
    )

    style_h2 = ParagraphStyle(
        'Heading2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=PRIMARY_CYAN,
        spaceBefore=10,
        spaceAfter=4
    )

    style_body = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=TEXT_WHITE,
        alignment=TA_LEFT
    )

    style_bullet = ParagraphStyle(
        'Bullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=TEXT_WHITE,
        leftIndent=10
    )

    style_table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=PRIMARY_CYAN
    )

    style_table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=TEXT_WHITE
    )

    story = []

    # Title & Header Block
    story.append(Paragraph("SYMBEON MISSION CONTROL", style_title))
    story.append(Paragraph("The Computable Governance Operating System & Agentic ALM Framework", style_subtitle))
    story.append(Paragraph("<i>Transforming operational actions into traceable, graph-driven institutional memory governed by machine-executable policies.</i>", style_tagline))
    story.append(Spacer(1, 8))

    # Divider Line
    story.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY_CYAN, spaceBefore=2, spaceAfter=8))

    # Hero Image
    hero_image_path = os.path.join("docs", "images", "mission_control_hero.png")
    if os.path.exists(hero_image_path):
        img = Image(hero_image_path, width=7.2 * inch, height=2.2 * inch)
        story.append(img)
        story.append(Spacer(1, 10))

    # Executive Summary
    story.append(Paragraph("🚀 Executive Summary", style_h2))
    summary_text = (
        "<b>Symbeon Mission Control</b> is a next-generation <b>Computable Governance Operating System (OS)</b> "
        "and <b>Agentic Application Lifecycle Management (ALM) Framework</b>. Unlike traditional project tools "
        "that treat software development as flat expiring ticket lists, Mission Control models the enterprise as an "
        "explicit <b>Directed Multigraph</b> of Operational Objects (Decisions, Tasks, Evidence, Knowledge, Releases, Policies). "
        "It replaces passive PDF governance with <b>machine-executable policies</b> evaluated in real time, enforcing strict evidence traceability "
        "<i>('Evidence Precedes Truth')</i>, calculating organizational maturity deterministically (Levels 1–5), and providing a native "
        "<b>Model Context Protocol (MCP)</b> hub for AI Agent fleets."
    )
    story.append(Paragraph(summary_text, style_body))
    story.append(Spacer(1, 8))

    # Problem vs Solution Table
    story.append(Paragraph("⚡ Problem vs. Solution Architecture", style_h2))
    prob_sol_data = [
        [
            Paragraph("<b>Traditional ALM / Project Management</b>", style_table_header),
            Paragraph("<b>Symbeon Mission Control OS</b>", style_table_header)
        ],
        [
            Paragraph("• <b>Information Decay:</b> Tasks expire; decision lineage and context are lost after 6 months.", style_table_cell),
            Paragraph("• <b>Immutable Graph Memory:</b> Every object retains full historical lineage and topological connections.", style_table_cell)
        ],
        [
            Paragraph("• <b>Passive PDF Governance:</b> Unread policy PDFs audited retroactively after security failures.", style_table_cell),
            Paragraph("• <b>Executable Policies:</b> LiveGovernance engine evaluates 14 policy categories continuously in real time.", style_table_cell)
        ],
        [
            Paragraph("• <b>Unchecked AI Execution:</b> AI Agents execute code changes without auditable proof.", style_table_cell),
            Paragraph("• <b>AI Reasoning Chains:</b> Agents MUST log cryptographic <code>ReasoningChain</code> before action.", style_table_cell)
        ]
    ]

    t_prob = Table(prob_sol_data, colWidths=[3.6 * inch, 3.6 * inch])
    t_prob.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), SLATE_CARD),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TEXTCOLOR', (0, 0), (-1, -1), TEXT_WHITE),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#1E293B")),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(t_prob)
    story.append(Spacer(1, 10))

    # Architecture & Specification Suite
    story.append(Paragraph("🏛️ Specification Suite (MCS Normative Family)", style_h2))
    spec_data = [
        [Paragraph("Family", style_table_header), Paragraph("Specifications", style_table_header), Paragraph("Normative Focus & Purpose", style_table_header)],
        [
            Paragraph("<b>📜 Constitution (Stable)</b>", style_table_cell),
            Paragraph("<code>MCS-0000</code> – <code>MCS-0004</code>", style_table_cell),
            Paragraph("Manifesto, 10 Architectural Laws (Ch. 0), Computational Ontology, State Machine, and Semantic MCP Protocol. Bound by IETF RFC 2119.", style_table_cell)
        ],
        [
            Paragraph("<b>⚙️ Domain Specs (Evolving)</b>", style_table_cell),
            Paragraph("<code>MCS-0005</code> – <code>MCS-0010</code>", style_table_cell),
            Paragraph("Evidence Protocol (<i>EvidenceScore</i>), Epistemic Knowledge Cycle, Operational Graph Traversal, Governance Math, Agent Boundaries, Extension SDK.", style_table_cell)
        ],
        [
            Paragraph("<b>🔬 Science & Process</b>", style_table_cell),
            Paragraph("<code>MCS-1000</code> & <code>RFC-0000</code>", style_table_cell),
            Paragraph("Computational Organization Theory (Scientific Paper) & Symbeon RFC Governance Process.", style_table_cell)
        ]
    ]

    t_spec = Table(spec_data, colWidths=[1.8 * inch, 1.8 * inch, 3.6 * inch])
    t_spec.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), SLATE_CARD),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#1E293B")),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t_spec)
    story.append(Spacer(1, 10))

    # Core Metrics Block
    story.append(Paragraph("🎯 Key Performance & Maturity Metrics", style_h2))
    metrics_data = [
        [
            Paragraph("<b>Governance Score</b><br/><font color='#10B981' size=14><b>95 / 100 (Grade A+)</b></font>", style_table_cell),
            Paragraph("<b>Maturity Assessment</b><br/><font color='#00D2FF' size=14><b>Level 5 (Optimized)</b></font>", style_table_cell),
            Paragraph("<b>Evidence Coverage</b><br/><font color='#F59E0B' size=14><b>100% Verifiable</b></font>", style_table_cell),
            Paragraph("<b>AI Agent Safety</b><br/><font color='#10B981' size=14><b>LAW-0008 Enforced</b></font>", style_table_cell)
        ]
    ]
    t_metrics = Table(metrics_data, colWidths=[1.8 * inch, 1.8 * inch, 1.8 * inch, 1.8 * inch])
    t_metrics.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#0F172A")),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 1, PRIMARY_CYAN),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(t_metrics)
    story.append(Spacer(1, 10))

    # Footer Metadata
    story.append(HRFlowable(width="100%", thickness=0.5, color=TEXT_MUTED, spaceBefore=4, spaceAfter=6))
    footer_text = (
        "<b>Symbeon Mission Control v1.0.0</b> | <i>Symbeon Labs Architecture Team</i> | "
        "Repository: <font color='#00D2FF'>https://github.com/symbeon-labs/symbeon-mission-control</font>"
    )
    story.append(Paragraph(footer_text, ParagraphStyle('Footer', parent=style_body, fontSize=8, textColor=TEXT_MUTED, alignment=TA_CENTER)))

    doc.build(story)
    print(f"Successfully generated {pdf_filename}")

if __name__ == '__main__':
    generate_pdf()
