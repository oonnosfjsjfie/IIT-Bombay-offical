import streamlit as st

st.set_page_config(
    page_title="Neutrix | Doctor Brief",
    page_icon="🧑‍⚕️",
    layout="centered"
)

st.title("🧑‍⚕️ Doctor Brief")
st.caption("Prepare a clear message for the patient’s doctor.")

with st.form("doctor_brief_form"):
    main_concern = st.text_area("Main Concern")
    new_symptoms = st.text_area("New Symptoms")
    medicines_status = st.radio(
        "Were medicines taken as advised?",
        ["Yes", "No", "Partially"]
    )
    questions = st.text_area("Questions for Doctor")

    submitted = st.form_submit_button("Create Doctor Message")

if submitted:
    doctor_message = f"""
Hello Doctor,

The patient was discharged recently.

Main concern:
{main_concern}

New symptoms:
{new_symptoms}

Medicines taken as advised:
{medicines_status}

Questions:
{questions}

Please advise whether we should continue the current care plan or schedule a visit.
"""

    st.subheader("Doctor Message")
    st.text_area("Copy this message", doctor_message, height=300)

    st.info(
        "Neutrix prepares communication for the doctor. "
        "It does not diagnose, prescribe, or replace medical advice."
    )
