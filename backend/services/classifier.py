"""
Evidence-Based Academic Document Classification Engine.
Extracts cohort attributes (department, semester, academic year, course code)
strictly using verified textual evidence.
Never guesses missing values; flags ambiguous or conflicting documents as UNCLASSIFIED.
"""

import re
from typing import Dict, Any, Optional, List, Set
from backend.models.academic import ClassificationScope

ROMAN_NUMERALS = {
    "i": 1, "1st": 1, "first": 1,
    "ii": 2, "2nd": 2, "second": 2,
    "iii": 3, "3rd": 3, "third": 3,
    "iv": 4, "4th": 4, "fourth": 4,
    "v": 5, "5th": 5, "fifth": 5,
    "vi": 6, "6th": 6, "sixth": 6,
    "vii": 7, "7th": 7, "seventh": 7,
    "viii": 8, "8th": 8, "eighth": 8,
}

DEPARTMENT_MAP = {
    "CSE": ["computer science", "computer engineering", "cse", "dept. of cse"],
    "IT": ["information technology", "dept. of it", r"\bit\b"],
    "ECE": ["electronics & communication", "electronics and communication", "ece"],
    "EE": ["electrical engineering", r"\bee\b"],
    "ME": ["mechanical engineering", r"\bme\b"],
    "CE": ["civil engineering", r"\bce\b"],
    "MCA": ["master of computer applications", r"\bmca\b"],
    "MBA": ["master of business administration", r"\bmba\b"]
}

