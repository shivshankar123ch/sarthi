export const getSignupErrorMessage = (error) => {
  const data = error?.response?.data
  const serverMessage = typeof data?.message === 'string' ? data.message : ''
  const validationMessages = Array.isArray(data?.errors)
    ? data.errors.map((item) => item?.msg).filter(Boolean).join(' ')
    : ''

  return serverMessage ||
    validationMessages ||
    (!error?.response
      ? 'Server se connection nahi ho paaya. Internet connection check karke dobara koshish karein.'
      : error.response.status >= 500
        ? 'Server abhi unavailable hai. Thodi der baad dobara koshish karein.'
        : 'Account create nahi ho paya. Details check karke dobara koshish karein.')
}
