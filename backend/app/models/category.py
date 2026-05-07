from __future__ import annotations

from datetime import datetime
from uuid import UUID
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class NewCategory(BaseModel):
    name: str = Field(..., min_length=1, max_length=64)
    type: Literal["income", "expense"]
    description: Optional[str] = Field(default=None, max_length=256)


class Category(BaseModel):
    id: UUID
    name: str
    type: Literal["income", "expense"]
    description: Optional[str]
    created_at: datetime
    updated_at: datetime
    user_profile_id: Optional[UUID]

    model_config = ConfigDict(from_attributes=True)
