/* eslint-disable react/prop-types */
const BrandLogo = ({ className = '' }) => (
  <span className={`brand-logo ${className}`.trim()} aria-label="Sarthi">
    <svg
      className="brand-logo-car"
      viewBox="0 0 64 36"
      role="img"
      aria-label="Car"
    >
      <path d="m13 21 4-10c.8-2 2.2-3 4.4-3h21c2 0 3.4 1 4.2 3l4.4 10" />
      <path d="M8 21h48a4 4 0 0 1 4 4v5H4v-5a4 4 0 0 1 4-4Z" />
      <path d="M19 11h26m-27 10 5-10m23 10-5-10" />
      <circle cx="15" cy="29" r="4" />
      <circle cx="49" cy="29" r="4" />
      <path d="M8 23h5m38 0h5" />
    </svg>
    <span className="brand-logo-word">
      <span className="brand-logo-sarthi">Sarthi</span>
    </span>
  </span>
)

export default BrandLogo
