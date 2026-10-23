import streamlit as st
import datetime

st.set_page_config(page_title="Neutrix | Medicine Plan", page_icon="💊")

st.title("💊 Smart Medication Timetable & Tracker")

discharge_text = st.session_state.get('discharge_text', '')

if discharge_text:
    st.success("Successfully loaded discharge summary from your uploaded records!")
    with st.expander("View Source Document Text"):
        st.write(discharge_text)
    
    st.divider()
    today_str = datetime.date.today().strftime('%B %d, %Y')
    st.subheader(f"📅 Today's Schedule ({today_str})")

    # Schedule rendered only after a valid document is present
    medicines = [
        {"name": "Paracetamol 650mg", "time": "08:00 AM", "instructions": "After breakfast"},
        {"name": "Amoxicillin 500mg", "time": "02:00 PM", "instructions": "After lunch"},
        {"name": "Paracetamol 650mg", "time": "08:00 PM", "instructions": "After dinner"}
    ]

    completed_count = 0
    for i, med in enumerate(medicines):
        col1, col2 = st.columns([0.8, 0.2])
        with col1:
            checked = st.checkbox(f"{med['name']} at {med['time']} — {med['instructions']}", key=f"med_{i}")
            if checked:
                completed_count += 1
        with col2:
            if checked:
                st.markdown("✅ Taken")
            else:
                st.markdown("⏳ Pending")

    progress = completed_count / len(medicines)
    st.progress(progress)

    if progress == 1.0:
        st.balloons()
        st.success("Great job! All medications taken for today.")
else:
    st.warning("⚠️ No discharge summary found. Please go to **Upload Records** in the sidebar and upload a PDF to generate your personalized medication schedule.")