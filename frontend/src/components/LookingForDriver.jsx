/* eslint-disable react/prop-types */

const registeredVehicles = {
    car: { label: 'Car', image: '/car-side.svg' },
    bolero: { label: 'Bolero', image: '/car-side.svg' },
    'seven-seater-car': { label: '7 Seater Car', image: '/car-side.svg' },
    auto: { label: 'Auto', image: '/car-side.svg' },
    truck: { label: 'Truck', image: '/punjabi-truck.png' },
}

const LookingForDriver = (props) => {
    const vehicle = registeredVehicles[props.registeredVehicleType]

    return (
        <div>
            <h5 className='p-1 text-center w-[93%] absolute top-0' onClick={() => {
                props.setVehicleFound(false)
            }}><i className="text-3xl text-gray-200 ri-arrow-down-wide-line"></i></h5>
            <h3 className='text-2xl font-semibold mb-5'>Looking for a Driver</h3>

            <div className='flex gap-2 justify-between flex-col items-center'>
                <div className='flex w-full items-center justify-between rounded-xl bg-orange-50 p-3'>
                    <div className='flex items-center gap-3'>
                        <img className='h-14 w-16 object-contain' src={vehicle?.image || '/car-side.svg'} alt={vehicle?.label || 'Registered vehicle'} />
                        <div>
                            <p className='font-semibold'>{vehicle?.label || 'Registered vehicle'}</p>
                            <p className='text-xs text-gray-600'>Looking for your driver</p>
                        </div>
                    </div>
                    {props.ride?.otp && (
                        <div className='rounded-lg border border-orange-200 bg-white px-3 py-2 text-center'>
                            <p className='text-[10px] font-semibold uppercase tracking-wide text-gray-600'>Show this OTP to your captain</p>
                            <p className='font-mono text-2xl font-bold tracking-widest text-[#8B1E2D]'>{props.ride.otp}</p>
                        </div>
                    )}
                </div>
                <div className='w-full mt-5'>
                    <div className='flex items-center gap-5 p-3 border-b-2'>
                        <i className="ri-map-pin-user-fill"></i>
                        <div>
                            <h3 className='text-lg font-medium'>562/11-A</h3>
                            <p className='text-sm -mt-1 text-gray-600'>{props.pickup}</p>
                        </div>
                    </div>
                    <div className='flex items-center gap-5 p-3 border-b-2'>
                        <i className="text-lg ri-map-pin-2-fill"></i>
                        <div>
                            <h3 className='text-lg font-medium'>562/11-A</h3>
                            <p className='text-sm -mt-1 text-gray-600'>{props.destination}</p>
                        </div>
                    </div>
                    <div className='flex items-center gap-5 p-3'>
                        <i className="ri-currency-line"></i>
                        <div>
                            <h3 className='text-lg font-medium'>₹{props.fare[ props.vehicleType ]} </h3>
                            <p className='text-sm -mt-1 text-gray-600'>Cash Cash</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LookingForDriver