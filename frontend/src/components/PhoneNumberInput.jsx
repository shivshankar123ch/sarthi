/* eslint-disable react/prop-types */
const countryCodes = [
  { country: 'India', code: '+91' },
  { country: 'United States', code: '+1' },
  { country: 'United Kingdom', code: '+44' },
  { country: 'Australia', code: '+61' },
  { country: 'United Arab Emirates', code: '+971' },
  { country: 'Nepal', code: '+977' },
  { country: 'Bangladesh', code: '+880' },
  { country: 'Pakistan', code: '+92' },
  { country: 'Singapore', code: '+65' },
  { country: 'Saudi Arabia', code: '+966' },
]

const PhoneNumberInput = ({
  countryCode,
  mobileNumber,
  onCountryCodeChange,
  onMobileNumberChange,
  inputId,
  required = true,
}) => {
  const maxNumberLength = 15 - countryCode.slice(1).length

  return (
    <div className="mb-7 flex gap-2">
      <select
        aria-label="Country calling code"
        autoComplete="tel-country-code"
        className="w-[116px] rounded-lg border bg-[#eeeeee] px-3 py-2 text-base"
        value={countryCode}
        onChange={(event) => onCountryCodeChange(event.target.value)}
      >
        {countryCodes.map(({ country, code }) => (
          <option key={`${country}-${code}`} value={code}>
            {code} {country}
          </option>
        ))}
      </select>
      <input
        id={inputId}
        required={required}
        aria-label="Mobile number"
        autoComplete="tel-national"
        className="min-w-0 flex-1 rounded-lg border bg-[#eeeeee] px-4 py-2 text-lg placeholder:text-base"
        type="tel"
        inputMode="numeric"
        pattern="[0-9]{7,14}"
        minLength={7}
        maxLength={maxNumberLength}
        placeholder="Mobile number"
        value={mobileNumber}
        onChange={(event) => {
          onMobileNumberChange(event.target.value.replace(/\D/g, '').slice(0, maxNumberLength))
        }}
      />
    </div>
  )
}

export default PhoneNumberInput
