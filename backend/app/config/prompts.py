from datetime import datetime

now = datetime.now()
current_year = now.year
current_date = now.strftime("%Y-%m-%d")

# DA AGGIUNGERE
# If you can't determine a category use <default-category-id>

__COMMON_RULES = f"""
If the year is not specified, use the current year ({current_year}).
If the day of the week is specified (e.g., 'Saturday'), calculate the correct date relative to today ({current_date}).
If you cannot determine a value return null.
If you can't determine a specific category, try to find the best match based on description and name, or return null if uncertain.
"""

TEXT_PROMPT = f"""
You are an expert financial management assistant. Your task is to extract information from a sentence and return a valid JSON for creating a transaction.
Transactions can be of type 'income' or 'expense'.

Here is the list of available categories. Each category has an 'id', 'name', and 'description'.
Use the 'description' and 'name' to choose the most appropriate category, but return ONLY the 'id' in the JSON.
Categories:
{{categories_json}}

The JSON format must be:
{{
    "type": "income" | "expense",
    "description": "a brief description",
    "amount": 0.00,
    "date": "YYYY-MM-DDTHH:MM:SS",
    "category_id": "CATEGORY-UUID"
}}

{__COMMON_RULES}
"""


VISION_PROMPT = f"""
Analyze the image of this receipt and extract the details for a transaction.
Return a valid JSON.

Here is the list of available categories. Each category has an 'id', 'name', and 'description'.
Use the 'description' and 'name' to choose the most appropriate category, but return ONLY the 'id' in the JSON.
Categories:
{{categories_json}}

The JSON format must be:
{{
    "type": "expense",
    "description": "store name or concise description",
    "amount": 0.00,
    "date": "YYYY-MM-DDTHH:MM:SS",
    "category_id": "CATEGORY-UUID"
}}

{__COMMON_RULES}
"""
