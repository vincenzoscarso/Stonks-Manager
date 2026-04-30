from fastapi import APIRouter, HTTPException, Depends

from app.models.transaction import NewTransaction, Transaction
from app.services.transaction_service import TransactionService
from app.utils.get_current_user import get_current_user
from app.utils.supabase_client import get_supabase_client
from supabase import Client

router = APIRouter()

def get_transaction_service(supabase: Client = Depends(get_supabase_client)) -> TransactionService:
    return TransactionService(supabase_client=supabase)

@router.get("/transactions", response_model=list[Transaction])
async def get_transactions(
    user_id: str = Depends(get_current_user),
    service: TransactionService = Depends(get_transaction_service)
) -> list[Transaction]:
    try:
        return service.get_transactions(user_id)
    except (RuntimeError, ValueError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

@router.post("/transactions", response_model=Transaction)
async def add_transaction(
    transaction: NewTransaction,
    user_id: str = Depends(get_current_user),
    service: TransactionService = Depends(get_transaction_service)
) -> Transaction:
    try:
        return service.add_transaction(user_id, transaction)
    except (RuntimeError, ValueError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

@router.put("/transactions/{transaction_id}", response_model=Transaction)
async def update_transaction(
    transaction_id: str,
    transaction: NewTransaction,
    user_id: str = Depends(get_current_user),
    service: TransactionService = Depends(get_transaction_service)
) -> Transaction:
    try:
        return service.update_transaction(user_id, transaction_id, transaction)
    except (RuntimeError, ValueError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

@router.delete("/transactions/{transaction_id}")
async def delete_transaction(
    transaction_id: str,
    user_id: str = Depends(get_current_user),
    service: TransactionService = Depends(get_transaction_service)
) -> dict:
    try:
        service.delete_transaction(user_id, transaction_id)
        return {"message": "Transaction deleted successfully"}
    except (RuntimeError, ValueError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error