# Backend API Documentation

## Run locally

The backend requires MongoDB, Redis, and Kafka to be running before it starts.
Set `MONGODB_URI` in `Backend/.env` to your MongoDB connection string; for a
local MongoDB instance, use `mongodb://127.0.0.1:27017/NextDriver`. Set
`REDIS_URL` to the connection URL supplied by your Redis provider. Use a
`rediss://` URL or set `REDIS_TLS=true` when the provider requires TLS. Set
`KAFKA_BROKERS`, `KAFKA_CLIENT_ID`, `KAFKA_TOPIC`, and `KAFKA_GROUP_ID` in
`Backend/.env` for the live driver-location stream. The Kafka topic must already
exist. Set
`MAPBOX_SECRET_TOKEN` to a secret Mapbox access token with geocoding and
directions-matrix access. Keep the token on the backend and out of source
control. Start the API from the `Backend` directory with `npx nodemon
server.js`. The HTTP server opens its port before it connects to MongoDB and
initializes Redis and Kafka. Existing email-only user records are preserved,
but existing email-only user/captain records need a phone number added before
those accounts can use mobile-number login.

To start the local Kafka broker and create the configured default
`driver-location` topic, run `docker compose -f ..\docker-compose.yml up -d`
from the `Backend` directory. The broker is exposed at `localhost:9092`, which
matches the example `KAFKA_BROKERS` setting. MongoDB and Redis are not included
in Compose; they must be available separately.

## Build the backend image

From the `Backend` directory, run `docker build -t nextdriver-backend .`.
The image listens on port `4000` and starts `server.js`. The `.dockerignore`
file keeps local environment files and `node_modules` out of the build context.
When running the backend in a container, configure MongoDB, Redis, and Kafka
addresses that the container can reach; `localhost` inside the container is
the container itself.

Captain location updates received over Socket.IO are saved in MongoDB, cached
as live Redis geospatial entries, and published to the configured Kafka topic.
The Kafka consumer refreshes the Redis cache; nearby-captain searches use recent
Redis locations alongside the existing MongoDB location data. Redis live
location entries expire after 30 seconds without an update.
Kafka records are keyed by captain ID and use this JSON shape:
`{"captainId":"<id>","location":{"latitude":40.7,"longitude":-73.9,"updatedAt":"<ISO timestamp>"}}`.
For ongoing rides, the Kafka consumer forwards each event to the rider over
Socket.IO as `driver-location`; the frontend displays that position on Mapbox.
The owner selects a live captain marker (or list entry) before requesting a
ride. The request is sent only to that captain. The OTP is returned to the
owner; the captain receives an OTP-entry prompt but not the OTP value.

## 2Factor phone OTP login

Set `TWO_FACTOR_API_KEY` in `Backend/.env` using the API key from your 2Factor
account. Keep it on the backend; never add it to frontend variables or source
control. Enable the SMS OTP API and configure any required sender/template
settings in the 2Factor account. `JWT_SECRET` must also be set because the
backend signs short-lived, account-specific OTP session tickets with it.

The frontend requests an OTP from `POST /users/otp/send` or
`POST /captains/otp/send`. The backend sends the SMS through 2Factor and returns
a signed ticket that expires after 10 minutes. The frontend submits that ticket
and the six-digit code to `/users/otp/verify` or `/captains/otp/verify`; after
successful verification, the frontend opens the corresponding signup page.
Existing clients can continue using `/users/login/phone-otp` and
`/captains/login/phone-otp` to verify an OTP and log in to a registered account.
OTP send requests are limited to three per IP per 15 minutes and verification
requests to ten per IP per 15 minutes.

## `/users/register` Endpoint

### Description

Registers a new user with a supported vehicle type and its required document images.

### HTTP Method

`POST`

### Request Body

The request body must use `multipart/form-data` and include the following fields:

- `fullname` (object):
  - `firstname` (string, required): User's first name (minimum 3 characters).
  - `lastname` (string, optional): User's last name (minimum 3 characters).