class DocumentClassifier:
    """
    Classifies academic documents based strictly on textual evidence.
    """

    @classmethod
    def classify_document(cls, title: str, content: str = "") -> Dict[str, Any]:
        """
        Analyzes title and content to extract cohort targets and determine scope.
        """
        full_text = f"{title}\n{content}".strip()
        lower_text = full_text.lower()

        detected_semesters = cls._extract_semesters(lower_text)
        detected_departments = cls._extract_departments(lower_text)
        detected_academic_year = cls._extract_academic_year(full_text)
        detected_course_codes = cls._extract_course_codes(full_text)
        detected_doc_type = cls._extract_doc_type(lower_text)

        target_semester: Optional[int] = None
        department_code: Optional[str] = None
        scope: ClassificationScope = ClassificationScope.UNCLASSIFIED
        is_conflicting: bool = False
        reasons: List[str] = []

        # 1. Analyze Semester Evidence
        if len(detected_semesters) == 1:
            target_semester = list(detected_semesters)[0]
        elif len(detected_semesters) > 1:
            is_conflicting = True
            reasons.append(f"Conflicting/multiple semesters detected: {sorted(list(detected_semesters))}")

        # 2. Analyze Department Evidence
        if len(detected_departments) == 1:
            department_code = list(detected_departments)[0]
        elif len(detected_departments) > 1:
            is_conflicting = True
            reasons.append(f"Conflicting/multiple departments detected: {sorted(list(detected_departments))}")

        # 3. Determine Scope based strictly on evidence
        if is_conflicting:
            scope = ClassificationScope.UNCLASSIFIED
        elif target_semester is not None:
            # When a semester is targeted, it applies to that specific semester
            scope = ClassificationScope.SEMESTER_SPECIFIC
            if len(detected_course_codes) == 1 and not department_code:
                scope = ClassificationScope.SUBJECT_SPECIFIC
        elif department_code is not None and target_semester is None:
            # Department identified but no semester -> Department-wide
            scope = ClassificationScope.DEPARTMENT_SPECIFIC
        elif cls._is_explicitly_global(lower_text):
            # Explicitly college-wide notices
            scope = ClassificationScope.GLOBAL
            reasons.append("Identified as college-wide notice (library, general holiday, or campus fest)")
        else:
            # Insufficient evidence -> UNCLASSIFIED
            scope = ClassificationScope.UNCLASSIFIED
            reasons.append("Insufficient evidence to identify target student cohort")

        return {
            "scope": scope.value,
            "target_semester": target_semester,
            "department_code": department_code,
            "academic_year": detected_academic_year,
            "course_codes": detected_course_codes,
            "document_type": detected_doc_type,
            "is_conflicting": is_conflicting,
            "classification_notes": "; ".join(reasons) if reasons else "Clear evidence identified"
        }

    @classmethod
    def _extract_semesters(cls, text: str) -> Set[int]:
        """Extracts unique semester numbers from text, including compound lists."""
        found = set()

        has_sem_keyword = bool(re.search(r"\bsem(?:ester)?s?\b", text))

        # Patterns like: "semester 3", "sem 7", "sem-5", "sem. 3"
        sem_num_matches = re.findall(r"\bsem(?:ester)?\s*(?:-|:|\.)?\s*([1-8])\b", text)
        for m in sem_num_matches:
            found.add(int(m))

        # Patterns like: "3rd sem", "7th semester", "1st sem"
        ord_matches = re.findall(r"\b([1-8])(?:st|nd|rd|th)\s*sem(?:ester)?\b", text)
        for m in ord_matches:
            found.add(int(m))

        # If 'semester' is present anywhere in context, extract all ordinals (e.g. "3rd and 7th semester")
        # Strip out examination or non-semester ordinals (e.g. "2nd mid term", "1st test", "3rd year")
        if has_sem_keyword:
            clean_text = re.sub(r"\b([1-8])(?:st|nd|rd|th)\s*(?:mid\s*term|midterm|internal|test|shift|round|phase|year)\b", "", text, flags=re.I)
            all_ordinals = re.findall(r"\b([1-8])(?:st|nd|rd|th)\b", clean_text)
            for m in all_ordinals:
                found.add(int(m))

        # Roman numeral patterns like: "b tech iii semester", "sem vii", "iii and vii semester"
        roman_matches = re.findall(r"\b(?:sem(?:ester)?|b\.?\s*tech)?\s*([ivx]{1,4})\s*(?:and|&|,)?\s*([ivx]{1,4})?\s*(?:sem(?:ester)?s?)?\b", text)
        for r1, r2 in roman_matches:
            if r1 and r1.lower() in ROMAN_NUMERALS and has_sem_keyword:
                found.add(ROMAN_NUMERALS[r1.lower()])
            if r2 and r2.lower() in ROMAN_NUMERALS and has_sem_keyword:
                found.add(ROMAN_NUMERALS[r2.lower()])

        return found

    @classmethod
    def _extract_departments(cls, text: str) -> Set[str]:
        """Extracts canonical department codes matching textual evidence."""
        found = set()
        for code, keywords in DEPARTMENT_MAP.items():
            for kw in keywords:
                if re.search(r"\b" + kw + r"\b", text):
                    found.add(code)
                    break
        return found

    @classmethod
    def _extract_academic_year(cls, text: str) -> Optional[str]:
        """Extracts academic year strings (e.g. '2026-27', '2026-2027')."""
        match = re.search(r"\b(202\d)\s*[-–/]\s*(\d{2,4})\b", text)
        if match:
            start_yr = match.group(1)
            end_yr = match.group(2)
            if len(end_yr) == 4:
                end_yr = end_yr[-2:]
            return f"{start_yr}-{end_yr}"
        return None

    @classmethod
    def _extract_course_codes(cls, text: str) -> List[str]:
        """Extracts course codes such as CS 301, CS-402, IT 301."""
        matches = re.findall(r"\b(CS|IT|EC|EE|ME|CE|PHYS|MATH)[-\s]?([1-8]\d{2})\b", text, re.I)
        return [f"{dept.upper()} {num}" for dept, num in matches]

    @classmethod
    def _extract_doc_type(cls, text: str) -> str:
        """Determines the document category."""
        if any(k in text for k in ["exam form", "examination form", "back exam"]):
            return "EXAM_FORM"
        if any(k in text for k in ["time table", "timetable", "date sheet", "schedule"]):
            return "TIMETABLE"
        if any(k in text for k in ["syllabus", "curriculum", "course structure"]):
            return "SYLLABUS"
        if any(k in text for k in ["fee", "dues", "challan"]):
            return "FEE_NOTICE"
        if any(k in text for k in ["result", "grade card", "mark sheet"]):
            return "RESULTS"
        if any(k in text for k in ["holiday", "closed", "vacation"]):
            return "HOLIDAY"
        if any(k in text for k in ["hackathon", "fest", "technotsav", "event", "workshop"]):
            return "EVENT"
        return "GENERAL_CIRCULAR"

    @classmethod
    def _is_explicitly_global(cls, text: str) -> bool:
        """Checks if document is universally applicable to all college students."""
        global_indicators = [
            "all students",
            "central library",
            "hostel",
            "canteen",
            "sports",
            "holiday",
            "technotsav",
            "administrative block",
            "proctor office"
        ]
        return any(ind in text for ind in global_indicators)
