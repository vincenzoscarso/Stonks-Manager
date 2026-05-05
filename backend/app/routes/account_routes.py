from fastapi import APIRouter, HTTPException, Depends

from app.models.account import NewAccount, Account
from app.services.account_service import AccountService
from app.utils.get_current_user import getCurrentUser
from app.utils.get_supabase_client import getSupabaseClient
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
    account_id: str, user_id: str = Depends(getCurrentUser), service: AccountService = Depends(getAccountService)
) -> dict:

    try:
        service.deleteAccount(user_id, account_id)
        return {"message": "Account deleted successfully"}
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
