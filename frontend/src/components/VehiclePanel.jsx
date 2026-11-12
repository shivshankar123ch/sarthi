/* eslint-disable react/prop-types */

const vehicleOptions = {
    car: { label: 'Car', capacity: '4 seats', fareType: 'car', image: '/car-side.svg' },
    bolero: { label: 'Bolero', capacity: '7 seats', fareType: 'car', image: '/car-side.svg' },
    'seven-seater-car': { label: '7 Seater Car', capacity: '7 seats', fareType: 'car', image: '/car-side.svg' },
    auto: { label: 'Auto', capacity: '3 seats', fareType: 'auto', image: '/car-side.svg' },
    truck: { label: 'Truck', capacity: 'Goods vehicle', fareType: null, image: '/punjabi-truck.png' },
}

const VehiclePanel = (props) => {
    const vehicle = vehicleOptions[props.registeredVehicleType]

    return (
        <div>
            <h5 className='p-1 text-center w-[93%] absolute top-0' onClick={() => {
                props.setVehiclePanel(false)
            }}><i className="text-3xl text-gray-200 ri-arrow-down-wide-line"></i></h5>
            <h3 className='text-2xl font-semibold mb-5'>Choose a Vehicle</h3>
            {vehicle ? (
                <button
                    type="button"
                    disabled={!vehicle.fareType}
                    onClick={() => {
                        if (!vehicle.fareType) return
                        props.setConfirmRidePanel(true)
                        props.selectVehicle(vehicle.fareType)
                    }}
                    className='flex border-2 active:border-black mb-2 rounded-xl w-full p-3 items-center justify-between text-left disabled:cursor-not-allowed disabled:opacity-70'
                >
                    <img className='h-12 w-16 object-contain' src={vehicle.image} alt={vehicle.label} />
                    <div className='ml-2 flex-1'>
                        <h4 className='font-medium text-base'>{vehicle.label}</h4>
                        <p className='font-normal text-xs text-gray-600'>{vehicle.capacity} · Your registered vehicle</p>
                        {!vehicle.fareType && <p className='mt-1 text-xs font-medium text-orange-700'>Truck rides are not available yet.</p>}
                    </div>
                    {vehicle.fareType && <h2 className='text-lg font-semibold'>₹{props.fare[vehicle.fareType]}</h2>}
                </button>
            ) : (
                <p className="rounded-lg bg-orange-50 p-4 text-sm text-gray-700">
                    No vehicle is registered to this account. Please contact support to update your vehicle.
                </p>
            )}
        </div>
    )
}

export default VehiclePanel