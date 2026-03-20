export const formatPhoneNumber = (phoneNumber : string|null|undefined) => {
  return phoneNumber ? phoneNumber.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3') : ''
}
