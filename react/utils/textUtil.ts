export const addressSplitter = (address: string) => {
  if (address === undefined || address.trim() === '') {
    return []
  }

  return address.split(',')
}
