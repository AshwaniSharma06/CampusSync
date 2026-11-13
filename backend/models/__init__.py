from backend.models.user import User, StudentProfile, RoleEnum
from backend.models.academic import (
    Course, 
    Assignment, 
    Notice, 
    AcademicResource, 
    NoticeType,
    ClassificationScope,
    DataOrigin,
    VerificationStatus,
    Department,
    ExaminationSchedule,
    ScrapingJob,
    AcademicDocument
)
from backend.models.social import (
    Event, 
    Club, 
    CommunityPost, 
    PostAttachment, 
    PostComment, 
    Poll, 
    PollOption, 
    PollVote, 
    PostLike, 
    SavedItem
)
from backend.models.system import Notification, ChatSession, ChatMessage, IngestedDocument
