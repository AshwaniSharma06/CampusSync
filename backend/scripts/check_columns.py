import sqlite3

conn = sqlite3.connect("campussync.db")
c = conn.cursor()

print("NOTICES COLUMNS:")
for col in c.execute("PRAGMA table_info(notices)").fetchall():
    print(col)

print("\nACADEMIC RESOURCES COLUMNS:")
for col in c.execute("PRAGMA table_info(academic_resources)").fetchall():
    print(col)

print("\nACADEMIC DOCUMENTS COLUMNS:")
for col in c.execute("PRAGMA table_info(academic_documents)").fetchall():
    print(col)

