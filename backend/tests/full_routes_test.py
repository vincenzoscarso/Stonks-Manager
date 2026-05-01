import httpx
import sys
import json
import time
from typing import Any, List, Dict
from supabase import create_client
from backend.app.utils.get_env_variable import getEnvVariable

BASE_URL = "http://localhost:8000/api"
TEST_EMAIL = "REDACTED_EMAIL"
TEST_PASSWORD = "REDACTED_PASSWORD"
TIMEOUT = 10.0


class TestReport:
    def __init__(self):
        self.results: List[Dict[str, Any]] = []
        self.failed = False

    def add_result(self, name: str, status: int, success: bool, error: str = ""):
        self.results.append({"name": name, "status": status, "success": success, "error": error})
        if not success:
            self.failed = True

    def print_summary(self):
        print("\n" + "=" * 50)
        print("TEST EXECUTION REPORT")
        print("=" * 50)
        for res in self.results:
            icon = "✅" if res["success"] else "❌"
            print(f"{icon} {res['name']} - Status: {res['status']}")
            if res["error"]:
                print(f"   Error: {res['error']}")
        print("=" * 50)
        if self.failed:
            print("RESULT: SOME TESTS FAILED")
        else:
            print("RESULT: ALL TESTS PASSED")
        print("=" * 50)


def get_auth_token() -> str:
    """Gets a JWT token for the placeholder user, creating it if necessary."""
    url = getEnvVariable("SUPABASE_URL")
    key = getEnvVariable("SUPABASE_KEY")
    supabase = create_client(url, key)

    try:
        print(f"\n--- Authenticating Test User: {TEST_EMAIL} ---")
        # 1. Try to sign in first
        try:
            res: Any = supabase.auth.sign_in_with_password({"email": TEST_EMAIL, "password": TEST_PASSWORD})
            if res.session:
                print("   [OK] Signed in successfully")
                return str(res.session.access_token)
        except Exception:
            # Sign in failed, probably user doesn't exist
            pass

        # 2. If sign in fails, try to sign up
        print("   [INFO] User not found or sign-in failed. Attempting sign-up...")
        res = supabase.auth.sign_up(
            {"email": TEST_EMAIL, "password": TEST_PASSWORD, "options": {"data": {"display_name": "Stonks Test Runner"}}}
        )

        if not res.session:
            # Handle potential email confirmation
            print("   [INFO] User created, but no session returned. Attempting sign-in...")
            res = supabase.auth.sign_in_with_password({"email": TEST_EMAIL, "password": TEST_PASSWORD})

        if not res.session:
            raise RuntimeError("Could not obtain session after sign-up/sign-in.")

        print("   [OK] User created and signed in")
        return str(res.session.access_token)
    except Exception as e:
        print(f"Error authenticating test user: {e}")
        print(
            "\nTip: If you get 'email rate limit exceeded', wait a few minutes or manually create the user in Supabase dashboard."
        )
        print(f"Required user: {TEST_EMAIL} / {TEST_PASSWORD}")
        sys.exit(1)


def test_users(headers: dict, report: TestReport) -> None:
    print("\n--- Testing USER Routes ---")
    user_email = ""

    # 1. POST User Profile (Manual creation test)
    # Note: This might fail with 400 if the profile was already created by the DB trigger
    try:
        new_user_data = {"display_name": "Test User Initial", "email": TEST_EMAIL}
        response = httpx.post(f"{BASE_URL}/users", headers=headers, json=new_user_data, timeout=TIMEOUT)
        # We consider 200/201 as success. 400 is common if already exists.
        is_success = response.status_code in (200, 201)

        # If it already exists, we don't want to mark the whole test as failed,
        # but we should report the status.
        report.add_result(
            "POST /users",
            response.status_code,
            is_success or (response.status_code == 400),
            "" if is_success else f"Note: {response.text}" if response.status_code == 400 else response.text,
        )
        if is_success:
            print("   [OK] User profile created via POST")
        elif response.status_code == 400:
            print("   [INFO] POST /users returned 400 (likely profile already exists)")
    except Exception as e:
        report.add_result("POST /users", 0, False, str(e))

    # 2. Get User Profile
    try:
        response = httpx.get(f"{BASE_URL}/users", headers=headers, timeout=TIMEOUT)
        success = response.status_code == 200
        report.add_result(
            "GET /users",
            response.status_code,
            success,
            "" if success else response.text,
        )
        if success:
            user_email = response.json()["email"]
            print(f"   [OK] Fetched user: {user_email}")
    except Exception as e:
        report.add_result("GET /users", 0, False, str(e))

    # 3. Update User Profile
    if user_email:
        try:
            update_data = {"display_name": f"User {int(time.time())}", "email": user_email}
            response = httpx.put(f"{BASE_URL}/users", headers=headers, json=update_data, timeout=TIMEOUT)
            success = response.status_code == 200
            report.add_result(
                "PUT /users",
                response.status_code,
                success,
                "" if success else response.text,
            )
            if success:
                print("   [OK] User profile updated")
        except Exception as e:
            report.add_result("PUT /users", 0, False, str(e))
    else:
        report.add_result("PUT /users", 0, False, "Skipped: Could not obtain user email from GET /users")


