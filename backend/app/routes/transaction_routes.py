from fastapi import APIRouter, HTTPException, Depends

from app.models.transaction import NewTransaction, Transaction
from app.services.transaction_service import TransactionService
from app.auth import get_current_user

router = APIRouter()
transaction_service = TransactionService()

@router.get("/transactions", response_model=list[Transaction])
async def get_transactions(user_id: str = Depends(get_current_user)) -> list[Transaction]:
    try:
        return transaction_service.get_transactions(user_id)
    except (RuntimeError, ValueError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

@router.post("/transactions", response_model=Transaction)
async def add_transaction(transaction: NewTransaction, user_id: str = Depends(get_current_user)) -> Transaction:
    try:
        return transaction_service.add_transaction(user_id, transaction)
    except (RuntimeError, ValueError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

@router.put("/transactions/{transaction_id}", response_model=Transaction)
async def update_transaction(transaction_id: str, transaction: NewTransaction, user_id: str = Depends(get_current_user)) -> Transaction:
    try:
        return transaction_service.update_transaction(user_id, transaction_id, transaction)
    except (RuntimeError, ValueError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

@router.delete("/transactions/{transaction_id}")
async def delete_transaction(transaction_id: str, user_id: str = Depends(get_current_user)) -> dict:
    try:
        transaction_service.delete_transaction(user_id, transaction_id)
        return {"message": "Transaction deleted successfully"}
    except (RuntimeError, ValueError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error