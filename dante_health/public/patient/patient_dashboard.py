import frappe
from frappe import _

def get_dashboard_data(data=None):
    patient_name = frappe.form_dict.get("name")

    # Fetch appointments where patient is either primary or secondary
    primary_appointments = frappe.get_all("Patient Appointment", filters={"patient": patient_name}, fields=["name"])
    secondary_appointments = frappe.get_all("Patient Appointment", filters={"custom_patient_2": patient_name}, fields=["name"])

    # Combine and deduplicate
    all_appointments = {appt.name for appt in primary_appointments + secondary_appointments}

    return {
        "fieldname": "name",  # This is the Patient name
        "non_standard_fieldnames": {
            "Patient Appointment": "custom_patient_2",  # Ensures secondary links are recognized
        },
        "transactions": [
            {
                "label": _("Appointments and Encounters"),
                "items": [
                    {
                        "doctype": "Patient Appointment",
                        "count": len(all_appointments),
                        "route": f"/app/patient-appointment?patient={patient_name}"
                    },
                    {"doctype": "Vital Signs"},
                    {"doctype": "Patient Encounter"},
                ],
            },
        ],
    }
