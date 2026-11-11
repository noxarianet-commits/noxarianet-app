export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value.trim());
}

export function isValidPassword(value: string) {
  return value.length >= 8;
}

export function isDigits(value: string) {
  return /^\d+$/.test(value.trim());
}

export function normalizeDigits(value: string) {
  return value.replace(/[^\d]/g, '');
}

export type FieldErrors = Record<string, string>;

export function validateLogin(input: { email: string; password: string }) {
  const errors: FieldErrors = {};
  if (!input.email.trim()) errors.email = 'Email wajib diisi.';
  else if (!isValidEmail(input.email)) errors.email = 'Format email tidak valid.';
  if (!input.password) errors.password = 'Password wajib diisi.';
  return errors;
}

export function validateRegister(input: {
  display_name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
}) {
  const errors: FieldErrors = {};
  if (!input.display_name.trim()) errors.display_name = 'Nama wajib diisi.';
  if (!input.email.trim()) errors.email = 'Email wajib diisi.';
  else if (!isValidEmail(input.email)) errors.email = 'Format email tidak valid.';
  if (!input.phone.trim()) errors.phone = 'Nomor WhatsApp wajib diisi.';
  else if (!/^(\+?62|0)8\d{7,12}$/.test(input.phone.replace(/[\s-]/g, ''))) {
    errors.phone = 'Masukkan nomor WhatsApp Indonesia yang valid.';
  }
  if (!input.password) errors.password = 'Password wajib diisi.';
  else if (!isValidPassword(input.password)) {
    errors.password = 'Password minimal 8 karakter.';
  }
  if (input.confirm_password !== input.password) {
    errors.confirm_password = 'Konfirmasi password tidak sama.';
  }
  return errors;
}

export function validatePasswordChange(input: {
  current_password: string;
  new_password: string;
  confirm_password: string;
}) {
  const errors: FieldErrors = {};
  if (!input.current_password) errors.current_password = 'Password saat ini wajib diisi.';
  if (!input.new_password) errors.new_password = 'Password baru wajib diisi.';
  else if (!isValidPassword(input.new_password)) {
    errors.new_password = 'Password minimal 8 karakter.';
  }
  if (input.confirm_password !== input.new_password) {
    errors.confirm_password = 'Konfirmasi password tidak sama.';
  }
  return errors;
}

export function hasErrors(errors: FieldErrors) {
  return Object.keys(errors).length > 0;
}
