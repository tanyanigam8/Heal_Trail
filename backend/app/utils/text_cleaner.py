# ✅ app/utils/text_cleaner.py

import re

def clean_text(text: str) -> str:
    """
    Clean and normalize extracted text from PDFs.
    """
    if not text:
        return ""

    # Remove multiple spaces and newlines
    cleaned = re.sub(r'\s+', ' ', text)
    cleaned = cleaned.strip()
    return cleaned

# Alias for clarity in import
clean_extracted_text = clean_text

def clean_and_split_text(text: str) -> list[str]:
    """
    Clean the text and split it into sentences or bullet points for processing.
    """
    cleaned = clean_text(text)

    # Basic splitting on full stops or line breaks
    parts = re.split(r'\.|\n', cleaned)
    return [part.strip() for part in parts if part.strip()]
