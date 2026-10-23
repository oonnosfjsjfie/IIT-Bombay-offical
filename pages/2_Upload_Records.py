import streamlit as st
import pymupdf

st.set_page_config(page_title="Neutrix | Upload Records", page_icon="📄")

st.title("Upload Discharge Summary")

uploaded_file = st.file_uploader("Upload discharge summary (PDF)", type=["pdf"])

if uploaded_file is not None:
    if st.button("Extract Text"):
        with pymupdf.open(stream=uploaded_file.getvalue(), filetype="pdf") as doc:
            text = "\n\n".join(page.get_text() for page in doc)
            
        st.subheader("Extracted Text")
        st.text_area("Document Text", text[:5000], height=400)
        
        # Save text globally to session state
        st.session_state['discharge_text'] = text
        st.success("Text successfully saved and shared with your Medicine Plan!")
        
        st.download_button(
            label="Download Extracted Text",
            data=text,
            file_name="extracted_text.txt",
            mime="text/plain"
        )

st.info(
    "Neutrix organizes and explains medical information. "
    "It does not diagnose, prescribe, or replace advice "
    "from a qualified doctor."
)