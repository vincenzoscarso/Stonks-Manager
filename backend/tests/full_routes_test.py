import httpx
import os
import sys
import time
from supabase import create_client
from app.utils.get_env_variable import getEnvVariable

# --- CONFIGURATION ---
BASE_URL_RAW = getEnvVariable("API_BASE_URL") if os.environ.get("API_BASE_URL") else "http://localhost:8000/api"
BASE_URL = (f"http://{BASE_URL_RAW}" if not BASE_URL_RAW.startswith("http") else BASE_URL_RAW).rstrip("/")
TEST_EMAIL = getEnvVariable("TEST_USER_EMAIL")
TEST_PASSWORD = getEnvVariable("TEST_USER_PASSWORD")
TIMEOUT = 10.0

def get_auth_token():
    supabase = create_client(getEnvVariable("SUPABASE_URL"), getEnvVariable("SUPABASE_KEY"))
    try:
        res = supabase.auth.sign_in_with_password({"email": TEST_EMAIL, "password": TEST_PASSWORD})
        return str(res.session.access_token) # type: ignore
    except:
        res = supabase.auth.sign_up({"email": TEST_EMAIL, "password": TEST_PASSWORD})
        if not res.session: res = supabase.auth.sign_in_with_password({"email": TEST_EMAIL, "password": TEST_PASSWORD})
        return str(res.session.access_token) # type: ignore

def main():
    should_cleanup = input("Perform final cleanup (delete items)? (y/N): ").lower() == "y"
    should_delete_user = input(f"Remove {TEST_EMAIL} from Auth? (y/N): ").lower() == "y"
    token = get_auth_token()
    client = httpx.Client(headers={"Authorization": f"Bearer {token}"}, timeout=TIMEOUT)
    ids = {"cat": "", "acc": "", "tx": ""}

    print(f"\n--- Testing Routes at {BASE_URL} ---")

    # -- User Routes --
    print("\n[User]")
    def test_route(method, url, **kwargs):
        try:
            resp = getattr(client, method)(f"{BASE_URL}{url}", **kwargs)
            # 400 is common if user already exists or validation fails
            # We print the status and only show error if it's not a known case
            print(f"{resp.status_code} | {method.upper():<6} {url}")
            if resp.status_code >= 400:
                print(f"   Detail: {resp.text[:100]}")
            return resp
        except Exception as e:
            print(f"ERR | {method.upper():<6} {url} ({e})")
            return None

    test_route("post", "/users", json={"display_name": "Test", "email": TEST_EMAIL})
    test_route("get", "/users")
    test_route("put", "/users", json={"display_name": "Updated", "email": TEST_EMAIL})

    # -- Category Routes --
    print("\n[Category]")
    test_route("get", "/categories")
    resp = test_route("post", "/categories", json={"name": f"Cat {int(time.time())}", "description": "Desc"})
    if resp and resp.status_code == 200:
        ids["cat"] = resp.json().get("id")
        test_route("put", f"/categories/{ids['cat']}", json={"name": "Updated"})

    # -- Account Routes --
    print("\n[Account]")
    test_route("get", "/accounts")
    resp = test_route("post", "/accounts", json={"name": f"Acc {int(time.time())}", "include_in_total": True})
    if resp and resp.status_code == 200:
        ids["acc"] = resp.json().get("id")
        test_route("put", f"/accounts/{ids['acc']}", json={"name": "Updated"})

    # -- Transaction Routes --
    print("\n[Transaction]")
    test_route("get", "/transactions")
    if ids["acc"] and ids["cat"]:
        payload = {"type": "expense", "description": "Test", "amount": 10.0, "date": "2026-05-01T12:00:00Z", "account_id": ids["acc"], "category_id": ids["cat"]}
        resp = test_route("post", "/transactions", json=payload)
        if resp and resp.status_code == 200:
            ids["tx"] = resp.json().get("id")
            # Update must include all required fields for NewTransaction
            update_payload = payload.copy()
            update_payload["description"] = "Updated"
            test_route("put", f"/transactions/{ids['tx']}", json=update_payload)

    # -- DELETE for all routes --
    print("\n--- Cleanup (DELETE) ---")
    if should_cleanup:
        if ids["tx"]: test_route("delete", f"/transactions/{ids['tx']}")
        if ids["acc"]: test_route("delete", f"/accounts/{ids['acc']}")
        if ids["cat"]: test_route("delete", f"/categories/{ids['cat']}")
    if should_delete_user: test_route("delete", "/users")

    print("\nTests completed.")

if __name__ == "__main__":
    main()
