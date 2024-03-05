import re

def clean_text(text):
    new_text = text.lower()
    new_text = new_text.replace("'", " ")
    new_text = re.sub(r'[^a-zA-Z0-9_\s]', '', new_text)
    new_text = new_text.replace(" ", "_")
    return new_text

