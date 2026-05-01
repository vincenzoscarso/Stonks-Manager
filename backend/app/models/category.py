from __future__ import annotations

from datetime import datetime
from uuid import UUID
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class NewCategory(BaseModel):
    name: str = Field(..., min_length=1, max_length=64)
    description: Optional[str] = None


class Category(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    created_at: datetime
    updated_at: datetime
    user_profile_id: Optional[UUID]

    model_config = ConfigDict(from_attributes=True)
