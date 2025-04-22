// Utility to help manage donor profiles

// Store the manually specified donor ID in localStorage
export function setManualDonorId(donorId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('manualDonorId', donorId);
  }
}

// Get the manually specified donor ID from localStorage
export function getManualDonorId(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('manualDonorId');
  }
  return null;
}

// Clear the manually specified donor ID from localStorage
export function clearManualDonorId(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('manualDonorId');
  }
}

// Map of emails to donor IDs for specific users that are having issues
const emailToDonorIdMap: Record<string, string> = {
  'an459@snu.edu.in': 'DONOR_ID_HERE', // Replace with the actual donor ID
};

// Get a donor ID for a specific email if it exists in our manual mapping
export function getDonorIdForEmail(email: string): string | null {
  if (!email) return null;
  
  const lowercaseEmail = email.toLowerCase();
  return emailToDonorIdMap[lowercaseEmail] || null;
} 