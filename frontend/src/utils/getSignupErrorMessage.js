export const getSignupErrorMessage = (error, language = 'hi') => {
  const data = error?.response?.data
  const serverMessage = typeof data?.message === 'string' ? data.message : ''
  const validationMessages = Array.isArray(data?.errors)
    ? data.errors.map((item) => item?.msg).filter(Boolean).join(' ')
    : ''
  const messages = language === 'en'
    ? {
      network: 'Network issue. Please check your connection and try again.',
      server: 'The server is temporarily unavailable. Please try again later.',
      details: 'Account could not be created. Please check your details and try again.',
    }
    : {
      network: 'Server se connection nahi ho paaya. Internet connection check karke dobara koshish karein.',
      server: 'Server abhi unavailable hai. Thodi der baad dobara koshish karein.',
      details: 'Account create nahi ho paya. Details check karke dobara koshish karein.',
    }

  return serverMessage ||
    validationMessages ||
    (!error?.response
      ? messages.network
      : error.response.status >= 500
        ? messages.server
        : messages.details)
}
