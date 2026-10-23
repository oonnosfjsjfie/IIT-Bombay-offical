import streamlit as st

st.set_page_config(page_title="Neutrix | AI Summary", page_icon="🤖")

st.title("🤖 AI Discharge Summary")
st.info("Ajay's AI summary module is currently under development.")

text = st.session_state.get("discharge_text", "")

if text:
    st.text_area("Document received from Upload Records", text, height=300)
else:
    st.info("Upload a discharge summary first in 'Upload Records'.")