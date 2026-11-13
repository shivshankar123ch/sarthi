import { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { CaptainDataContext } from '../context/CapatainContext'
import PhoneNumberInput from '../components/PhoneNumberInput'
import BrandLogo from '../components/BrandLogo'
import { autoVehicleOptions, carVehicleOptions, truckVehicleOptions } from '../constants/vehicleOptions'
import { getSignupErrorMessage } from '../utils/getSignupErrorMessage'

const CaptainSignup = () => {
  const navigate = useNavigate()
  const { setCaptain } = useContext(CaptainDataContext)

  const [countryCode, setCountryCode] = useState('+91')
  const [mobileNumber, setMobileNumber] = useState('')
  const [alternateCountryCode, setAlternateCountryCode] = useState('+91')
  const [alternateMobileNumber, setAlternateMobileNumber] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [vehicleType, setVehicleType] = useState('')
  const [carCategory, setCarCategory] = useState('')
  const [carModel, setCarModel] = useState('')
  const [autoCategory, setAutoCategory] = useState('')
  const [autoModel, setAutoModel] = useState('')
  const [truckCategory, setTruckCategory] = useState('')
  const [truckModel, setTruckModel] = useState('')
  const [aadhaarImage, setAadhaarImage] = useState(null)
  const [panImage, setPanImage] = useState(null)
  const [drivingLicenceImage, setDrivingLicenceImage] = useState(null)
  const [policeVerificationImage, setPoliceVerificationImage] = useState(null)
  const [captainPhotoImage, setCaptainPhotoImage] = useState(null)
  const [signupError, setSignupError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submitHandler = async (event) => {
    event.preventDefault()
    setSignupError('')
    setIsSubmitting(true)

    try {
      const captainData = new FormData()
      captainData.append('fullname[firstname]', firstName)
      captainData.append('fullname[lastname]', lastName)
      captainData.append('phone', `${countryCode}${mobileNumber}`)
      if (alternateMobileNumber) {
        captainData.append('alternatePhone', `${alternateCountryCode}${alternateMobileNumber}`)
      }
      captainData.append('password', password)
      captainData.append('vehicle[vehicleType]', vehicleType)
      if (vehicleType === 'car') {
        captainData.append('vehicle[carCategory]', carCategory)
        captainData.append('vehicle[carModel]', carModel)
      }
      if (vehicleType === 'auto') {
        captainData.append('vehicle[autoCategory]', autoCategory)
        captainData.append('vehicle[autoModel]', autoModel)
      }
      if (vehicleType === 'truck') {
        captainData.append('vehicle[truckCategory]', truckCategory)
        captainData.append('vehicle[truckModel]', truckModel)
      }
      captainData.append('aadhaarImage', aadhaarImage)
      captainData.append('panImage', panImage)
      captainData.append('drivingLicenceImage', drivingLicenceImage)
      captainData.append('policeVerificationImage', policeVerificationImage)
      captainData.append('captainPhotoImage', captainPhotoImage)

      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/captains/register`, captainData)
      if (response.status !== 201) {
        setSignupError(response.data?.message || 'Account could not be created. Please try again.')
        return
      }

      const data = response.data
      setCaptain(data.captain)
      localStorage.setItem('token', data.token)
      navigate('/captain-home')

      setMobileNumber('')
      setAlternateMobileNumber('')
      setFirstName('')
      setLastName('')
      setPassword('')
      setVehicleType('')
      setCarCategory('')
      setCarModel('')
      setAutoCategory('')
      setAutoModel('')
      setTruckCategory('')
      setTruckModel('')
      setAadhaarImage(null)
      setPanImage(null)
      setDrivingLicenceImage(null)
      setPoliceVerificationImage(null)
      setCaptainPhotoImage(null)
    } catch (error) {
      setSignupError(getSignupErrorMessage(error, 'en'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      {signupError && (
        <div className="fixed inset-x-4 top-4 z-50 mx-auto w-full max-w-md" role="alert" aria-live="assertive">
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-white p-4 text-red-800 shadow-xl shadow-red-900/10">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50">
              <i className="ri-error-warning-line text-xl" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Captain account could not be created</p>
              <p className="mt-1 text-sm leading-5">{signupError}</p>
            </div>
            <button
              type="button"
              className="rounded-full p-1 text-red-500 transition hover:bg-red-50 hover:text-red-700"
              aria-label="Dismiss error message"
              onClick={() => setSignupError('')}
            >
              <i className="ri-close-line text-xl" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
      <section className="auth-card auth-card--signup">
        <BrandLogo />
        <h1>Join as a captain</h1>
        <p className="auth-subtitle">Share your details and get ready to drive.</p>

        <form onSubmit={submitHandler}>
          <h3 className="text-lg font-medium mb-2">What is the captain&apos;s name?</h3>
          <div className="flex gap-4 mb-7">
            <input
              required
              className="bg-[#eeeeee] w-1/2 rounded-lg px-4 py-2 border text-lg placeholder:text-base"
              type="text"
              placeholder="First name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
            />
            <input
              required
              className="bg-[#eeeeee] w-1/2 rounded-lg px-4 py-2 border text-lg placeholder:text-base"
              type="text"
              placeholder="Last name"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
            />
          </div>

          <h3 className="text-lg font-medium mb-2">Captain&apos;s mobile number</h3>
          <PhoneNumberInput
            countryCode={countryCode}
            mobileNumber={mobileNumber}
            onCountryCodeChange={setCountryCode}
            onMobileNumberChange={setMobileNumber}
          />

          <h3 className="text-lg font-medium mb-2">Alternate contact number (optional)</h3>
          <PhoneNumberInput
            countryCode={alternateCountryCode}
            mobileNumber={alternateMobileNumber}
            onCountryCodeChange={setAlternateCountryCode}
            onMobileNumberChange={setAlternateMobileNumber}
            required={false}
          />

          <h3 className="text-lg font-medium mb-2">Enter password</h3>
          <input
            className="bg-[#eeeeee] mb-7 rounded-lg px-4 py-2 border w-full text-lg placeholder:text-base"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            placeholder="Password"
          />

          <h3 className="text-lg font-medium mb-2">Vehicle information</h3>
          <label className="mb-7 block text-sm font-medium">
            Vehicle type
            <select
              className="mt-2 w-full rounded-lg border bg-[#eeeeee] px-4 py-2 text-lg"
              value={vehicleType}
              onChange={(event) => {
                setVehicleType(event.target.value)
                setCarCategory('')
                setCarModel('')
                setAutoCategory('')
                setAutoModel('')
                setTruckCategory('')
                setTruckModel('')
              }}
              required
            >
              <option value="" disabled>Select your vehicle type</option>
              <option value="car">Car</option>
              <option value="auto">Auto</option>
              <option value="truck">Truck</option>
            </select>
          </label>

          {vehicleType === 'car' && (
            <>
              <label className="mb-7 block text-sm font-medium">
                Car category
                <select
                  className="mt-2 w-full rounded-lg border bg-[#eeeeee] px-4 py-2 text-lg"
                  value={carCategory}
                  onChange={(event) => {
                    setCarCategory(event.target.value)
                    setCarModel('')
                  }}
                  required
                >
                  <option value="" disabled>Select a car category</option>
                  {Object.keys(carVehicleOptions).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </label>
              {carCategory && (
                <label className="mb-7 block text-sm font-medium">
                  Car model
                  <select
                    className="mt-2 w-full rounded-lg border bg-[#eeeeee] px-4 py-2 text-lg"
                    value={carModel}
                    onChange={(event) => setCarModel(event.target.value)}
                    required
                  >
                    <option value="" disabled>Select your car model</option>
                    {carVehicleOptions[carCategory].map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </label>
              )}
            </>
          )}

          {vehicleType === 'auto' && (
            <>
              <label className="mb-7 block text-sm font-medium">
                Auto category
                <select
                  className="mt-2 w-full rounded-lg border bg-[#eeeeee] px-4 py-2 text-lg"
                  value={autoCategory}
                  onChange={(event) => {
                    setAutoCategory(event.target.value)
                    setAutoModel('')
                  }}
                  required
                >
                  <option value="" disabled>Select an auto category</option>
                  {Object.keys(autoVehicleOptions).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </label>
              {autoCategory && (
                <label className="mb-7 block text-sm font-medium">
                  Auto model
                  <select
                    className="mt-2 w-full rounded-lg border bg-[#eeeeee] px-4 py-2 text-lg"
                    value={autoModel}
                    onChange={(event) => setAutoModel(event.target.value)}
                    required
                  >
                    <option value="" disabled>Select your auto model</option>
                    {autoVehicleOptions[autoCategory].map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </label>
              )}
            </>
          )}

          {vehicleType === 'truck' && (
            <>
              <label className="mb-7 block text-sm font-medium">
                Truck category
                <select
                  className="mt-2 w-full rounded-lg border bg-[#eeeeee] px-4 py-2 text-lg"
                  value={truckCategory}
                  onChange={(event) => {
                    setTruckCategory(event.target.value)
                    setTruckModel('')
                  }}
                  required
                >
                  <option value="" disabled>Select a truck category</option>
                  {Object.keys(truckVehicleOptions).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </label>
              {truckCategory && (
                <label className="mb-7 block text-sm font-medium">
                  Truck model
                  <select
                    className="mt-2 w-full rounded-lg border bg-[#eeeeee] px-4 py-2 text-lg"
                    value={truckModel}
                    onChange={(event) => setTruckModel(event.target.value)}
                    required
                  >
                    <option value="" disabled>Select your truck model</option>
                    {truckVehicleOptions[truckCategory].map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </label>
              )}
            </>
          )}

          {vehicleType && (
            <div className="mb-7 overflow-hidden rounded-xl border border-orange-100 bg-orange-50">
              <img
                className="h-40 w-full object-contain px-4 py-2"
                src={vehicleType === 'truck'
                  ? `${import.meta.env.BASE_URL}owner-mountain-truck-drive.gif`
                  : vehicleType === 'auto'
                    ? `${import.meta.env.BASE_URL}captain-city-auto-drive.gif`
                    : `${import.meta.env.BASE_URL}captain-forest-drive.gif`}
                alt={vehicleType === 'truck'
                  ? 'Punjabi truck driving on a mountain road'
                  : vehicleType === 'auto' ? 'Auto-rickshaw driving through a city' : 'Car driving on a forest road'}
              />
              {vehicleType !== 'auto' && (
                <p className="pb-3 text-center text-sm font-medium text-gray-700">
                  {vehicleType === 'truck' ? 'Punjabi truck · mountain road' : 'Car · forest road'}
                </p>
              )}
            </div>
          )}

          <h3 className="text-lg font-medium mb-2">Identity documents</h3>
          <p className="mb-4 text-xs text-gray-500">
            Your images are stored privately and only available to your authenticated account.
          </p>
          <div className="mb-3 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              Aadhaar card image
              <input
                required
                className="mt-2 block w-full rounded-lg border bg-[#eeeeee] px-3 py-2 text-sm"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => setAadhaarImage(event.target.files?.[0] || null)}
              />
            </label>
            <label className="block text-sm font-medium">
              PAN card image
              <input
                required
                className="mt-2 block w-full rounded-lg border bg-[#eeeeee] px-3 py-2 text-sm"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => setPanImage(event.target.files?.[0] || null)}
              />
            </label>
          </div>
          <p className="mb-6 text-xs text-gray-500">JPEG, PNG, or WebP. Maximum file size: 5 MB each.</p>

          <h3 className="text-lg font-medium mb-2">Driving licence</h3>
          <p className="mb-4 text-xs text-gray-500">
            Upload a clear image of your Driving Licence (DL).
          </p>
          <label className="mb-7 block text-sm font-medium">
            Driving Licence (DL) image
            <input
              required
              className="mt-2 block w-full rounded-lg border bg-[#eeeeee] px-3 py-2 text-sm"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => setDrivingLicenceImage(event.target.files?.[0] || null)}
            />
          </label>
          <p className="mb-6 text-xs text-gray-500">JPEG, PNG, or WebP. Maximum file size: 5 MB.</p>

          <h3 className="text-lg font-medium mb-2">Police verification</h3>
          <p className="mb-4 text-xs text-gray-500">
            Upload a clear image of your Police Verification Certificate.
          </p>
          <label className="mb-7 block text-sm font-medium">
            Police Verification Certificate
            <input
              required
              className="mt-2 block w-full rounded-lg border bg-[#eeeeee] px-3 py-2 text-sm"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => setPoliceVerificationImage(event.target.files?.[0] || null)}
            />
          </label>
          <p className="mb-6 text-xs text-gray-500">JPEG, PNG, or WebP. Maximum file size: 5 MB.</p>

          <h3 className="text-lg font-medium mb-2">Captain&apos;s photo</h3>
          <p className="mb-4 text-xs text-gray-500">
            Upload a clear photo of the captain.
          </p>
          <label className="mb-7 block text-sm font-medium">
            Captain photo
            <input
              required
              className="mt-2 block w-full rounded-lg border bg-[#eeeeee] px-3 py-2 text-sm"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => setCaptainPhotoImage(event.target.files?.[0] || null)}
            />
          </label>
          <p className="mb-6 text-xs text-gray-500">JPEG, PNG, or WebP. Maximum file size: 5 MB.</p>

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#111] text-white font-semibold mb-3 rounded-lg px-4 py-2 w-full text-lg disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Account create ho raha hai…' : 'Create captain account'}
          </button>
        </form>

        <p className="text-center">
          Already have an account? <Link to="/captain-login" className="text-blue-600">Login here</Link>
        </p>
        <p className="mt-6 text-[10px] leading-tight text-gray-500">
          This site is protected by reCAPTCHA and the <span className="underline">Google Privacy Policy</span>
          {' '}and <span className="underline">Terms of Service apply</span>.
        </p>
      </section>
    </main>
  )
}

export default CaptainSignup
