import streamlit as st

<<<<<<< Updated upstream
st.set_page_config(
    page_title="Neutrix | Recovery Tracker",
    page_icon="📈",
    layout="centered"
)

st.title("📈 Recovery Tracker")
st.caption("Record the patient’s daily recovery details.")

with st.form("recovery_form"):
    st.subheader("Today’s Readings")

    temperature = st.number_input("Temperature (°F)", min_value=90.0, max_value=110.0, value=98.6)
    blood_pressure = st.text_input("Blood Pressure (Example: 120/80)")
    blood_sugar = st.number_input("Blood Sugar (mg/dL)", min_value=0, max_value=600, value=100)
    weight = st.number_input("Weight (kg)", min_value=0.0, max_value=300.0, value=60.0)

    symptoms = st.text_area("New Symptoms")
    medicines_taken = st.radio(
        "Did the patient take today’s medicines?",
        ["Yes", "No", "Partially"]
    )

    submitted = st.form_submit_button("Save Recovery Details")

if submitted:
    st.success("Recovery details saved successfully.")

    st.write("### Today’s Recovery Summary")
    st.write(f"**Temperature:** {temperature} °F")
    st.write(f"**Blood Pressure:** {blood_pressure}")
    st.write(f"**Blood Sugar:** {blood_sugar} mg/dL")
    st.write(f"**Weight:** {weight} kg")
    st.write(f"**Symptoms:** {symptoms}")
    st.write(f"**Medicines Taken:** {medicines_taken}")

    st.info(
        "Neutrix organizes recovery information. "
        "It does not diagnose or replace advice from a qualified doctor."
    )
=======
st.set_page_config(page_title='Neutrix | Recovery Tracker', page_icon='??')
st.title('?? Recovery Tracker')
st.info('Bobby is building this page. Check back soon!')
>>>>>>> Stashed changes
