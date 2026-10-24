import fitz  # PyMuPDF

def extract_pdf_content(file_bytes: bytes) -> str:
    """Helper service to read standard layout text streams from binary data documents."""
    text_buffer = ""
    try:
        with fitz.open(stream=file_bytes, filetype="pdf") as doc:
            for page in doc:
                text_buffer += page.get_text()
        return text_buffer
    except Exception as parse_error:
        return f"Extraction process failed: {str(parse_error)}"
