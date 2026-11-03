"""
Authenticity Safeguard PDF Generation Script.
Generates structured PDF documents for CampusSync hosted documents with explicit
demo/specimen indicators and zero fabricated faculty names or unverified signatures.
"""
import os
import sys
from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY

HOSTED_DIR = Path("backend/data/hosted_documents")
HOSTED_DIR.mkdir(parents=True, exist_ok=True)

def build_pdf(filename, title_text, elements):
    filepath = HOSTED_DIR / filename
    doc = SimpleDocTemplate(
        str(filepath),
        pagesize=letter,
        rightMargin=54,
        leftMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    doc.build(elements)
    print(f"Generated safeguarded PDF: {filepath.name} ({filepath.stat().st_size} bytes)")
    return filepath

def get_base_styles():
    styles = getSampleStyleSheet()
    
    safeguard_banner = ParagraphStyle(
        'SafeguardBanner',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#92400E')
    )
    header_style = ParagraphStyle(
        'HeaderInstitution',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#0F172A')
    )
    sub_header_style = ParagraphStyle(
        'HeaderDepartment',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#334155')
    )
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#0F766E')
    )
    meta_style = ParagraphStyle(
        'DocMeta',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9,
        leading=13,
        alignment=TA_LEFT,
        textColor=colors.HexColor('#64748B')
    )
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        alignment=TA_JUSTIFY,
        textColor=colors.HexColor('#1E293B')
    )
    heading2_style = ParagraphStyle(
        'DocH2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#0F766E')
    )
    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#1E293B')
    )
    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#0F172A')
    )
    return {
        'banner': safeguard_banner,
        'inst': header_style,
        'dept': sub_header_style,
        'title': title_style,
        'meta': meta_style,
        'body': body_style,
        'h2': heading2_style,
        'cell': table_cell,
        'cell_b': table_cell_bold
    }

def add_safeguard_banner(elements, s, doc_type="DEMO SEED SPECIMEN"):
    banner_data = [[
        Paragraph(f"<b>[SYSTEM NOTICE: {doc_type} • PENDING OFFICIAL GAZETTE PUBLICATION]</b><br/>"
                  "<i>This document serves as an interface format specimen. Official verified notices and circulars "
                  "must be cross-referenced with the college portal (ecajmer.ac.in) or university portal (btu.ac.in).</i>",
                  s['banner'])
    ]]
    t = Table(banner_data, colWidths=[504])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#FEF3C7')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#F59E0B')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 8))