- `phone` (string, required): Mobile number in international format, including country code (for example, `+919876543210`).
- `alternatePhone` (string, optional): Alternate mobile number in international format.
- `password` (string, required): User's password (minimum 6 characters).
- `ownerAadhaarImage` (file, required): Owner's Aadhaar card image.
- `ownerPanImage` (file, required): Owner's PAN card image.
- `permitCertificateImage` (file, required): Vehicle permit certificate image.
- `vehicleType` (string, required): `car`, `bolero`, `seven-seater-car`, `auto`, or `truck`.
- `carCategory` (string, required for cars): one of `Hatchback Cars (Small Cars)`, `Sedan Cars`, `SUV Cars`, `MUV / 7-Seater Cars`, `Luxury Cars`, or `Electric Cars (EV)`.
- `carModel` (string, required for cars): a supported model belonging to the selected car category.
- `autoCategory` (string, required for autos): `Passenger Auto Rickshaw (3 Wheeler)`, `Electric Auto Rickshaw (E-Auto)`, or `Cargo Auto (Goods Transport)`.
- `autoModel` (string, required for autos): a supported model belonging to the selected auto category.
- `truckCategory` (string, required for trucks): `Mini Truck / Chhota Transport`, `Pickup Truck`, or `Medium & Heavy Trucks`.
- `truckModel` (string, required for trucks): a supported model from the selected category, such as `Tata Ace Gold`, `Mahindra Bolero Pickup`, or `Tata Signa`.
- `rcImage` (file, required): RC / RC Book / RC Card image.
- `drivingLicenceImage` (file, required): Driving Licence image; truck drivers must use the correct vehicle category.
- `insuranceImage` (file, required): Valid vehicle insurance; commercial vehicle insurance for trucks.
- `pucImage` (file, required): PUC certificate image.
- `fitnessImage` (file, optional): Fitness certificate, where applicable.
- `roadTaxImage` (file, optional): Road tax / tax receipt, where applicable.
- `nationalPermitImage` (file, optional, truck only): National or state permit.
- `goodsCarriagePermitImage` (file, optional, truck only): Goods Carriage Permit.
- `loadChallanImage` (file, optional, truck only): Load Challan / Bilty when carrying goods.
- `eWayBillImage` (file, optional, truck only): E-Way Bill where applicable.

Document uploads accept JPEG, PNG, or WebP images up to 5 MB each. They are
stored in the private `userVehicleDocuments` GridFS bucket and excluded from API
responses. GridFS does not encrypt files by itself; use encrypted storage and
HTTPS in production.

### Example Response

- `user` (object):
  - `fullname` (object).
    - `firstname` (string): User's first name (minimum 3 characters).
    - `lastname` (string): User's last name (minimum 3 characters).   
  - `phone` (string): User's mobile number in international format.
  - `alternatePhone` (string, optional): Alternate mobile number; available only on the owner's authenticated profile.
  - `vehicleType` (string): Registered vehicle type (`car`, `bolero`, `seven-seater-car`, `auto`, or `truck`).
  - `carCategory` (string, optional): Selected car category for car registrations.
  - `carModel` (string, optional): Selected car model for car registrations.
  - `autoCategory` (string, optional): Selected auto category for auto registrations.
  - `autoModel` (string, optional): Selected auto model for auto registrations.
  - `truckCategory` (string, optional): Selected truck category for truck registrations.
  - `truckModel` (string, optional): Selected truck model for truck registrations.
  - `token` (String): JWT Token

## `/users/documents/:documentType` Endpoint

Returns the signed-in user's own vehicle document as a private download.
Supported types are `rc`, `driving-licence`, `insurance`, `puc`, `fitness`,
`road-tax`, `national-permit`, `goods-carriage-permit`, `load-challan`,
`e-way-bill`, `owner-aadhaar`, `owner-pan`, and `permit-certificate`. Requires
the user's JWT. Truck-only documents return 404 if not uploaded.

## `/users/login` Endpoint

### Description

Authenticates a user using their mobile number and password, returning a JWT token upon successful login.

### HTTP Method

`POST`

### Endpoint

`/users/login`

### Request Body

The request body should be in JSON format and include the following fields:

- `phone` (string, required): Mobile number in international format, including country code (for example, `+919876543210`).
- `password` (string, required): User's password (minimum 6 characters).

### Example Response

- `user` (object):
  - `fullname` (object).
    - `firstname` (string): User's first name (minimum 3 characters).
    - `lastname` (string): User's last name (minimum 3 characters).   
  - `phone` (string): User's mobile number in international format.
- `token` (String): JWT Token

## `/users/otp/send` Endpoint

Sends a six-digit OTP to the supplied international-format mobile number using
2Factor. Send a JSON body containing `{ "phone": "+919876543210" }`. A successful
response contains a short-lived signed `{ "ticket": "..." }`; keep the ticket
and submit it with the OTP to the verify endpoint. Returns `503` when 2Factor
is not configured and `502` when the provider cannot send the message.

