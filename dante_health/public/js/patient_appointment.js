frappe.ui.form.on('Patient Appointment', {
  patient: function(frm) {
    if (frm.doc.patient) {
      frappe.call({
        method: 'frappe.client.get',
        args: {
          doctype: 'Patient',
          name: frm.doc.patient
        },
        callback: function(r) {
          if (r.message) {
            const relations = r.message.patient_relation || [];
            const related_patients = relations.map(rel => rel.patient);
            frm.set_query('custom_patient_2', () => {
              return {
                filters: [['name', 'in', related_patients]]
              };
            });
          }
        }
      });
    }
  }
});
