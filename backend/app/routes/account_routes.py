from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, Query

from backend.app.models.account import NewAccount, Account
from backend.app.services.account_service import AccountService
from backend.app.utils.get_current_user import getCurrentUser
from backend.app.utils.get_supabase_client import getSupabaseClient
from supabase import Client

router = APIRouter()


def getAccountService(supabase: Client = Depends(getSupabaseClient)) -> AccountService:
    return AccountService(supabase_client=supabase)


@router.get("/accounts", response_model=list[Account])
async def getAccounts(
    user_id: str = Depends(getCurrentUser), service: AccountService = Depends(getAccountService)
) -> list[Account]:

    try:
        return service.getAccounts(user_id)
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/accounts", response_model=Account)
async def addAccount(
    account: NewAccount, user_id: str = Depends(getCurrentUser), service: AccountService = Depends(getAccountService)
) -> Account:

    try:
        return service.addAccount(user_id, account)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error)) from error


@router.put("/accounts/{account_id}", response_model=Account)
async def updateAccount(
    account_id: str,
    account: NewAccount,
    user_id: str = Depends(getCurrentUser),
    service: AccountService = Depends(getAccountService),
) -> Account:

    try:
        return service.updateAccount(user_id, account_id, account)
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.delete("/accounts/{account_id}")
async def deleteAccount(
    account_id: str,
    replace_with: Optional[str] = Query(None, description="ID of the account to reassign transactions to before deletion"),
    user_id: str = Depends(getCurrentUser),
    service: AccountService = Depends(getAccountService),
) -> dict:

    try:
        service.deleteAccount(user_id, account_id, replace_with_account_id=replace_with)
        return {"message": "Account deleted successfully"}
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except RuntimeError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error
