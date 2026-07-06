export const leadStatus = ['New', 'Assigned', 'Contacted', 'Interested', 'Follow-up', 'Site Visit', 'Visited', 'Negotiation', 'Invoice', 'Booked', 'Lost', 'Not Interested'];
export const leadPriority = ['Cold', 'Warm', 'Hot'];
export const leadSource = ['Facebook', 'WhatsApp', 'Website', 'Phone Call', 'Walk-in', 'Referral', 'Signboard', 'Event', 'Agent', 'Manual', 'Other'];
export const projectStatus = ['Upcoming', 'Ongoing', 'Ready', 'Completed', 'Sold Out', 'Paused'];
export const unitStatus = ['Available', 'Reserved', 'Booked', 'Sold', 'Hold', 'Cancelled'];
export const paymentStatus = ['Pending', 'Approved', 'Rejected'];
export const invoiceStatus = ['Draft', 'Generated', 'Sent', 'Partial', 'Paid', 'Cancelled', 'Expired'];
export const commissionStatus = ['Pending', 'Approved', 'Rejected', 'Paid', 'Hold'];

export function label(list: string[], value: number | undefined | null) {
  return value === null || value === undefined ? '-' : list[value] ?? String(value);
}

export function money(value: number | undefined | null) {
  return new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(value ?? 0);
}
