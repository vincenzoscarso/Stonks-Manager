# Stonks Manager Backend

This is the Python backend for Stonks Manager, built with FastAPI.

## Setup

1. Create virtual environment and activate it:
   ```powershell
   python -m venv .venv
   .\venv\bin\activate.bat
   ```

2. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```

3. Set environment variables:
   - SUPABASE_URL: Your Supabase project URL
   - SUPABASE_KEY: Your Supabase anonymous key

4. Run the server:
   ```powershell
   uvicorn app.main:app --reload
   ```

## API Endpoints

- POST /api/users: Add a new user profile

## Testing

Run tests with:
```powershell
pytest
```