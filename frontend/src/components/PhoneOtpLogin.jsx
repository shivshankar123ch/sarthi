/* eslint-disable react/prop-types */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import PhoneNumberInput from './PhoneNumberInput'
import BrandLogo from './BrandLogo'
import driverCityRoad from '../assets/driver-city-road.svg'
import './PhoneOtpLogin.css'

const PhoneOtpLogin = ({ accountType = 'user', showRoadAnimation = false }) => {
  const [countryCode, setCountryCode] = useState('+91')
  const [mobileNumber, setMobileNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [verificationTicket, setVerificationTicket] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const navigate = useNavigate()
  const phone = `${countryCode}${mobileNumber}`
  const isCaptainLogin = accountType === 'captain'
  const otherLoginPath = isCaptainLogin ? '/owner-login' : '/captain-login'
  const otherLoginLabel = isCaptainLogin ? 'Motor-Owner login' : 'Driver login'

  const sendOtp = async () => {
    setErrorMessage('')
    setIsLoading(true)

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/${isCaptainLogin ? 'captains' : 'users'}/otp/send`,
        { phone },
      )
      setVerificationTicket(response.data.ticket)
      setOtp('')
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || error.message || 'OTP bhejne mein dikkat hui. Dobara koshish karein.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  const submitOtp = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setIsLoading(true)

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/${isCaptainLogin ? 'captains' : 'users'}/otp/verify`,
        { ticket: verificationTicket, otp },
      )

      if (!response.data.verified) {
        setErrorMessage('OTP verify nahi hua. Dobara koshish karein.')
        return
      }

      navigate(isCaptainLogin ? '/captain-signup' : '/motor-owner-signup')
    } catch (error) {
      if (error.response?.status === 503) {
        setErrorMessage('Server par 2Factor OTP setup nahi hai. Backend API key configure karein.')
      } else if (error.response) {
        setErrorMessage(error.response.data?.message || 'OTP verify nahi hua. Dobara koshish karein.')
      } else {
        setErrorMessage(error.message || 'OTP verify nahi hua. Dobara koshish karein.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const changeNumber = () => {
    setVerificationTicket(null)
    setOtp('')
    setErrorMessage('')
  }

  return (
    <main className={`phone-login-page${showRoadAnimation ? ' phone-login-page--with-road' : ''}`}>
      <section className="phone-login-card" aria-labelledby="phone-login-title">
        <div className="phone-login-brand">
          <BrandLogo />
          <span className="phone-login-tagline">Aapka safar, aapke haath mein</span>
        </div>

        <div className="phone-login-content">
          {!verificationTicket ? (
            <>
              <section
                className="driver-booking-hero"
                aria-labelledby="phone-login-title"
                style={{ '--driver-road-image': `url("${driverCityRoad}")` }}
              >
                <span className="driver-booking-eyebrow">
                  <i className="ri-steering-2-line" aria-hidden="true" />
                  Need a Driver?
                </span>
                <h1 id="phone-login-title">
                  Book a Driver <span>Anytime!</span>
                </h1>
                <p className="driver-booking-description">
                  Hire professional and <span className="driver-copy-highlight">verified drivers</span> for your car.
                  Book by the <span className="driver-copy-highlight driver-booking-highlight">hour, day or trip.</span>
                </p>
                <div className="driver-booking-options" aria-label="Flexible booking options">
                  <span><i className="ri-time-line" aria-hidden="true" /> By the hour</span>
                  <span><i className="ri-calendar-check-line" aria-hidden="true" /> Full day</span>
                  <span><i className="ri-route-line" aria-hidden="true" /> By the trip</span>
                </div>
              </section>

              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  sendOtp()
                }}
              >
                <label className="phone-login-label" htmlFor="mobile-number">Your mobile number</label>
                <PhoneNumberInput
                  countryCode={countryCode}
                  mobileNumber={mobileNumber}
                  onCountryCodeChange={setCountryCode}
                  onMobileNumberChange={setMobileNumber}
                  inputId="mobile-number"
                />
                <button className="phone-login-submit" type="submit" disabled={isLoading}>
                  {isLoading ? 'Code bhej rahe hain…' : 'OTP verify'}
                  <i className="ri-arrow-right-line" aria-hidden="true" />
                </button>
              </form>
            </>
          ) : (
            <>
              <button className="phone-login-back" type="button" onClick={changeNumber}>
                <i className="ri-arrow-left-line" aria-hidden="true" />
                Number badlein
              </button>
              <h1 id="phone-login-title">Code enter karein</h1>
              <p className="phone-login-description">
                <strong>{phone}</strong> par bheja 6-digit verification code enter karein.
              </p>

              <form onSubmit={submitOtp}>
                <label className="phone-login-label" htmlFor="otp-code">Verification code</label>
                <input
                  autoComplete="one-time-code"
                  className="phone-login-otp-input"
                  id="otp-code"
                  inputMode="numeric"
                  maxLength={6}
                  minLength={6}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  pattern="[0-9]{6}"
                  placeholder="••••••"
                  required
                  value={otp}
                />
                <button className="phone-login-submit" type="submit" disabled={isLoading}>
                  {isLoading ? 'Verify kar rahe hain…' : 'Verify karke login karein'}
                  <i className="ri-arrow-right-line" aria-hidden="true" />
                </button>
              </form>
              <button className="phone-login-resend" type="button" disabled={isLoading} onClick={sendOtp}>
                Code nahi mila? Dobara bhejein
              </button>
            </>
          )}

          {errorMessage && (
            <p className="phone-login-error" role="alert">{errorMessage}</p>
          )}

        </div>

        <div className="phone-login-footer">
          <span><i className="ri-shield-check-line" aria-hidden="true" /> Aapka number secure hai</span>
          <Link to={otherLoginPath}>{otherLoginLabel}</Link>
        </div>
      </section>
      {showRoadAnimation && (
        <div className="phone-login-road">
          <img
            src={`${import.meta.env.BASE_URL}sarthi-road-drive.gif`}
            alt="Car moving slowly along a road"
          />
        </div>
      )}
    </main>
  )
}

export default PhoneOtpLogin
