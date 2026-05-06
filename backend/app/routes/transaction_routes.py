from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query

from app.models.transaction import NewTransaction, Transaction
from app.services.transaction_service import TransactionService
from app.utils.get_current_user import getCurrentUser
from app.utils.get_supabase_client import getSupabaseClient
from supabase import Client

router = APIRouter()


def getTransactionService(supabase: Client = Depends(getSupabaseClient)) -> TransactionService:
    return TransactionService(supabase_client=supabase)


@router.get("/transactions", response_model=list[Transaction])
async def getTransactions(
    start_date: Optional[str] = Query(None, description="Filter transactions from this date"),
    end_date: Optional[str] = Query(None, description="Filter transactions up to this date"),
    category_id: Optional[str] = Query(None, description="Filter transactions by category ID"),
    account_id: Optional[str] = Query(None, description="Filter transactions by account ID"),
    transaction_type: Optional[str] = Query(None, alias="type", description="Filter by income or expense"),
    user_id: str = Depends(getCurrentUser),
    service: TransactionService = Depends(getTransactionService),
) -> list[Transaction]:

    try:
        return service.getTransactions(
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
            category_id=category_id,
            account_id=account_id,
            transaction_type=transaction_type,
        )
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/transactions", response_model=Transaction)
async def addTransaction(
    transaction: NewTransaction,
    user_id: str = Depends(getCurrentUser),
    service: TransactionService = Depends(getTransactionService),
) -> Transaction:

    try:
        return service.addTransaction(user_id, transaction)
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.put("/transactions/{transaction_id}", response_model=Transaction)
async def updateTransaction(
    transaction_id: str,
    transaction: NewTransaction,
    user_id: str = Depends(getCurrentUser),
    service: TransactionService = Depends(getTransactionService),
) -> Transaction:

    try:
        return service.updateTransaction(user_id, transaction_id, transaction)
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.delete("/transactions/{transaction_id}")
async def deleteTransaction(
    transaction_id: str,
    user_id: str = Depends(getCurrentUser),
    service: TransactionService = Depends(getTransactionService),
) -> dict:

    try:
        service.deleteTransaction(user_id, transaction_id)
        return {"message": "Transaction deleted successfully"}
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
