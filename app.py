import streamlit as st

st.set_page_config(
    page_title="Neutrix",
    page_icon="⚡",
    layout="wide"
)

st.title("⚡ Neutrix")
st.caption("By Team Neutrinos")

st.subheader("Small signals. Clear recovery.")

st.write(
    """
    Neutrix helps patients and families move safely from
    hospital discharge to recovery at home.

    Upload a discharge summary, understand it in simple language,
    follow medicines, track recovery, and prepare for the next
    doctor visit.
    """
)

st.info(
    "Neutrix organizes and explains medical information. "
    "It does not diagnose, prescribe, or replace advice "
    "from a qualified doctor."
)

st.page_link("pages/1_Profile.py", label="Go to Profile")
st.page_link("pages/2_Upload_Records.py", label="Upload Records")
st.page_link("pages/3_AI_Summary.py", label="Go to AI Summary")
st.page_link("pages/4_Medicine_Plan.py", label="Go to Medicine Plan")
st.page_link("pages/5_Recovery_Tracker.py", label="Go to Recovery Tracker")