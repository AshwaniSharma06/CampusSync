import sqlite3
import json
from collections import defaultdict
import re

def generate_catalog():
    conn = sqlite3.connect('campussync.db')
    c = conn.cursor()
    c.execute("""
        SELECT id, title, notice_type, published_date, scope, department_code, target_semester, 
               download_url, document_url, official_page_url, source_url, verification_status, is_active
        FROM notices
        WHERE is_active = 1 AND verification_status = 'VERIFIED'
        ORDER BY published_date DESC, id DESC
    """)
    rows = c.fetchall()
    print(f"Total active verified notices: {len(rows)}")

    def get_working_link(r):
        doc_url = r[8]
        dl_url = r[7]
        page_url = r[9]
        src_url = r[10]

        # Priority 1: Direct official PDF
        if doc_url and doc_url.strip() and not doc_url.startswith("#") and "/./content/" not in doc_url:
            clean = doc_url.strip()
            if not clean.startswith("http"):
                clean = "https://www.ecajmer.ac.in/" + clean.lstrip("/")
            return clean, "Direct PDF Document"

        # Priority 2: Download URL
        if dl_url and dl_url.strip() and not dl_url.startswith("#"):
            return dl_url.strip(), "Hosted Document"

        # Priority 3: Official notice webpage
        if page_url and page_url.strip() and not page_url.startswith("#") and "/./content/" not in page_url:
            clean = page_url.strip()
            if not clean.startswith("http"):
                clean = "https://www.ecajmer.ac.in/" + clean.lstrip("/")
            return clean, "Official Notice Webpage"

        # Priority 4: College circulars fallback (ECA Latest Circulars Portal)
        return "https://www.ecajmer.ac.in/latestfromeca", "Official Circulars Directory"

    classified = {
        "global": [],
        "cse": [],
        "it": [],
        "ece": [],
        "ee": [],
        "ce": [],
        "me": [],
        "mba_mca": [],
        "semester_specific": defaultdict(list),
        "archive_public": []
    }

    for r in rows:
        nid, title, ntype, pdate, scope, dept, sem, dl, doc, page, src, vstat, act = r
        link, link_type = get_working_link(r)
        
        item = {
            "id": nid,
            "title": title.strip() if title else "Untitled Notice",
            "date": pdate[:10] if pdate else "N/A",
            "type": ntype or "Official Circular",
            "scope": scope,
            "dept": dept or "All",
            "sem": sem if sem is not None else "All",
            "link": link,
            "link_type": link_type
        }

        if sem is not None:
            classified["semester_specific"][sem].append(item)

        if dept == "CSE":
            classified["cse"].append(item)
        elif dept == "IT":
            classified["it"].append(item)
        elif dept == "ECE":
            classified["ece"].append(item)
        elif dept == "EE":
            classified["ee"].append(item)
        elif dept == "CE":
            classified["ce"].append(item)
        elif dept == "ME":
            classified["me"].append(item)
        elif dept in ("MBA", "MCA"):
            classified["mba_mca"].append(item)
        elif scope == "GLOBAL":
            classified["global"].append(item)
        else:
            classified["archive_public"].append(item)

    print(f"Global / College-wide: {len(classified['global'])}")
    print(f"CSE: {len(classified['cse'])}")
    print(f"IT: {len(classified['it'])}")
    print(f"ECE: {len(classified['ece'])}")
    print(f"EE: {len(classified['ee'])}")
    print(f"CE: {len(classified['ce'])}")
    print(f"ME: {len(classified['me'])}")
    print(f"MBA/MCA: {len(classified['mba_mca'])}")
    for sem in sorted(classified["semester_specific"].keys()):
        print(f"Semester {sem}: {len(classified['semester_specific'][sem])}")
    print(f"General Public Archive: {len(classified['archive_public'])}")

    with open("scripts/classified_catalog.json", "w", encoding="utf-8") as f:
        json.dump(classified, f, indent=2)
    print("Catalog written to scripts/classified_catalog.json")

if __name__ == '__main__':
    generate_catalog()