def generate_notice_1():
    s = get_base_styles()
    el = []
    add_safeguard_banner(el, s, "DEMO SEED NOTICE")
    
    el.append(Paragraph("ENGINEERING COLLEGE AJMER", s['inst']))
    el.append(Paragraph("(An Autonomous Institution of Government of Rajasthan)<br/>NH-8, Barliya Chauraha, Ajmer, Rajasthan - 305025", s['dept']))
    el.append(Spacer(1, 6))
    el.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0F766E'), spaceAfter=8))
    
    el.append(Paragraph("DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING", s['h2']))
    el.append(Spacer(1, 4))
    
    meta_table = Table([
        [Paragraph("<b>Status:</b> DEMO_SEED (Pending Gazette)", s['meta']), Paragraph("<b>Academic Session:</b> 2026-27", s['meta'])]
    ], colWidths=[300, 204])
    meta_table.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP')]))
    el.append(meta_table)
    el.append(Spacer(1, 8))
    
    el.append(Paragraph("<b><u>CIRCULAR FORMAT SPECIMEN: MID-TERM I SCHEDULE (SEMESTER VII)</u></b>", s['title']))
    el.append(Spacer(1, 6))
    
    el.append(Paragraph(
        "Specimen schedule for <b>B.Tech VII Semester (Computer Science & Engineering)</b>. "
        "Students should reference this template for timetable structure pending final departmental notification.",
        s['body']
    ))
    el.append(Spacer(1, 10))
    
    headers = [
        Paragraph("<b>Date & Day</b>", s['cell_b']),
        Paragraph("<b>Time Slot</b>", s['cell_b']),
        Paragraph("<b>Course Code</b>", s['cell_b']),
        Paragraph("<b>Subject Title</b>", s['cell_b']),
        Paragraph("<b>Exam Hall</b>", s['cell_b'])
    ]
    data = [
        headers,
        [Paragraph("12-11-2026 (Thursday)", s['cell']), Paragraph("10:00 AM - 11:30 AM", s['cell']), Paragraph("CS-701", s['cell']), Paragraph("Cloud Computing", s['cell']), Paragraph("Exam Hall A-102", s['cell'])],
        [Paragraph("13-11-2026 (Friday)", s['cell']), Paragraph("10:00 AM - 11:30 AM", s['cell']), Paragraph("CS-702", s['cell']), Paragraph("Information Security Systems", s['cell']), Paragraph("Exam Hall A-104", s['cell'])],
        [Paragraph("14-11-2026 (Saturday)", s['cell']), Paragraph("10:00 AM - 11:30 AM", s['cell']), Paragraph("CS-703", s['cell']), Paragraph("Artificial Intelligence & ML", s['cell']), Paragraph("Exam Hall B-201", s['cell'])],
        [Paragraph("16-11-2026 (Monday)", s['cell']), Paragraph("10:00 AM - 11:30 AM", s['cell']), Paragraph("CS-704", s['cell']), Paragraph("Internet of Things", s['cell']), Paragraph("Exam Hall B-203", s['cell'])]
    ]
    t = Table(data, colWidths=[90, 110, 65, 140, 99])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F1F5F9')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    el.append(t)
    el.append(Spacer(1, 12))
    
    el.append(Paragraph("<b>Standard Examination Instructions (BTU Guidelines):</b>", s['h2']))
    el.append(Paragraph("1. Possession of unauthorized electronic devices inside the examination venue is strictly prohibited under University Examination Regulations.", s['body']))
    el.append(Paragraph("2. Valid Institute Identity Cards are required for entry.", s['body']))
    el.append(Spacer(1, 20))
    
    sig_table = Table([
        [
            Paragraph("<b>Issuing Authority:</b><br/>Examination Section, Dept. of CSE (Specimen)", s['meta']),
            Paragraph("<b>Institution:</b><br/>Engineering College Ajmer (Autonomous)", s['meta'])
        ]
    ], colWidths=[250, 254])
    sig_table.setStyle(TableStyle([('ALIGN', (1,0), (1,0), 'RIGHT')]))
    el.append(sig_table)
    
    build_pdf("Notice_1_MidTerm_Schedule_CSE_Sem7.pdf", "Notice 1", el)

