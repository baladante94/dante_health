frappe.ui.form.on("Practitioner Schedule", {
	refresh: function (frm) {
		toggle_add_buttons(frm);
	},
	custom_include_breaks: function (frm) {
		toggle_add_buttons(frm);
	},
});

function toggle_add_buttons(frm) {
	let grid = cur_frm.fields_dict["time_slots"].grid;

	if (frm.doc.custom_include_breaks) {
		grid.wrapper.find('button:contains("Add Time Slots")').hide();

		if (grid.wrapper.find('button:contains("Add Slots with Breaks")').length === 0) {
			grid.add_custom_button(__("Add Slots with Breaks"), () => {
				launch_break_aware_dialog(frm);
			});
		} else {
			grid.wrapper.find('button:contains("Add Slots with Breaks")').show();
		}
	} else {
		grid.wrapper.find('button:contains("Add Time Slots")').show();
		grid.wrapper.find('button:contains("Add Slots with Breaks")').hide();
	}
}

function launch_break_aware_dialog(frm) {
	let d = new frappe.ui.Dialog({
		title: __("Add Time Slots"),
		fields: [
			{
				fieldname: "days",
				label: __("Select Days"),
				fieldtype: "MultiSelect",
				options: [
					{ value: "Sunday", label: __("Sunday") },
					{ value: "Monday", label: __("Monday") },
					{ value: "Tuesday", label: __("Tuesday") },
					{ value: "Wednesday", label: __("Wednesday") },
					{ value: "Thursday", label: __("Thursday") },
					{ value: "Friday", label: __("Friday") },
					{ value: "Saturday", label: __("Saturday") },
				],
				reqd: 1,
			},
			{
				fieldname: "from_time",
				label: __("From"),
				fieldtype: "Time",
				default: "09:00:00",
				reqd: 1,
			},
			{
				fieldname: "to_time",
				label: __("To"),
				fieldtype: "Time",
				default: "20:00:00",
				reqd: 1,
			},
			{
				fieldname: "duration",
				label: __("Slot Duration (mins)"),
				fieldtype: "Int",
				default: 15,
				reqd: 1,
			},
			{
				fieldname: "break_info",
				label: __("Gap Between Slots"),
				fieldtype: "Data",
				default: (frm.doc.custom_break_duration || 0) + " mins",
				read_only: 1,
			},
			{
				fieldname: "sec_break_2",
				fieldtype: "Section Break",
				label: "Lunch / Break Configuration",
			},
			{
				fieldname: "has_lunch",
				label: __("Add Lunch Break"),
				fieldtype: "Check",
				default: 0,
			},
			{
				fieldname: "lunch_start",
				label: __("Lunch Start"),
				fieldtype: "Time",
				default: "13:00:00",
				depends_on: "eval:doc.has_lunch == 1", // Hide if unchecked
				mandatory_depends_on: "eval:doc.has_lunch == 1",
			},
			{
				fieldname: "lunch_end",
				label: __("Lunch End"),
				fieldtype: "Time",
				default: "14:00:00",
				depends_on: "eval:doc.has_lunch == 1",
				mandatory_depends_on: "eval:doc.has_lunch == 1",
			},
		],
		primary_action_label: __("Generate"),
		primary_action: () => {
			let values = d.get_values();
			if (values) {
				let gap_mins = frm.doc.custom_break_duration || 0;
				let slot_added = false;

				// 1. Prepare Lunch Times (if applicable)
				let lunch_start_mom = null;
				let lunch_end_mom = null;
				if (values.has_lunch && values.lunch_start && values.lunch_end) {
					lunch_start_mom = moment(values.lunch_start, "HH:mm:ss");
					lunch_end_mom = moment(values.lunch_end, "HH:mm:ss");

					// Validation: Foolproof check
					if (lunch_start_mom >= lunch_end_mom) {
						frappe.msgprint(__("Lunch Start Time must be before Lunch End Time"));
						return;
					}
				}

				values.days.split(",").forEach(function (day) {
					day = $.trim(day);
					if (
						[
							"Sunday",
							"Monday",
							"Tuesday",
							"Wednesday",
							"Thursday",
							"Friday",
							"Saturday",
						].includes(day)
					) {
						let cur_time = moment(values.from_time, "HH:mm:ss");
						let end_time = moment(values.to_time, "HH:mm:ss");

						// 2. The Loop
						while (cur_time < end_time) {
							// Calculate where this slot WOULD end
							let slot_end_time = cur_time.clone().add(values.duration, "minutes");

							// 3. The "Lunch Trap" Check
							let is_lunch_conflict = false;

							if (lunch_start_mom && lunch_end_mom) {
								// Conflict Logic:
								// If the slot ends AFTER lunch starts AND starts BEFORE lunch ends
								// This catches any partial or full overlap
								if (slot_end_time > lunch_start_mom && cur_time < lunch_end_mom) {
									is_lunch_conflict = true;

									// SMART JUMP: Don't just skip 15 mins.
									// Jump straight to the end of lunch!
									// This prevents "dead zones" and makes the schedule tight.
									cur_time = lunch_end_mom.clone();
									continue; // Restart loop at 14:00 (or whatever lunch end is)
								}
							}

							// 4. Add Slot (if no conflict and within shift limits)
							if (!is_lunch_conflict && slot_end_time <= end_time) {
								frm.add_child("time_slots", {
									day: day,
									from_time: cur_time.format("HH:mm:ss"),
									to_time: slot_end_time.format("HH:mm:ss"),
								});
								slot_added = true;

								// Advance time: Slot Duration + Small Gap
								cur_time = slot_end_time.add(gap_mins, "minutes");
							} else if (!is_lunch_conflict) {
								// If we are here, it means we hit the end of the shift (20:00)
								// just break the loop
								break;
							}
						}
					}
				});

				frm.refresh_field("time_slots");
				d.hide();

				if (slot_added) {
					frappe.show_alert({
						message: __("Slots generated successfully"),
						indicator: "green",
					});
				} else {
					frappe.msgprint(__("No slots could be generated. Check your time ranges."));
				}
			}
		},
	});

	d.show();
}
