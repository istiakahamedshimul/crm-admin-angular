export const leadStatus = ['New', 'Assigned', 'Contacted', 'Interested', 'Follow-up', 'Site Visit', 'Visited', 'Negotiation', 'Proposal', 'Booked', 'Lost', 'Not Interested'];
export const leadSource = ['Facebook', 'WhatsApp', 'Website', 'Phone Call', 'Walk-in', 'Referral', 'Signboard', 'Event', 'Agent', 'Manual', 'Other'];
export const projectStatus = ['Upcoming', 'Ongoing', 'Ready', 'Completed', 'Sold Out', 'Paused'];
export const projectType = ['Apartment', 'Flat', 'Plot', 'Land', 'Commercial Space', 'Shop', 'Office Space'];
export const unitStatus = ['Available', 'Reserved', 'Booked', 'Sold', 'Hold', 'Cancelled'];
export const paymentStatus = ['Pending', 'Approved', 'Rejected'];
export const commissionStatus = ['Pending', 'Approved', 'Rejected', 'Paid', 'Hold'];

export function label(list: string[], value: number | undefined | null) {
  return value === null || value === undefined ? '-' : list[value] ?? String(value);
}

export function money(value: number | undefined | null) {
  return new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(value ?? 0);
}
