from pathlib import Path

# Suppose input can be either a file path (string or Path) or already bytes
input_file = "example.pdf"  # or Path("example.pdf")

# If input_file is a path, read it as bytes
if isinstance(input_file, (str, Path)):
    with open(input_file, "rb") as f:
        file = f.read()  # this is what your original code expects

# -------------------------
# Your original code below (unchanged)
import fitz

doc = fitz.open(stream=file, filetype="pdf")
text = "".join(page.get_text() for page in doc)
print(text)