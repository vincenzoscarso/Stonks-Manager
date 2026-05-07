from pydantic import BaseModel, Field

class QuickInsertRequest(BaseModel):
    text: str = Field(..., max_length=256)
