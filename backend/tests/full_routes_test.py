import httpx
import os
import time
from supabase import create_client
from backend.app.utils.get_env_variable import getEnvVariable

# --- CONFIGURATION ---
BASE_URL_RAW = getEnvVariable("API_BASE_URL") if os.environ.get("API_BASE_URL") else "http://localhost:8000/api"
BASE_URL = (f"http://{BASE_URL_RAW}" if not BASE_URL_RAW.startswith("http") else BASE_URL_RAW).rstrip("/")
TEST_EMAIL = getEnvVariable("TEST_USER_EMAIL")
TEST_PASSWORD = getEnvVariable("TEST_USER_PASSWORD")
TIMEOUT = 10.0


def get_auth_token() -> str:
    supabase = create_client(getEnvVariable("SUPABASE_URL"), getEnvVariable("SUPABASE_KEY"))
    try:
        res = supabase.auth.sign_in_with_password({"email": TEST_EMAIL, "password": TEST_PASSWORD})
        return str(res.session.access_token)  # type: ignore
    except:
        res = supabase.auth.sign_up({"email": TEST_EMAIL, "password": TEST_PASSWORD})
        if not res.session:
            res = supabase.auth.sign_in_with_password({"email": TEST_EMAIL, "password": TEST_PASSWORD})
        return str(res.session.access_token)  # type: ignore


import sys

def main():
    should_only_get_token = "--jwt" in sys.argv
    should_cleanup = "--no-cleanup" not in sys.argv
    should_delete_user = "--keep-user" not in sys.argv

    if should_only_get_token:
        print("JWT:")
        print(get_auth_token())
        return

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
    resp = test_route("post", "/categories", json={"name": f"Cat {int(time.time())}", "type": "expense", "description": "Desc"})
    if resp and resp.status_code == 200:
        ids["cat"] = resp.json().get("id")
        test_route("put", f"/categories/{ids['cat']}", json={"name": "Updated", "type": "expense"})

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
        payload = {
            "type": "expense",
            "description": "Test",
            "amount": 10.0,
            "date": "2026-05-01T12:00:00Z",
            "account_id": ids["acc"],
            "category_id": ids["cat"],
        }
        resp = test_route("post", "/transactions", json=payload)
        if resp and resp.status_code == 200:
            ids["tx"] = resp.json().get("id")
            # Update must include all required fields for NewTransaction
            update_payload = payload.copy()
            update_payload["description"] = "Updated"
            test_route("put", f"/transactions/{ids['tx']}", json=update_payload)

    # -- AI Routes --
    print("\n[AI]")
    ai_base_url = BASE_URL.replace("/api", "/ai")
    
    try:
        resp = client.post(f"{ai_base_url}/quick-insert", json={"text": "Ho speso 20 euro per la spesa al supermercato"})
        print(f"{resp.status_code} | POST   /quick-insert")
        if resp.status_code >= 400:
            print(f"   Detail: {resp.text[:100]}")
    except Exception as e:
        print(f"ERR | POST   /quick-insert ({e})")
    
    receipt_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "resources", "receipt-benchmark.png"))
    if os.path.exists(receipt_path):
        try:
            with open(receipt_path, "rb") as f:
                # Use client directly since test_route doesn't support multipart files easily without kwargs modification
                resp = client.post(f"{ai_base_url}/scan-receipt", files={"file": ("receipt-benchmark.png", f, "image/png")})
                print(f"{resp.status_code} | POST   /scan-receipt")
                if resp.status_code >= 400:
                    print(f"   Detail: {resp.text[:100]}")
        except Exception as e:
            print(f"ERR | POST   /scan-receipt ({e})")
    else:
        print(f"SKIP | POST   /scan-receipt (file not found)")

    # -- DELETE for all routes --
    print("\n--- Cleanup (DELETE) ---")
    if should_cleanup:
        if ids["tx"]:
            test_route("delete", f"/transactions/{ids['tx']}")
        if ids["acc"]:
            test_route("delete", f"/accounts/{ids['acc']}")
        if ids["cat"]:
            test_route("delete", f"/categories/{ids['cat']}")
    if should_delete_user:
        test_route("delete", "/users")

    print("\nTests completed.")


if __name__ == "__main__":
    main()
