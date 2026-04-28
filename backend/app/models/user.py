from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

# The data that the user actually provides
class NewUserProfile(BaseModel):
    display_name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr

# The data that gets saved into the user_profile table of the DB
class UserProfile(BaseModel):
    id: UUID
    display_name: str
    email: EmailStr
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