def generate_resource_1():
    s = get_base_styles()
    el = []
    add_safeguard_banner(el, s, "CURRICULUM SPECIMEN TEMPLATE")
    
    el.append(Paragraph("BIKANER TECHNICAL UNIVERSITY, BIKANER", s['inst']))
    el.append(Paragraph("Karni Industrial Area, Pugal Road, Bikaner, Rajasthan - 334004", s['dept']))
    el.append(Spacer(1, 6))
    el.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0F766E'), spaceAfter=8))
    
    el.append(Paragraph("<b>SCHEME AND SYLLABUS SPECIMEN FOR B.TECH IV YEAR</b>", s['title']))
    el.append(Paragraph("<b>Computer Science & Engineering — Semester VII (Session 2026-27)</b>", s['dept']))
    el.append(Spacer(1, 10))
    
    el.append(Paragraph("<b>1. Course Structure & Credit Matrix:</b>", s['h2']))
    scheme_headers = [
        Paragraph("<b>Code</b>", s['cell_b']),
        Paragraph("<b>Course Title</b>", s['cell_b']),
        Paragraph("<b>L-T-P</b>", s['cell_b']),
        Paragraph("<b>Credits</b>", s['cell_b']),
        Paragraph("<b>Internal</b>", s['cell_b']),
        Paragraph("<b>End-Term</b>", s['cell_b']),
        Paragraph("<b>Total</b>", s['cell_b'])
    ]
    scheme_rows = [
        scheme_headers,
        [Paragraph("CS-701", s['cell']), Paragraph("Cloud Computing", s['cell']), Paragraph("3-0-0", s['cell']), Paragraph("3", s['cell']), Paragraph("30", s['cell']), Paragraph("70", s['cell']), Paragraph("100", s['cell'])],
        [Paragraph("CS-702", s['cell']), Paragraph("Information Security Systems", s['cell']), Paragraph("3-0-0", s['cell']), Paragraph("3", s['cell']), Paragraph("30", s['cell']), Paragraph("70", s['cell']), Paragraph("100", s['cell'])],
        [Paragraph("CS-703", s['cell']), Paragraph("Artificial Intelligence & ML", s['cell']), Paragraph("3-0-0", s['cell']), Paragraph("3", s['cell']), Paragraph("30", s['cell']), Paragraph("70", s['cell']), Paragraph("100", s['cell'])],
        [Paragraph("CS-704", s['cell']), Paragraph("Internet of Things", s['cell']), Paragraph("3-0-0", s['cell']), Paragraph("3", s['cell']), Paragraph("30", s['cell']), Paragraph("70", s['cell']), Paragraph("100", s['cell'])],
        [Paragraph("CS-705", s['cell']), Paragraph("Cloud & Security Lab", s['cell']), Paragraph("0-0-2", s['cell']), Paragraph("1", s['cell']), Paragraph("60", s['cell']), Paragraph("40", s['cell']), Paragraph("100", s['cell'])],
        [Paragraph("CS-706", s['cell']), Paragraph("Major Project Phase-I", s['cell']), Paragraph("0-0-4", s['cell']), Paragraph("2", s['cell']), Paragraph("60", s['cell']), Paragraph("40", s['cell']), Paragraph("100", s['cell'])],
    ]
    st = Table(scheme_rows, colWidths=[55, 170, 50, 45, 55, 60, 69])
    st.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F8FAFC')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    el.append(st)
    el.append(Spacer(1, 10))
    
    el.append(Paragraph("<b>2. Unit Topics Summary — CS-701: Cloud Computing (3-0-0)</b>", s['h2']))
    el.append(Paragraph("<b>Unit I:</b> Cloud Architecture, Roots, Service Models (IaaS, PaaS, SaaS), Deployment Models.", s['body']))
    el.append(Paragraph("<b>Unit II:</b> Virtualization (Hypervisors, CPU/Memory/Storage), Containerization concepts.", s['body']))
    el.append(Paragraph("<b>Unit III:</b> Cloud Resource Provisioning, SLA Management, Distributed Storage architectures.", s['body']))
    el.append(Paragraph("<b>Unit IV:</b> Cloud Security, Identity and Access Management, Encryption, Compliance.", s['body']))
    el.append(Spacer(1, 14))
    
    el.append(Paragraph("<i>Note: Official gazetted syllabus scheme is maintained on the BTU Academic portal: btu.ac.in/home/Syllabus-Scheme</i>", s['meta']))
    build_pdf("Resource_1_BTU_CSE_Sem7_Syllabus.pdf", "Resource 1", el)