def test_categories(headers: dict, report: TestReport) -> str:
    print("\n--- Testing CATEGORY Routes ---")
    cat_id = ""
    # 1. Get Categories
    try:
        response = httpx.get(f"{BASE_URL}/categories", headers=headers, timeout=TIMEOUT)
        success = response.status_code == 200
        report.add_result(
            "GET /categories",
            response.status_code,
            success,
            "" if success else response.text,
        )
        if success:
            print(f"   [OK] Categories fetched: {len(response.json())} items")
    except Exception as e:
        report.add_result("GET /categories", 0, False, str(e))

    # 2. Add Category
    try:
        cat_name = f"Test Cat {int(time.time())}"
        new_cat = {"name": cat_name, "description": "Testing category"}
        response = httpx.post(f"{BASE_URL}/categories", headers=headers, json=new_cat, timeout=TIMEOUT)
        success = response.status_code == 200
        report.add_result("POST /categories", response.status_code, success, "" if success else response.text)
        if success:
            cat_id = response.json()["id"]
            print(f"   [OK] Category created with ID: {cat_id}")
    except Exception as e:
        report.add_result("POST /categories", 0, False, str(e))

    # 3. Update Category
    if cat_id:
        try:
            update_cat = {"name": f"Updated {int(time.time())}", "description": "Updated description"}
            response = httpx.put(f"{BASE_URL}/categories/{cat_id}", headers=headers, json=update_cat, timeout=TIMEOUT)
            success = response.status_code == 200
            report.add_result(
                f"PUT /categories/{cat_id}",
                response.status_code,
                success,
                "" if success else response.text,
            )
            if success:
                print("   [OK] Category updated")
        except Exception as e:
            report.add_result(f"PUT /categories/{cat_id}", 0, False, str(e))

    return cat_id


def test_accounts(headers: dict, report: TestReport) -> str:
    print("\n--- Testing ACCOUNT Routes ---")
    acc_id = ""
    # 1. Get Accounts
    try:
        response = httpx.get(f"{BASE_URL}/accounts", headers=headers, timeout=TIMEOUT)
        success = response.status_code == 200
        report.add_result(
            "GET /accounts",
            response.status_code,
            success,
            "" if success else response.text,
        )
        if success:
            print(f"   [OK] Accounts fetched: {len(response.json())} items")
    except Exception as e:
        report.add_result("GET /accounts", 0, False, str(e))

    # 2. Add Account
    try:
        acc_name = f"Test Acc {int(time.time())}"
        new_acc = {"name": acc_name, "include_in_total": True}
        response = httpx.post(f"{BASE_URL}/accounts", headers=headers, json=new_acc, timeout=TIMEOUT)
        success = response.status_code == 200
        report.add_result("POST /accounts", response.status_code, success, "" if success else response.text)
        if success:
            acc_id = response.json()["id"]
            print(f"   [OK] Account created with ID: {acc_id}")
    except Exception as e:
        report.add_result("POST /accounts", 0, False, str(e))

    # 3. Update Account
    if acc_id:
        try:
            update_acc = {"name": f"Updated {int(time.time())}", "include_in_total": False}
            response = httpx.put(f"{BASE_URL}/accounts/{acc_id}", headers=headers, json=update_acc, timeout=TIMEOUT)
            success = response.status_code == 200
            report.add_result(
                f"PUT /accounts/{acc_id}",
                response.status_code,
                success,
                "" if success else response.text,
            )
            if success:
                print("   [OK] Account updated")
        except Exception as e:
            report.add_result(f"PUT /accounts/{acc_id}", 0, False, str(e))

    return acc_id


