import pypdf

reader = pypdf.PdfReader('backend/data/hosted_documents/BTU_CSE_Sem3_to_8_Syllabus.pdf')

pages_to_check = [2, 3, 30, 31, 70, 71]
for p in pages_to_check:
    print(f"=== PAGE {p} ===")
    print(reader.pages[p-1].extract_text()[:400])
    print()

