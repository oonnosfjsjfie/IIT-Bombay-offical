import streamlit as st

st.set_page_config(
    page_title="Neutrix | Warning Signs",
    page_icon="⚠️",
    layout="centered"
)

st.title("⚠️ Warning Signs")
st.caption("Enter any new symptoms. Neutrix will show when to seek medical help.")

symptom = st.text_area("Describe the symptom")

if st.button("Check Warning Signs"):
    danger_signs = [
        "chest pain",
        "difficulty breathing",
        "severe bleeding",
        "fainting",
        "unconscious",
        "severe stomach pain",
        "blood in stool",
        "high fever"
    ]


    if symptom == "":
        st.warning("Please enter a symptom.")
    else:
        lower_symptom = symptom.lower()

        if any(word in lower_symptom for word in danger_signs):
            st.error(
                "This may need urgent medical attention. "
                "Please contact your doctor or go to the nearest hospital."
            )
        else:
            st.warning(
                "Please monitor the symptom. "
                "If it becomes worse, contact your doctor."
            )

st.info(
            "Neutrix does not diagnose diseases. "
            "Please consult a qualified doctor for medical advice."
)