## `/users/otp/verify` Endpoint

Verifies the six-digit OTP for the signed ticket returned by `/users/otp/send`.
Send `{ "ticket": "...", "otp": "123456" }`. A successful response contains
`{ "verified": true, "phone": "+919876543210" }`; this endpoint does not log the
user in or issue an API token. Returns `401` for an invalid/expired ticket or
OTP, `502` when 2Factor cannot verify the OTP, and `503` when 2Factor or the
signing secret is not configured.

## `/users/login/phone-otp` Endpoint

### Description

Verifies the OTP with 2Factor and issues a JustDriver API token for a registered
user account.

### HTTP Method

`POST`

### Request Body

```json
{ "ticket": "signed ticket returned by /users/otp/send", "otp": "123456" }
```

Returns the registered `user` and JustDriver `token` on success. Returns `401`
for an invalid/expired ticket or OTP, `404` when no account is registered for
the verified number, `502` when 2Factor cannot verify the OTP, and `503` when
2Factor or the signing secret is not configured.

## `/users/profile` Endpoint

### Description

Retrieves the profile information of the currently authenticated user.

### HTTP Method

`GET`

### Authentication

Requires a valid JWT token in the Authorization header:
`Authorization: Bearer <token>`

### Example Response

- `user` (object):
  - `fullname` (object).
    - `firstname` (string): User's first name (minimum 3 characters).
    - `lastname` (string): User's last name (minimum 3 characters).   
  - `phone` (string): User's mobile number in international format.



## `/users/logout` Endpoint

### Description

Logout the current user and blacklist the token provided in cookie or headers

### HTTP Method

`GET`

### Authentication

Requires a valid JWT token in the Authorization header or cookie:

- `user` (object):
  - `fullname` (object).
    - `firstname` (string): User's first name (minimum 3 characters).
    - `lastname` (string): User's last name (minimum 3 characters).   
  - `phone` (string): User's mobile number in international format.
  - `password` (string): User's password (minimum 6 characters).
- `token` (String): JWT Token## `/captains/register` Endpoint

### Description

Registers a captain using multipart form data. Aadhaar, PAN, Driving Licence,
captain photo, and Police Verification Certificate images must be JPEG, PNG, or
WebP files no larger than 5 MB each.
The images are stored in the private `captainDocuments` GridFS bucket and are
not included in API responses.
GridFS does not encrypt these files by itself; secure MongoDB credentials and use
encrypted storage and HTTPS in production.

### HTTP Method

`POST`

### Request Body

The multipart form includes the following fields:

- `fullname` (object):
  - `firstname` (string, required): Captain's first name (minimum 3 characters)
  - `lastname` (string, optional): Captain's last name
- `phone` (string, required): Mobile number in international format, including country code (for example, `+919876543210`).
- `alternatePhone` (string, optional): Alternate mobile number in international format.
- `password` (string, required): Captain's password (minimum 6 characters)
- `vehicle` (object):
  - `vehicleType` (string, required): Type of vehicle (`car`, `bolero`, `seven-seater-car`, `truck`, or `auto`)
- `aadhaarImage` (file, required): Aadhaar card image.
- `panImage` (file, required): PAN card image.
- `drivingLicenceImage` (file, required): Captain's Driving Licence.
- `captainPhotoImage` (file, required): A clear photo of the captain.
- `policeVerificationImage` (file, required): Police Verification Certificate image.

### Example Response


## `/captains/register` Endpoint

### Description

Registers a captain using multipart form data. Aadhaar, PAN, Driving Licence,
captain photo, and Police Verification Certificate images are stored privately
in MongoDB GridFS; a vehicle image is not required.

### HTTP Method

`POST`

### Request Body

The multipart form includes the following fields:

- `fullname` (object):
  - `firstname` (string, required): Captain's first name (minimum 3 characters).
  - `lastname` (string, optional): Captain's last name (minimum 3 characters).
- `phone` (string, required): Mobile number in international format, including country code (for example, `+919876543210`).
- `alternatePhone` (string, optional): Alternate mobile number in international format.
- `password` (string, required): Captain's password (minimum 6 characters).
- `vehicle` (object):
  - `vehicleType` (string, required): Type of vehicle (`car`, `bolero`, `seven-seater-car`, `truck`, or `auto`).