def generate_resource_2():
    s = get_base_styles()
    el = []
    add_safeguard_banner(el, s, "ACADEMIC CALENDAR TEMPLATE")
    
    el.append(Paragraph("BIKANER TECHNICAL UNIVERSITY, BIKANER", s['inst']))
    el.append(Paragraph("Office of Academic Affairs • Specimen Calendar Form", s['dept']))
    el.append(Spacer(1, 6))
    el.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0F766E'), spaceAfter=8))
    
    el.append(Paragraph("<b>ANNUAL ACADEMIC CALENDAR SPECIMEN (SESSION 2026-27)</b>", s['title']))
    el.append(Paragraph("<b>For Engineering Degree Programs (Illustrative Schedule)</b>", s['dept']))
    el.append(Spacer(1, 10))
    
    headers = [
        Paragraph("<b>Activity / Milestone</b>", s['cell_b']),
        Paragraph("<b>Odd Semester Window</b>", s['cell_b']),
        Paragraph("<b>Even Semester Window</b>", s['cell_b'])
    ]
    data = [
        headers,
        [Paragraph("Commencement of Classes", s['cell']), Paragraph("August", s['cell']), Paragraph("January", s['cell'])],
        [Paragraph("First Mid-Term Tests", s['cell']), Paragraph("November (Specimen)", s['cell']), Paragraph("March", s['cell'])],
        [Paragraph("Techno-Cultural Activities", s['cell']), Paragraph("November", s['cell']), Paragraph("February", s['cell'])],
        [Paragraph("Second Mid-Term Tests", s['cell']), Paragraph("December", s['cell']), Paragraph("April", s['cell'])],
        [Paragraph("Term End / Practical Exams", s['cell']), Paragraph("Late December", s['cell']), Paragraph("Early May", s['cell'])],
        [Paragraph("University Theory Examinations", s['cell']), Paragraph("January", s['cell']), Paragraph("May / June", s['cell'])],
    ]
    t = Table(data, colWidths=[204, 150, 150])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F1F5F9')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    el.append(t)
    el.append(Spacer(1, 14))
    
    el.append(Paragraph("<i>Official academic notifications are published at btu.ac.in/home/Academic-Calendar</i>", s['meta']))
    build_pdf("Resource_2_BTU_Academic_Calendar_2026-27.pdf", "Resource 2", el)

def generate_resource_3():
    s = get_base_styles()
    el = []
    add_safeguard_banner(el, s, "CAMPUS DIRECTORY GUIDE")
    
    el.append(Paragraph("ENGINEERING COLLEGE AJMER", s['inst']))
    el.append(Paragraph("NH-8, Barliya Chauraha, Ajmer, Rajasthan - 305025", s['dept']))
    el.append(Spacer(1, 6))
    el.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0F766E'), spaceAfter=8))
    
    el.append(Paragraph("<b>BARLIYA CAMPUS LAYOUT & FACILITY GUIDE SPECIMEN</b>", s['title']))
    el.append(Paragraph("<b>Department Blocks and Public Student Facilities</b>", s['dept']))
    el.append(Spacer(1, 10))
    
    headers = [
        Paragraph("<b>Zone / Block</b>", s['cell_b']),
        Paragraph("<b>Key Facilities</b>", s['cell_b']),
        Paragraph("<b>Location / Floor</b>", s['cell_b']),
        Paragraph("<b>Official Contact Portal</b>", s['cell_b'])
    ]
    data = [
        headers,
        [Paragraph("Block A (Admin)", s['cell']), Paragraph("Principal Office, Accounts, Exam Cell", s['cell']), Paragraph("Ground & 1st Floor", s['cell']), Paragraph("ecajmer.ac.in/facilities", s['cell'])],
        [Paragraph("Block B (Computing)", s['cell']), Paragraph("Computer Science, IT, AI & Cloud Labs", s['cell']), Paragraph("Ground to 3rd Floor", s['cell']), Paragraph("ecajmer.ac.in/departments/cse", s['cell'])],
        [Paragraph("Central Library", s['cell']), Paragraph("Reading Halls, Digital Library, Book Bank", s['cell']), Paragraph("Opposite Block A", s['cell']), Paragraph("ecajmer.ac.in/facilities/library", s['cell'])],
        [Paragraph("Activity Center (SAC)", s['cell']), Paragraph("Student Clubs, Open Air Theatre", s['cell']), Paragraph("East Campus Complex", s['cell']), Paragraph("ecajmer.ac.in/facilities/sac", s['cell'])],
    ]
    t = Table(data, colWidths=[100, 174, 110, 120])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F1F5F9')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    el.append(t)
    el.append(Spacer(1, 14))
    
    el.append(Paragraph("<i>Campus facilities details can be verified directly on ecajmer.ac.in/facilities/campus</i>", s['meta']))
    build_pdf("Resource_3_ECA_Barliya_Campus_Map.pdf", "Resource 3", el)

if __name__ == "__main__":
    generate_notice_1()
    generate_resource_1()
    generate_resource_2()
    generate_resource_3()
