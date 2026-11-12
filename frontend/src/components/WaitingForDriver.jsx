/* eslint-disable react/prop-types */

const registeredVehicles = {
  car: { label: 'Car', image: '/car-side.svg' },
  bolero: { label: 'Bolero', image: '/car-side.svg' },
  'seven-seater-car': { label: '7 Seater Car', image: '/car-side.svg' },
  auto: { label: 'Auto', image: '/car-side.svg' },
  truck: { label: 'Truck', image: '/punjabi-truck.png' },
}

const WaitingForDriver = (props) => {
  const vehicle = registeredVehicles[props.registeredVehicleType]

  return (
    <div>
      <h5 className='p-1 text-center w-[93%] absolute top-0' onClick={() => {
        props.waitingForDriver(false)
      }}><i className="text-3xl text-gray-200 ri-arrow-down-wide-line"></i></h5>

      <div className='flex items-center justify-between gap-3'>
        <div className='flex items-center gap-2'>
          <img className='h-12 w-16 object-contain' src={vehicle?.image || '/car-side.svg'} alt={vehicle?.label || 'Registered vehicle'} />
          {vehicle && <p className='font-semibold'>{vehicle.label}</p>}
        </div>
        {props.ride?.otp && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-600">Ride OTP</p>
            <p className="font-mono text-2xl font-bold tracking-widest text-[#8B1E2D]">{props.ride.otp}</p>
          </div>
        )}
      </div>
      <div className='mt-3 text-right'>
          <h2 className='text-lg font-medium capitalize'>{props.ride?.captain.fullname.firstname}</h2>
          <h4 className='text-xl font-semibold -mt-1 -mb-1'>{props.ride?.captain.vehicle.plate || 'Plate pending verification'}</h4>
          <p className='text-sm text-gray-600'>Share the OTP with your captain to start the ride</p>
      </div>

      <div className='flex gap-2 justify-between flex-col items-center'>
        <div className='w-full mt-5'>
          <div className='flex items-center gap-5 p-3 border-b-2'>
            <i className="ri-map-pin-user-fill"></i>
            <div>
              <h3 className='text-lg font-medium'>562/11-A</h3>
              <p className='text-sm -mt-1 text-gray-600'>{props.ride?.pickup}</p>
            </div>
          </div>
          <div className='flex items-center gap-5 p-3 border-b-2'>
            <i className="text-lg ri-map-pin-2-fill"></i>
            <div>
              <h3 className='text-lg font-medium'>562/11-A</h3>
              <p className='text-sm -mt-1 text-gray-600'>{props.ride?.destination}</p>
            </div>
          </div>
          <div className='flex items-center gap-5 p-3'>
            <i className="ri-currency-line"></i>
            <div>
              <h3 className='text-lg font-medium'>₹{props.ride?.fare} </h3>
              <p className='text-sm -mt-1 text-gray-600'>Cash Cash</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WaitingForDriver