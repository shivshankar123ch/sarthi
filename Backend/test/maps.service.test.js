const assert = require('node:assert/strict');
const { afterEach, test } = require('node:test');
const axios = require('axios');
const mapService = require('../services/maps.service');

const originalToken = process.env.MAPBOX_SECRET_TOKEN;
const originalGet = axios.get;

afterEach(() => {
    axios.get = originalGet;
    if (originalToken === undefined) {
        delete process.env.MAPBOX_SECRET_TOKEN;
    } else {
        process.env.MAPBOX_SECRET_TOKEN = originalToken;
    }
});

test('geocodes an address with Mapbox coordinates in the existing API shape', async () => {
    process.env.MAPBOX_SECRET_TOKEN = 'test-token';
    axios.get = async (url, options) => {
        assert.match(url, /api\.mapbox\.com\/geocoding\/v5\/mapbox\.places\//);
        assert.equal(options.params.access_token, 'test-token');
        return { data: { features: [ { center: [ -73.9, 40.7 ] } ] } };
    };

    assert.deepEqual(await mapService.getAddressCoordinate('New York'), {
        ltd: 40.7,
        lng: -73.9
    });
});

test('returns distance and duration in meters and seconds for fare calculation', async () => {
    process.env.MAPBOX_SECRET_TOKEN = 'test-token';
    axios.get = async (url, options) => {
        if (url.includes('/directions-matrix/')) {
            assert.match(url, /-73\.9,40\.7;-73\.8,40\.8/);
            assert.equal(options.params.annotations, 'distance,duration');
            return { data: { distances: [ [ 0, 12500 ] ], durations: [ [ 0, 900 ] ] } };
        }

        const center = url.includes('Origin') ? [ -73.9, 40.7 ] : [ -73.8, 40.8 ];
        return { data: { features: [ { center } ] } };
    };

    assert.deepEqual(await mapService.getDistanceTime('Origin', 'Destination'), {
        distance: { value: 12500, text: '12.5 km' },
        duration: { value: 900, text: '15 mins' },
        status: 'OK'
    });
});

test('reports a missing Mapbox token as a configuration error', async () => {
    delete process.env.MAPBOX_SECRET_TOKEN;

    await assert.rejects(
        mapService.getAddressCoordinate('New York'),
        { code: 'MAPS_API_KEY_MISSING' }
    );
});

test('returns autocomplete suggestions from Mapbox place names', async () => {
    process.env.MAPBOX_SECRET_TOKEN = 'test-token';
    axios.get = async (url, options) => {
        assert.match(url, /api\.mapbox\.com\/geocoding\/v5\/mapbox\.places\/New%20York\.json/);
        assert.equal(options.params.autocomplete, true);
        assert.equal(options.params.limit, 5);
        return {
            data: {
                features: [
                    { place_name: 'New York, New York, United States' },
                    { place_name: 'New York Mills, New York, United States' }
                ]
            }
        };
    };

    assert.deepEqual(await mapService.getAutoCompleteSuggestions('New York'), [
        'New York, New York, United States',
        'New York Mills, New York, United States'
    ]);
});

test('reports an empty Mapbox geocoding result as not found', async () => {
    process.env.MAPBOX_SECRET_TOKEN = 'test-token';
    axios.get = async () => ({ data: { features: [] } });

    await assert.rejects(
        mapService.getAddressCoordinate('Unknown Place'),
        { code: 'MAPS_NO_RESULTS' }
    );
});
