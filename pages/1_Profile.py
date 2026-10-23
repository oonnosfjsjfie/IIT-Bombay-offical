import streamlit as st

st.set_page_config(
    page_title="Neutrix | Profile",
    page_icon="🩺",
    layout="centered"
)

st.title("🩺 Neutrix Profile")
st.caption("Create the patient and caregiver profile.")

with st.form("profile_form"):
    st.subheader("Patient Details")

    patient_name = st.text_input("Patient Name")
    age = st.number_input("Age", min_value=1, max_value=120, value=25)
    gender = st.selectbox("Gender", ["Male", "Female", "Other"])

    blood_group = st.selectbox(
        "Blood Group",
        ["Select", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
    )

    conditions = st.multiselect(
        "Known Medical Conditions",
        [
            "Diabetes",
            "High Blood Pressure",
            "Asthma",
            "Heart Disease",
            "Thyroid Problem",
            "Kidney Disease",
            "None"
        ]
    )

    allergies = st.text_area("Allergies")
    current_medicines = st.text_area("Current Medicines")

    st.subheader("Caregiver Details")

    caregiver_name = st.text_input("Caregiver Name")
    caregiver_phone = st.text_input("Caregiver Phone Number")

    language = st.selectbox(
        "Preferred Language",
        ["English", "Malayalam"]
    )

    submitted = st.form_submit_button("Save Profile")

if submitted:
    if patient_name == "" or caregiver_name == "":
        st.warning("Please enter both patient name and caregiver name.")
    else:
        st.success("Profile saved successfully!")

        st.write("### Patient Profile")
        st.write(f"**Name:** {patient_name}")
        st.write(f"**Age:** {age}")
        st.write(f"**Gender:** {gender}")
        st.write(f"**Blood Group:** {blood_group}")
        st.write(f"**Conditions:** {', '.join(conditions)}")
        st.write(f"**Allergies:** {allergies}")
        st.write(f"**Current Medicines:** {current_medicines}")
        st.write(f"**Caregiver:** {caregiver_name}")
        st.write(f"**Caregiver Phone:** {caregiver_phone}")
        st.write(f"**Language:** {language}")

        st.info(
            "Neutrix organizes and explains medical information. "
            "It does not diagnose, prescribe, or replace advice "
            "from a qualified doctor."
        )
