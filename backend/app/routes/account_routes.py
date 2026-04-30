from fastapi import APIRouter, HTTPException, Depends

from app.models.account import NewAccount, Account
from app.services.account_service import AccountService
from app.utils.get_current_user import get_current_user
from app.utils.get_supabase_client import get_supabase_client
from supabase import Client

router = APIRouter()

def get_account_service(supabase: Client = Depends(get_supabase_client)) -> AccountService:
    return AccountService(supabase_client=supabase)

@router.get("/accounts", response_model=list[Account])
async def get_accounts(
    user_id: str = Depends(get_current_user),
    service: AccountService = Depends(get_account_service)
) -> list[Account]:
    try:
        return service.get_accounts(user_id)
    except (RuntimeError, ValueError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

@router.post("/accounts", response_model=Account)
async def add_account(
    account: NewAccount,
    user_id: str = Depends(get_current_user),
    service: AccountService = Depends(get_account_service)
) -> Account:
    try:
        return service.add_account(user_id, account)
    except (RuntimeError, ValueError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

@router.put("/accounts/{account_id}", response_model=Account)
async def update_account(
    account_id: str,
    account: NewAccount,
    user_id: str = Depends(get_current_user),
    service: AccountService = Depends(get_account_service)
) -> Account:
    try:
        return service.update_account(user_id, account_id, account)
    except (RuntimeError, ValueError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

@router.delete("/accounts/{account_id}")
async def delete_account(
    account_id: str,
    user_id: str = Depends(get_current_user),
    service: AccountService = Depends(get_account_service)
) -> dict:
    try:
        service.delete_account(user_id, account_id)
        return {"message": "Account deleted successfully"}
    except (RuntimeError, ValueError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error