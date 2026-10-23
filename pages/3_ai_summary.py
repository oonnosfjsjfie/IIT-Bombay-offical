import streamlit as st
import fitz  # PyMuPDF

st.set_page_config(
    page_title="Neutrix | AI Summary",
    page_icon="🧠",
    layout="centered"
)

st.title("🧠 AI Discharge Summary")
st.caption("Upload your discharge summary and get a simple explanation.")

uploaded_file = st.file_uploader(
    "Upload Discharge Summary or Prescription",
    type=["pdf"]
)

language = st.selectbox(
    "Choose Language",
    ["English", "Malayalam"]
)

if uploaded_file is not None:
    st.success("File uploaded successfully.")

    if st.button("Explain My Report"):
        with st.spinner("Reading your document..."):
            pdf_text = ""

            with fitz.open(stream=uploaded_file.read(), filetype="pdf") as doc:
                for page in doc:
                    pdf_text += page.get_text()

        st.subheader("Extracted Text")
        st.text_area("Document Text", pdf_text[:3000], height=300)

        st.info(
            "AI explanation will be added after connecting Gemini/OpenAI API."
        )

        st.warning(
            "Neutrix organizes and explains medical information. "
            "It does not diagnose, prescribe, or replace advice "
            "from a qualified doctor."
        )
else:
    st.info("Please upload a PDF file.")