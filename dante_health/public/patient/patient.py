# import frappe
# from frappe import _
# from healthcare.healthcare.doctype.patient.patient import Patient

# class CustomPatient(Patient):
#     def get_dashboard_data(self):
#         data = super().get_dashboard_data()

#         # Add appointments where this patient is in custom_patient_2
#         couple_appointments = frappe.get_all(
#             "Patient Appointment",
#             filters={"custom_patient_2": self.name}
#         )

#         if couple_appointments:
#             for section in data.get("transactions", []):
#                 if section.get("label") == "Appointments":
#                     # increment badge count
#                     if section["items"] and "badge" in section["items"][0]:
#                         section["items"][0]["badge"] += len(couple_appointments)
#                     else:
#                         section["items"][0]["badge"] = len(couple_appointments)

#         return data


# import frappe

# @frappe.whitelist()
# def search_patient(doctype, txt, searchfield, start, page_len, filters):
#     return frappe.db.sql("""
#         SELECT
#             name,
#             CONCAT(
#                 first_name,
#                 IF(mobile IS NOT NULL AND mobile!='', CONCAT(' — ', mobile), ''),
#                 IF(email IS NOT NULL AND email!='', CONCAT(' — ', email), '')
#             ) AS label
#         FROM `tabPatient`
#         WHERE
#             name LIKE %(txt)s
#             OR first_name LIKE %(txt)s
#             OR mobile LIKE %(txt)s
#             OR email LIKE %(txt)s
#         LIMIT %(page_len)s OFFSET %(start)s
#     """, {
#         "txt": f"%{txt}%",
#         "start": start,
#         "page_len": page_len
#     })


# @frappe.whitelist()
# def create_couple_relation(patient_1, use_existing=0, existing_patient=None,
#                            partner_name=None, partner_gender=None, relation=None):

#     use_existing = int(use_existing)

#     REVERSE_RELATION = {
#         "Father": "Family",
#         "Mother": "Family",
#         "Spouse": "Spouse",
#         "Siblings": "Siblings",
#         "Family": "Family",
#         "Other": "Other"
#     }

#     reverse_relation = REVERSE_RELATION.get(relation, "Other")

#     if use_existing:
#         if not existing_patient:
#             frappe.throw("Please select an existing patient.")
#         partner = existing_patient
#         created_new = False
#     else:
#         if not partner_name or not partner_gender:
#             frappe.throw("Partner Name and Gender are required for a new partner.")

#         partner = frappe.db.get_value("Patient",
#                                       {"first_name": partner_name}, "name")

#         if not partner:
#             partner_doc = frappe.get_doc({
#                 "doctype": "Patient",
#                 "first_name": partner_name,
#                 "sex": partner_gender
#             })
#             partner_doc.insert(ignore_permissions=True)
#             partner = partner_doc.name
#             created_new = True
#         else:
#             created_new = False

#     p1 = frappe.get_doc("Patient", patient_1)
#     if partner not in [x.patient for x in p1.patient_relation]:
#         p1.append("patient_relation", {"relation": relation, "patient": partner})
#         p1.save(ignore_permissions=True)

#     p2 = frappe.get_doc("Patient", partner)
#     if patient_1 not in [x.patient for x in p2.patient_relation]:
#         p2.append("patient_relation", {"relation": reverse_relation, "patient": patient_1})
#         p2.save(ignore_permissions=True)

#     if created_new:
#         frappe.msgprint(
#             f"New partner <b>{partner_name}</b> created and linked successfully!",
#             indicator="green"
#         )
#     else:
#         frappe.msgprint(
#             f"Existing patient <b>{partner}</b> linked successfully!",
#             indicator="green"
#         )

#     return {"partner": partner}