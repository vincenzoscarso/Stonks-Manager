import httpx
import json
import base64
from typing import Any, Dict, List
from app.utils.get_env_variable import getEnvVariable
from app.config.prompts import TEXT_PROMPT, VISION_PROMPT
from app.config.configuration import (
    AI_API_URL,
    AI_TEXT_MODEL,
    AI_VISION_MODEL,
    AI_QUICK_INSERT_TIMEOUT,
    AI_SCAN_RECEIPT_TIMEOUT,
)


class AIService:
    def __init__(self) -> None:
        self.api_key = getEnvVariable("MISTRAL_API_KEY")
        self.api_url = AI_API_URL
        self.text_model = AI_TEXT_MODEL
        self.vision_model = AI_VISION_MODEL

        self.QUICK_INSERT_TIMEOUT = AI_QUICK_INSERT_TIMEOUT
        self.SCAN_RECEIPT_TIMEOUT = AI_SCAN_RECEIPT_TIMEOUT

    def _format_categories(self, categories: List[Dict[str, Any]]) -> str:
        simplified_categories = [
            {"id": str(c["id"]), "name": c["name"], "type": c["type"], "description": c.get("description", "")}
            for c in categories
        ]
        return json.dumps(simplified_categories, indent=2)

    async def _call_mistral_api(self, payload: Dict[str, Any], timeout: float) -> Dict[str, Any]:
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}

        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.api_url,
                headers=headers,
                json=payload,
                timeout=timeout,
            )

            if response.status_code != 200:
                raise RuntimeError(f"Mistral API error: {response.text}")

            result = response.json()
            content_str = result["choices"][0]["message"]["content"]
            return json.loads(content_str)

    async def quickInsert(self, text: str, categories: List[Dict[str, Any]]) -> Dict[str, Any]:
        categories_json = self._format_categories(categories)
        system_prompt = TEXT_PROMPT.format(categories_json=categories_json)

        payload = {
            "model": self.text_model,
            "messages": [{"role": "system", "content": system_prompt}, {"role": "user", "content": text}],
            "response_format": {"type": "json_object"},
        }

        return await self._call_mistral_api(payload, timeout=self.QUICK_INSERT_TIMEOUT)

    async def scanReceipt(self, image_bytes: bytes, categories: List[Dict[str, Any]]) -> Dict[str, Any]:
        categories_json = self._format_categories(categories)
        base64_image = base64.b64encode(image_bytes).decode("utf-8")
        system_prompt = VISION_PROMPT.format(categories_json=categories_json)

        payload = {
            "model": self.vision_model,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": system_prompt},
                        {"type": "image_url", "image_url": f"data:image/jpeg;base64,{base64_image}"},
                    ],
                }
            ],
            "response_format": {"type": "json_object"},
        }

        return await self._call_mistral_api(payload, timeout=self.SCAN_RECEIPT_TIMEOUT)
