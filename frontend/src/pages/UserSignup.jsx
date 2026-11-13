import { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { UserDataContext } from '../context/UserContext'
import PhoneNumberInput from '../components/PhoneNumberInput'
import BrandLogo from '../components/BrandLogo'
import { autoVehicleOptions, carVehicleOptions, truckVehicleOptions } from '../constants/vehicleOptions'
import { getSignupErrorMessage } from '../utils/getSignupErrorMessage'

const UserSignup = () => {
  const [ countryCode, setCountryCode ] = useState('+91')
  const [ mobileNumber, setMobileNumber ] = useState('')
  const [ alternateCountryCode, setAlternateCountryCode ] = useState('+91')
  const [ alternateMobileNumber, setAlternateMobileNumber ] = useState('')
  const [ password, setPassword ] = useState('')
  const [ firstName, setFirstName ] = useState('')
  const [ lastName, setLastName ] = useState('')
  const [ vehicleType, setVehicleType ] = useState('')
  const [carCategory, setCarCategory] = useState('')
  const [carModel, setCarModel] = useState('')
  const [autoCategory, setAutoCategory] = useState('')
  const [autoModel, setAutoModel] = useState('')
  const [truckCategory, setTruckCategory] = useState('')
  const [ truckModel, setTruckModel ] = useState('')
  const [ documents, setDocuments ] = useState({})
  const [signupError, setSignupError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const documentFields = vehicleType === 'truck'
    ? [
      { field: 'rcImage', label: 'RC Book / RC Card', required: true },
      { field: 'drivingLicenceImage', label: 'Driving Licence (correct vehicle category)', required: true },
      { field: 'insuranceImage', label: 'Commercial vehicle insurance', required: true },
      { field: 'pucImage', label: 'PUC certificate', required: true },
      { field: 'fitnessImage', label: 'Fitness certificate', required: false },
      { field: 'roadTaxImage', label: 'Road tax / tax receipt', required: false },
      { field: 'nationalPermitImage', label: 'National / state permit', required: false },
      { field: 'goodsCarriagePermitImage', label: 'Goods Carriage Permit', required: false },
      { field: 'loadChallanImage', label: 'Load Challan / Bilty', required: false },
      { field: 'eWayBillImage', label: 'E-Way Bill', required: false },
    ]
    : [
      { field: 'rcImage', label: 'RC (Registration Certificate)', required: true },
      { field: 'drivingLicenceImage', label: 'Driving Licence (DL)', required: true },
      { field: 'insuranceImage', label: 'Valid vehicle insurance', required: true },
      { field: 'pucImage', label: 'PUC certificate', required: true },
      { field: 'fitnessImage', label: 'Fitness certificate (if applicable)', required: false },
      { field: 'roadTaxImage', label: 'Road tax / tax receipt (if applicable)', required: false },
    ]

  const navigate = useNavigate()

  const { setUser } = useContext(UserDataContext)

  const submitHandler = async (e) => {
    e.preventDefault()
    setSignupError('')
    setIsSubmitting(true)

    try {
      const newUser = new FormData()
      newUser.append('fullname[firstname]', firstName)
      newUser.append('fullname[lastname]', lastName)
      newUser.append('phone', `${countryCode}${mobileNumber}`)
      if (alternateMobileNumber) {
        newUser.append('alternatePhone', `${alternateCountryCode}${alternateMobileNumber}`)
      }
      newUser.append('password', password)
      newUser.append('vehicleType', vehicleType)
      if (vehicleType === 'car') {
        newUser.append('carCategory', carCategory)
        newUser.append('carModel', carModel)
      }
      if (vehicleType === 'auto') {
        newUser.append('autoCategory', autoCategory)
        newUser.append('autoModel', autoModel)
      }
      if (vehicleType === 'truck') {
        newUser.append('truckCategory', truckCategory)
        newUser.append('truckModel', truckModel)
      }
      for (const [field, image] of Object.entries(documents)) {
        if (image) newUser.append(field, image)
      }

      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/users/register`, newUser)
      if (response.status !== 201) {
        setSignupError(response.data?.message || 'Account could not be created. Please try again.')
        return
      }

      const data = response.data
      setUser(data.user)
      localStorage.setItem('token', data.token)
      navigate('/home')

      setMobileNumber('')
      setAlternateMobileNumber('')
      setFirstName('')
      setLastName('')
      setPassword('')
    } catch (error) {
      setSignupError(getSignupErrorMessage(error, 'en'))
    } finally {
      setIsSubmitting(false)
    }

  }
  return (
    <main className='auth-page'>
      <section className='auth-card auth-card--signup flex flex-col justify-between'>
        <div>
          <BrandLogo />
          <h1>Motor-Owner Account Create</h1>
          <p className="auth-subtitle">A few details and you will be ready to ride.</p>

          {signupError && (
            <div
              className='mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800 shadow-sm'
              role='alert'
              aria-live='assertive'
            >
              <span className='mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100'>
                <i className='ri-error-warning-line text-lg' aria-hidden='true' />
              </span>
              <div>
                <p className='font-semibold'>Account could not be created</p>
                <p className='mt-1 text-sm leading-5'>{signupError}</p>
              </div>
            </div>
          )}

          <form onSubmit={submitHandler}>

            <h3 className='text-lg w-1/2  font-medium mb-2'>What is your name</h3>
            <div className='flex gap-4 mb-7'>
              <input
                required
                className='bg-[#eeeeee] w-1/2 rounded-lg px-4 py-2 border  text-lg placeholder:text-base'
                type="text"
                placeholder='First name'
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value)
                }}
              />
              <input
                required
                className='bg-[#eeeeee] w-1/2  rounded-lg px-4 py-2 border  text-lg placeholder:text-base'
                type="text"
                placeholder='Last name'
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value)
                }}
              />
            </div>

            <h3 className='text-lg font-medium mb-2'>What is your mobile number?</h3>
            <PhoneNumberInput
              countryCode={countryCode}
              mobileNumber={mobileNumber}
              onCountryCodeChange={setCountryCode}
              onMobileNumberChange={setMobileNumber}
            />

            <h3 className='text-lg font-medium mb-2'>Enter Password</h3>

            <input
              className='bg-[#eeeeee] mb-7 rounded-lg px-4 py-2 border w-full text-lg placeholder:text-base'
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
              }}
              required type="password"
              placeholder='password'
            />

            <h3 className='text-lg font-medium mb-2'>Alternate mobile number (optional)</h3>
            <PhoneNumberInput
              countryCode={alternateCountryCode}
              mobileNumber={alternateMobileNumber}
              onCountryCodeChange={setAlternateCountryCode}
              onMobileNumberChange={setAlternateMobileNumber}
              required={false}
            />

            <h3 className='text-lg font-medium mb-2'>Owner documents</h3>
            <p className='mb-4 text-xs text-gray-500'>
              Upload clear JPEG, PNG, or WebP images. Each file must be 5 MB or smaller.
            </p>
            <div className='mb-7 grid gap-4 sm:grid-cols-2'>
              {[
                { field: 'ownerAadhaarImage', label: 'Owner Aadhaar card', required: true },
                { field: 'ownerPanImage', label: 'Owner PAN card', required: true },
                { field: 'permitCertificateImage', label: 'Permit Certificate', required: true },
              ].map(({ field, label, required }) => (
                <label className='block text-sm font-medium' key={field}>
                  {label}
                  <input
                    required={required}
                    className='mt-2 block w-full rounded-lg border bg-[#eeeeee] px-3 py-2 text-sm'
                    type='file'
                    accept='image/jpeg,image/png,image/webp'
                    onChange={(event) => {
                      setDocuments((current) => ({
                        ...current,
                        [field]: event.target.files?.[0] || null,
                      }))
                    }}
                  />
                </label>
              ))}
            </div>

            <h3 className='text-lg font-medium mb-2'>Vehicle type</h3>
            <select
              className='bg-[#eeeeee] mb-7 rounded-lg px-4 py-2 border w-full text-lg'
              value={vehicleType}
              onChange={(e) => {
                setVehicleType(e.target.value)
                setCarCategory('')
                setCarModel('')
                setAutoCategory('')
                setAutoModel('')
                setTruckCategory('')
                setTruckModel('')
                setDocuments((current) => {
                  const {
                    ownerAadhaarImage,
                    ownerPanImage,
                    permitCertificateImage,
                  } = current
                  return { ownerAadhaarImage, ownerPanImage, permitCertificateImage }
                })
              }}
              required
            >
              <option value='' disabled>Select your vehicle type</option>
              <option value='car'>Car</option>
              <option value='auto'>Auto</option>
              <option value='truck'>Truck</option>
            </select>

            {vehicleType === 'car' && (
              <>
                <h3 className='text-lg font-medium mb-2'>Car category</h3>
                <select
                  className='bg-[#eeeeee] mb-7 rounded-lg px-4 py-2 border w-full text-lg'
                  value={carCategory}
                  onChange={(event) => {
                    setCarCategory(event.target.value)
                    setCarModel('')
                  }}
                  required
                >
                  <option value='' disabled>Select a car category</option>
                  {Object.keys(carVehicleOptions).map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>

                {carCategory && (
                  <>
                    <h3 className='text-lg font-medium mb-2'>Car model</h3>
                    <select
                      className='bg-[#eeeeee] mb-7 rounded-lg px-4 py-2 border w-full text-lg'
                      value={carModel}
                      onChange={(event) => setCarModel(event.target.value)}
                      required
                    >
                      <option value='' disabled>Select your car model</option>
                      {carVehicleOptions[carCategory].map((model) => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                  </>
                )}
              </>
            )}

            {vehicleType === 'auto' && (
              <>
                <h3 className='text-lg font-medium mb-2'>Auto category</h3>
                <select
                  className='bg-[#eeeeee] mb-7 rounded-lg px-4 py-2 border w-full text-lg'
                  value={autoCategory}
                  onChange={(event) => {
                    setAutoCategory(event.target.value)
                    setAutoModel('')
                  }}
                  required
                >
                  <option value='' disabled>Select an auto category</option>
                  {Object.keys(autoVehicleOptions).map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>

                {autoCategory && (
                  <>
                    <h3 className='text-lg font-medium mb-2'>Auto model</h3>
                    <select
                      className='bg-[#eeeeee] mb-7 rounded-lg px-4 py-2 border w-full text-lg'
                      value={autoModel}
                      onChange={(event) => setAutoModel(event.target.value)}
                      required
                    >
                      <option value='' disabled>Select your auto model</option>
                      {autoVehicleOptions[autoCategory].map((model) => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                  </>
                )}
              </>
            )}

            {vehicleType === 'truck' && (
              <>
                <h3 className='text-lg font-medium mb-2'>Truck category</h3>
                <select
                  className='bg-[#eeeeee] mb-7 rounded-lg px-4 py-2 border w-full text-lg'
                  value={truckCategory}
                  onChange={(event) => {
                    setTruckCategory(event.target.value)
                    setTruckModel('')
                  }}
                  required
                >
                  <option value='' disabled>Select a truck category</option>
                  {Object.keys(truckVehicleOptions).map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>

                {truckCategory && (
                  <>
                    <h3 className='text-lg font-medium mb-2'>Truck model</h3>
                    <select
                      className='bg-[#eeeeee] mb-7 rounded-lg px-4 py-2 border w-full text-lg'
                      value={truckModel}
                      onChange={(event) => setTruckModel(event.target.value)}
                      required
                    >
                      <option value='' disabled>Select your truck model</option>
                      {truckVehicleOptions[truckCategory].map((model) => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                  </>
                )}
              </>
            )}

            {vehicleType && (
              <div className='mb-7 overflow-hidden rounded-xl border border-orange-100 bg-orange-50'>
                <img
                  className='h-40 w-full object-contain px-4 py-2'
                  src={vehicleType === 'truck'
                    ? `${import.meta.env.BASE_URL}owner-mountain-truck-drive.gif`
                    : vehicleType === 'auto'
                      ? `${import.meta.env.BASE_URL}captain-city-auto-drive.gif`
                      : `${import.meta.env.BASE_URL}captain-forest-drive.gif`}
                  alt={vehicleType === 'truck'
                    ? 'Punjabi-style decorated truck, front view'
                    : vehicleType === 'auto' ? 'Auto-rickshaw driving through a city' : 'Car driving on a forest road'}
                />
                {vehicleType !== 'auto' && (
                  <p className='pb-3 text-center text-sm font-medium text-gray-700'>
                    {vehicleType === 'truck' ? 'Punjabi truck · front view' : 'Car · forest road'}
                  </p>
                )}
              </div>
            )}

            {vehicleType && (
              <>
                <h3 className='text-lg font-medium mb-2'>
                  {vehicleType === 'truck'
                    ? 'Truck documents'
                    : vehicleType === 'auto' ? 'Auto documents' : 'Car documents'}
                </h3>
                <p className='mb-4 text-xs text-gray-500'>
                  Upload clear JPEG, PNG, or WebP images. Each file must be 5 MB or smaller.
                  {vehicleType === 'truck' && ' Truck permits, load challan, and E-Way Bill are optional.'}
                </p>
                <div className='mb-7 grid gap-4 sm:grid-cols-2'>
                  {documentFields.map(({ field, label, required }) => (
                    <label className='block text-sm font-medium' key={field}>
                      {label}
                      {!required && <span className='ml-1 font-normal text-gray-500'>(optional)</span>}
                      <input
                        required={required}
                        className='mt-2 block w-full rounded-lg border bg-[#eeeeee] px-3 py-2 text-sm'
                        type='file'
                        accept='image/jpeg,image/png,image/webp'
                        onChange={(e) => {
                          setDocuments((current) => ({
                            ...current,
                            [field]: e.target.files?.[0] || null,
                          }))
                        }}
                      />
                    </label>
                  ))}
                </div>
              </>
            )}

            <button
              type='submit'
              disabled={isSubmitting}
              className='bg-[#111] text-white font-semibold mb-3 rounded-lg px-4 py-2 w-full text-lg placeholder:text-base disabled:cursor-not-allowed disabled:opacity-70'
            >
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </button>

          </form>
          <p className='text-center'>Already have a account? <Link to='/owner-login' className='text-blue-600'>Login here</Link></p>
        </div>
        <div>
          <p className='text-[10px] leading-tight'>This site is protected by reCAPTCHA and the <span className='underline'>Google Privacy
            Policy</span> and <span className='underline'>Terms of Service apply</span>.</p>
        </div>
      </section>
    </main >
  )
}

export default UserSignup