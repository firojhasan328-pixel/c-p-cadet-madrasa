export function generateFormNumber() {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `CPCM-${year}-${random}`;
}

export function formatFormNumber(formNumber) {
  if (!formNumber) return '';
  return formNumber;
}

export function validateFormNumber(formNumber) {
  const pattern = /^CPCM-\d{4}-\d{4}$/;
  return pattern.test(formNumber);
}