- Passenger capacity is set automatically based on vehicle type (car: 4, Bolero/7-seater car: 7, auto: 3, truck: 0; trucks are goods vehicles).
- Vehicle plate details are not collected during signup.
- `aadhaarImage` (file, required): Aadhaar card image.
- `panImage` (file, required): PAN card image.
- `drivingLicenceImage` (file, required): Driver's licence.
- `captainPhotoImage` (file, required): Clear photo of the captain.
- `policeVerificationImage` (file, required): Police Verification Certificate image.

### Example Response

- `captain` (object):
  - `fullname` (object).
    - `firstname` (string): Captain's first name (minimum 3 characters).
    - `lastname` (string): Captain's last name (minimum 3 characters).   
  - `phone` (string): Captain's mobile number in international format.
  - `vehicle` (object):
    - `plate` (string, optional): Vehicle plate number, if available.
    - `capacity` (number): Passenger capacity (0 for trucks, which carry goods).
    - `vehicleType` (string): Type of vehicle.
- `token` (String): JWT Token

## `/captains/login` Endpoint

### Description

Authenticates a captain using their mobile number and password, returning a JWT token upon successful login.

### HTTP Method

`POST`

### Endpoint

`/captains/login`

### Request Body

The request body should be in JSON format and include the following fields:

- `phone` (string, required): Mobile number in international format, including country code (for example, `+919876543210`).
- `password` (string, required): Captain's password (minimum 6 characters).

### Example Response

- `captain` (object):
  - `fullname` (object).
    - `firstname` (string): Captain's first name (minimum 3 characters).
    - `lastname` (string): Captain's last name (minimum 3 characters).   
  - `phone` (string): Captain's mobile number in international format.
  - `vehicle` (object):
    - `plate` (string, optional): Vehicle plate number, if available.
    - `capacity` (number): Passenger capacity (0 for trucks, which carry goods).
    - `vehicleType` (string): Type of vehicle.
- `token` (String): JWT Token

## Captain OTP Endpoints

`POST /captains/otp/send` accepts `{ "phone": "+919876543210" }` and returns a
10-minute signed ticket after 2Factor accepts the OTP request.
`POST /captains/otp/verify` accepts `{ "ticket": "...", "otp": "123456" }`,
verifies the code, and returns the verified phone without logging in or issuing
an API token. After verification, the frontend opens the captain signup page.
`POST /captains/login/phone-otp` accepts `{ "ticket": "...", "otp": "123456" }`,
verifies the code with 2Factor, and issues a JustDriver API token for a
registered captain. It returns `401` for an invalid/expired ticket or OTP,
`404` when no captain account is registered for the verified number, `502` when
2Factor cannot verify the OTP, and `503` when 2Factor or the signing secret is
not configured.

## `/captains/documents/:documentType` Endpoint

Returns the signed-in captain's own document image. Supported document types are
`aadhaar`, `pan`, `driving-licence`, `captain-photo`, and `police-verification`.
Requires the captain's
JWT; documents are sent privately with no-cache response headers. The captain
photo is returned inline; identity documents are downloads.

## `/captains/profile` Endpoint

### Description

Retrieves the profile information of the currently authenticated captain.

### HTTP Method

`GET`

### Authentication

Requires a valid JWT token in the Authorization header:
`Authorization: Bearer <token>`

### Example Response

- `captain` (object):
  - `fullname` (object).
    - `firstname` (string): Captain's first name (minimum 3 characters).
    - `lastname` (string): Captain's last name (minimum 3 characters).   
  - `phone` (string): Captain's mobile number in international format.
  - `vehicle` (object):
    - `color` (string): Vehicle color.
    - `plate` (string, optional): Vehicle plate number, if available.
    - `capacity` (number): Vehicle passenger capacity.
    - `vehicleType` (string): Type of vehicle.

## `/captains/logout` Endpoint

### Description

Logout the current captain and blacklist the token provided in cookie or headers.

### HTTP Method

`GET`

### Authentication

Requires a valid JWT token in the Authorization header or cookie.

### Example Response

- `message` (string): Logout successfully.


## `/maps/get-coordinates` Endpoint

### Description

Retrieves the coordinates (latitude and longitude) for a given address.

### HTTP Method

`GET`

### Request Parameters

- `address` (string, required): The address for which to retrieve coordinates.

### Example Request

GET `/maps/get-coordinates?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA`

### Example Response

```json
{
  "ltd": 37.4224764,
  "lng": -122.0842499
}
```

