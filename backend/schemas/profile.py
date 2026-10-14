from typing import Optional, List
from pydantic import BaseModel, Field

class StudentProfileBase(BaseModel):
    department: Optional[str] = Field(None, max_length=100, example="Computer Science Engineering")
    semester: Optional[int] = Field(None, ge=1, le=10, example=7)
    enrollment_year: Optional[int] = Field(None, ge=2000, le=2030, example=2023)
    student_id: Optional[str] = Field(None, max_length=50, example="CS-2023-042")
    interests: Optional[List[str]] = Field(default=[], example=["AI/ML", "Web Development", "Robotics"])

class StudentProfileUpdate(StudentProfileBase):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)

class StudentProfileResponse(BaseModel):
    email: str
    full_name: str
    student_id: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[int] = None
    enrollment_year: Optional[int] = None
    interests: List[str] = []
    profile_complete: bool = False

    class Config:
        from_attributes = True
