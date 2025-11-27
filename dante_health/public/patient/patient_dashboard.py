from frappe import _

def get_data(data=None):
    return {
        "fieldname": "patient",

        "non_standard_fieldnames": {
            "Patient Appointment": "custom_patient_2",
        },

        "internal_link": {
            "Patient Appointment": ["patient", "custom_patient_2"]
        },

        "transactions": [
            {
                "label": _("Appointments"),
                "items": ["Patient Appointment"]
            }
        ]
    }