### Error Response

- `400 Bad Request`: If the address parameter is missing or invalid.
- `404 Not Found`: If the coordinates for the given address could not be found.

```json
{
  "message": "Coordinates not found"
}
```

## `/maps/get-distance-time` Endpoint

### Description

Retrieves the distance and estimated travel time between two locations.

### HTTP Method

`GET`

### Request Parameters

- `origin` (string, required): The starting address or location.
- `destination` (string, required): The destination address or location.

### Example Request

```
GET /maps/get-distance-time?origin=New+York,NY&destination=Los+Angeles,CA
```

### Example Response

```json
{
  "distance": {
    "text": "2,789 miles",
    "value": 4486540
  },
  "duration": {
    "text": "1 day 18 hours",
    "value": 154800
  }
}
```

### Error Response

- `400 Bad Request`: If the origin or destination parameter is missing or invalid.
- `404 Not Found`: If the distance and time for the given locations could not be found.

```json
{
  "message": "No routes found"
}
```

## `/maps/get-suggestions` Endpoint

### Description

Retrieves autocomplete suggestions for a given input string.

### HTTP Method

`GET`

### Request Parameters

- `input` (string, required): The input string for which to retrieve suggestions.

### Example Request

```
GET /maps/get-suggestions?input=1600+Amphitheatre
```

### Example Response

```json
[
  "1600 Amphitheatre Parkway, Mountain View, CA, USA",
  "1600 Amphitheatre Pkwy, Mountain View, CA 94043, USA"
]
```

### Error Response

- `400 Bad Request`: If the input parameter is missing or invalid.
- `500 Internal Server Error`: If there is an error retrieving suggestions.

```json
{
  "message": "Unable to fetch suggestions"
}
```

## `/rides/create` Endpoint

### Description

Creates a new ride with the provided information.

### HTTP Method

`POST`

### Authentication

Requires a valid JWT token in the Authorization header:
`Authorization: Bearer <token>`

### Request Body

The request body should be in JSON format and include the following fields:

- `pickup` (string, required): The pickup address (minimum 3 characters).
- `destination` (string, required): The destination address (minimum 3 characters).
- `vehicleType` (string, required): The type of vehicle (must be 'auto', 'car', or 'moto').

### Example Response

- `ride` (object):
  - `user` (string): User ID.
  - `pickup` (string): Pickup address.
  - `destination` (string): Destination address.
  - `fare` (number): Fare amount.
  - `status` (string): Ride status.
  - `duration` (number): Duration in seconds.
  - `distance` (number): Distance in meters.
  - `otp` (string): OTP for the ride.

### Error Response

- `400 Bad Request`: If any required field is missing or invalid.
- `500 Internal Server Error`: If there is an error creating the ride.

```json
{
  "message": "Error message"
}
```


## `/rides/start-ride` Endpoint

The captain starts an accepted ride by submitting the user's four-digit OTP and
a vehicle number-plate image as `multipart/form-data`. The image must be JPEG,
PNG, or WebP and no larger than 5 MB. It is stored privately in the
`rideVehiclePlateImages` GridFS bucket with the ride and captain IDs; the ride
starts only after the OTP is verified and the image is saved.

Requires the captain's JWT. Form fields:

- `rideId` (string, required): Accepted ride ID.
- `otp` (string, required): Six-digit OTP provided by the rider.
- `vehiclePlateImage` (file, required): Clear vehicle number-plate image.

## `/rides/get-fare` Endpoint

### Description

Retrieves the fare estimate for a ride between the provided pickup and destination addresses.

### HTTP Method

`GET`

### Authentication

Requires a valid JWT token in the Authorization header:
`Authorization:

 Bear

er <token>`

### Request Parameters

- `pickup` (string, required): The pickup address (minimum 3 characters).
- `destination` (string, required): The destination address (minimum 3 characters).

### Example Request

```
GET /rides/get-fare?pickup=1600+Amphitheatre+Parkway,+Mountain+View,+CA&destination=1+Infinite+Loop,+Cupertino,+CA
```

### Example Response

```json
{
  "auto": 50.0,
  "car": 75.0,
  "moto": 40.0
}
```

### Error Response

- `400 Bad Request`: If any required parameter is missing or invalid.
- `500 Internal Server Error`: If there is an error calculating the fare.

```json
{
  "message": "Error message"
}
```
<!-- npx nodemon -->
<!-- npm run dev -->