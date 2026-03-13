from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class UserCreate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    surname: Optional[str] = Field(None, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)
    avatarUrl: Optional[str] = None

class UserOut(BaseModel):
    id: str
    email: EmailStr
    createdAt: datetime

class EmailCheckOut(BaseModel):
    exists: bool

# --- new models for auth/login ---
class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)

class UserAuthOut(BaseModel):
    id: str
    email: EmailStr
    name: Optional[str] = None
    surname: Optional[str] = None
    avatarUrl: Optional[str] = None
    totalScore: float | int | None = 0
    questionnaireCompleted: bool = False
    sectionScores: Optional[Dict[str, Any]] = None
    height: Optional[float | int | str] = None
    weight: Optional[float | int | str] = None


class VerifyPasswordIn(BaseModel):
    userId: str
    password: str = Field(..., min_length=1)


class UserUpdate(BaseModel):
    userId: str
    name: Optional[str] = Field(None, max_length=100)
    surname: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=8)
    avatarUrl: Optional[str] = None


class SectionScores(BaseModel):
    nutriOmics: float = 0
    physioOmics: float = 0
    psychoOmics: float = 0
    socioOmics: float = 0
    ecoOmics: float = 0
    lifeOmics: float = 0


class QuestionnaireIn(BaseModel):
    userId: str
    answers: Dict[str, Any] = Field(default_factory=dict)
    sectionScores: SectionScores = Field(default_factory=SectionScores)
    totalScore: float


class DailyCheckInRaw(BaseModel):
    userId: str
    date: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    mood: Optional[int] = Field(None, ge=1, le=5)
    energy: int | None = None
    # new: allow frontend to send sleepHours directly (numeric hours)
    sleepHours: float | None = None
    sport: Optional[bool] = None
    sleep: Optional['SleepInput'] = None
    mindset: Optional['MindsetData'] = None


class SleepInput(BaseModel):
    bedTime: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    wakeTime: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    awakenings: int = Field(..., ge=0)
    coffeeLog: List[Dict[str, str]] = Field(default_factory=list)


class MindsetData(BaseModel):
    mood: int = Field(..., ge=0, le=10)
    stress: int = Field(..., ge=0, le=10)
    anxiety: int = Field(..., ge=0, le=10)
    journalNote: Optional[str] = None
    aiEmotion: Optional[str] = None
    aiTags: Optional[List[str]] = []
    aiConfidence: Optional[float] = None


class DailyLogResponse(BaseModel):
    dailyLogId: str


class MacroTotals(BaseModel):
    calories: float = Field(0, ge=0)
    protein: float = Field(0, ge=0)
    carbs: float = Field(0, ge=0)
    fat: float = Field(0, ge=0)
    score: float | int = 0
    calorie_score: float | int = 0
    quality_score_sum: float = 0
    items_count: int = 0
    calorie_target: float | int | None = None


class FoodEntry(BaseModel):
    foodId: Optional[str] = None
    name: str = Field(..., min_length=1)
    quantity: float = Field(..., gt=0)
    unit: str = Field(..., min_length=1)
    meal: str = Field(..., min_length=1)
    calories: float = Field(..., ge=0)
    protein: float = Field(..., ge=0)
    carbs: float = Field(..., ge=0)
    fat: float = Field(..., ge=0)
    category: Optional[str] = None
    score: Optional[int] = None


class FoodDayCreate(BaseModel):
    userId: str
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    waterGlasses: int = Field(0, ge=0)
    dailyTotals: MacroTotals = Field(default_factory=MacroTotals)
    foodEntries: List[FoodEntry] = Field(default_factory=list)


class FoodDayOut(FoodDayCreate):
    id: str


class FoodEntryAdd(BaseModel):
    userId: str
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    entry: FoodEntry


class WaterUpdate(BaseModel):
    userId: str
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    waterGlasses: int = Field(..., ge=0)


class FoodDayQuery(BaseModel):
    userId: str
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")

class FoodHistoryItem(BaseModel):
    date: str
    waterGlasses: int = 0
    calories: float = 0
    protein: float = 0
    carbs: float = 0
    fat: float = 0
    foods: List[Dict[str, Any]] = Field(default_factory=list)

class ExerciseEntry(BaseModel):
    activityId: Optional[str] = None
    name: str = Field(..., min_length=1)
    durationMinutes: float = Field(..., gt=0)
    inputWeight: Optional[float] = Field(None, gt=0)
    caloriesCalculated: float = Field(..., ge=0)
    time: Optional[str] = Field(None, pattern=r"^\d{2}:\d{2}$")


class StepsPayload(BaseModel):
    userId: str
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    count: int = Field(..., ge=0)
    caloriesFromSteps: float = Field(..., ge=0)


class FitDayCreate(BaseModel):
    userId: str
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    steps: Dict[str, float | int] = Field(default_factory=lambda: {"count": 0, "caloriesFromSteps": 0})
    dailyTotals: Dict[str, float | int] = Field(default_factory=lambda: {"caloriesBurned": 0, "activeMinutes": 0})
    exercises: List[ExerciseEntry] = Field(default_factory=list)


class FitDayOut(FitDayCreate):
    id: str


class ExerciseAdd(BaseModel):
    userId: str
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    exercise: ExerciseEntry


class FitDayQuery(BaseModel):
    userId: str
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")


class MoodMetrics(BaseModel):
    stressLevel: int = Field(..., ge=1, le=10)
    anxietyLevel: int = Field(..., ge=1, le=10)
    copingAbility: int = Field(..., ge=1, le=10)


class WellbeingCreate(BaseModel):
    userId: str
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    moodMetrics: MoodMetrics
    dailyNote: Optional[str] = None


class WellbeingOut(WellbeingCreate):
    id: str
    createdAt: datetime
    updatedAt: datetime


class SleepClearPayload(BaseModel):
    userId: str
    dailyLogId: str

class ExerciseDelete(BaseModel):
    userId: str
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    index: int = Field(..., ge=0)

# Added response model for food history API
class FoodHistoryResponse(BaseModel):
    days: List[FoodHistoryItem] = Field(default_factory=list)