def test_transactions(headers: dict, account_id: str, category_id: str, report: TestReport) -> str:
    print("\n--- Testing TRANSACTION Routes ---")
    tx_id = ""
    # 1. Get Transactions
    try:
        response = httpx.get(f"{BASE_URL}/transactions", headers=headers, timeout=TIMEOUT)
        success = response.status_code == 200
        report.add_result(
            "GET /transactions",
            response.status_code,
            success,
            "" if success else response.text,
        )
        if success:
            print(f"   [OK] Transactions fetched: {len(response.json())} items")
    except Exception as e:
        report.add_result("GET /transactions", 0, False, str(e))

    # 2. Add Transaction
    if account_id and category_id:
        try:
            new_tx = {
                "type": "expense",
                "description": "Test Transaction",
                "amount": 10.50,
                "date": "2026-05-01T12:00:00Z",
                "account_id": account_id,
                "category_id": category_id,
            }
            response = httpx.post(f"{BASE_URL}/transactions", headers=headers, json=new_tx, timeout=TIMEOUT)
            success = response.status_code == 200
            report.add_result("POST /transactions", response.status_code, success, "" if success else response.text)
            if success:
                tx_id = response.json()["id"]
                print(f"   [OK] Transaction created with ID: {tx_id}")
        except Exception as e:
            report.add_result("POST /transactions", 0, False, str(e))

    # 3. Update Transaction
    if tx_id:
        try:
            update_tx = {
                "type": "expense",
                "description": "Updated Transaction",
                "amount": 15.00,
                "date": "2026-05-01T12:00:00Z",
                "account_id": account_id,
                "category_id": category_id,
            }
            response = httpx.put(f"{BASE_URL}/transactions/{tx_id}", headers=headers, json=update_tx, timeout=TIMEOUT)
            success = response.status_code == 200
            report.add_result(
                f"PUT /transactions/{tx_id}",
                response.status_code,
                success,
                "" if success else response.text,
            )
            if success:
                print("   [OK] Transaction updated")
        except Exception as e:
            report.add_result(f"PUT /transactions/{tx_id}", 0, False, str(e))

    return tx_id


def final_cleanup(headers: dict, tx_id: str, acc_id: str, cat_id: str, report: TestReport) -> None:
    print("\n--- FINAL CLEANUP ---")

    # 1. Delete Transaction
    if tx_id:
        try:
            response = httpx.delete(f"{BASE_URL}/transactions/{tx_id}", headers=headers, timeout=TIMEOUT)
            success = response.status_code == 200
            report.add_result(
                f"DELETE /transactions/{tx_id}",
                response.status_code,
                success,
                "" if success else response.text,
            )
            if success:
                print("   [OK] Transaction deleted")
        except Exception as e:
            report.add_result(f"DELETE /transactions/{tx_id}", 0, False, str(e))

    # 2. Delete Account
    if acc_id:
        try:
            response = httpx.delete(f"{BASE_URL}/accounts/{acc_id}", headers=headers, timeout=TIMEOUT)
            success = response.status_code == 200
            report.add_result(
                f"DELETE /accounts/{acc_id}",
                response.status_code,
                success,
                "" if success else response.text,
            )
            if success:
                print("   [OK] Account deleted")
        except Exception as e:
            report.add_result(f"DELETE /accounts/{acc_id}", 0, False, str(e))

    # 3. Delete Category
    if cat_id:
        try:
            response = httpx.delete(f"{BASE_URL}/categories/{cat_id}", headers=headers, timeout=TIMEOUT)
            success = response.status_code == 200
            report.add_result(
                f"DELETE /categories/{cat_id}",
                response.status_code,
                success,
                "" if success else response.text,
            )
            if success:
                print("   [OK] Category deleted")
        except Exception as e:
            report.add_result(f"DELETE /categories/{cat_id}", 0, False, str(e))

    # Ask for user deletion confirmation
    print("\n" + "-" * 30)
    choice = input(f"Do you want to test DELETE /users and REMOVE {TEST_EMAIL} from Auth? (y/N): ").strip().lower()
    if choice == "y":
        try:
            # 1. Delete from our public.user_profile (Backend Route)
            response = httpx.delete(f"{BASE_URL}/users", headers=headers)
            report.add_result(
                "DELETE /users (Profile)",
                response.status_code,
                response.status_code == 200,
                "" if response.status_code == 200 else response.text,
            )

            # 2. Delete from auth.users (Supabase Auth)
            # Since the user is authenticated, they can't delete themselves via standard Auth API
            # without admin privileges. But we can at least ensure our backend route
            # handles the profile cleanup.
            # NOTE: To truly delete from auth.users, one would typically use the admin API.
            # For this test, we assume the backend handles the database side.

            if response.status_code == 200:
                print(f"   [OK] User profile {TEST_EMAIL} deleted from database")
        except Exception as e:
            report.add_result("DELETE /users", 0, False, str(e))
    else:
        print(f"Skipping deletion of {TEST_EMAIL}. You can use it for manual tests.")


def main() -> None:
    report = TestReport()
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    cat_id = ""
    acc_id = ""
    tx_id = ""

    try:
        test_users(headers, report)
        cat_id = test_categories(headers, report)
        acc_id = test_accounts(headers, report)
        tx_id = test_transactions(headers, acc_id, cat_id, report)
    except Exception as e:
        print(f"\nCritical error during testing: {e}")
    finally:
        final_cleanup(headers, tx_id, acc_id, cat_id, report)
        report.print_summary()


if __name__ == "__main__":
    main()
