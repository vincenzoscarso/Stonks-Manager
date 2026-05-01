from __future__ import annotations

from datetime import datetime
from uuid import UUID
from typing import Literal, Optional
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class NewTransaction(BaseModel):
    type: Literal["income", "expense"]
    description: Optional[str] = None
    amount: Decimal = Field(..., gt=0)
    date: datetime
    account_id: UUID
    category_id: UUID


class Transaction(BaseModel):
    id: UUID
    type: Literal["income", "expense"]
    description: Optional[str]
    amount: Decimal
    date: datetime
    created_at: datetime
    updated_at: datetime
    account_id: UUID
    category_id: UUID

    model_config = ConfigDict(from_attributes=True)
