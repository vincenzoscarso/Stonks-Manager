from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class NewAccount(BaseModel):
    name: str = Field(..., min_length=1, max_length=64)
    include_in_total: bool = True


class Account(BaseModel):
    id: UUID
    name: str
    include_in_total: bool
    created_at: datetime
    updated_at: datetime
    user_profile_id: UUID

    model_config = ConfigDict(from_attributes=True)
