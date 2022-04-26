// +----------------------------------------------------------------------------
// | Copyright (c) 2022 Pivotal Commware
// | All rights reserved.
// +----------------------------------------------------------------------------
let _next_id = 0;
const _srcIndxLookup = {};
function getSrcIndx(lat, long, height) {
    const key = lat + long + height;
    if (_srcIndxLookup[key] === undefined) {
        _srcIndxLookup[key] = _next_id++;
    }
    return _srcIndxLookup[key];
}

export function convertToGeojson(mapping, headers, rows) {
    // apply mapping and create new CSV rows
    let newRows = rows.map((row) => {
        // build fow values
        const values = {};
        headers.forEach((h, i) => (values[h] = row[i]));

        const newRow = {};
        mapping.forEach((attr) => {
            // get value from mapped column or fixed value
            let value;
            if (attr.value.selected) {
                value = values[attr.value.selected];
            } else {
                value = attr.value.custom;
            }

            // strip quotes and attempt to parse
            if (typeof(value) === 'string') {
                value = value.replace(/"/g, "");
            }
            let parsed = parseFloat(value);
            if (isNaN(parsed)) {
                parsed = value;
            }

            newRow[attr.key] = parsed;
        });

        return newRow;
    });

    // group rows into sites
    const sites = {};
    const fields = mapping.map((attr) => attr.key);
    newRows.forEach((row) => {
        const src_indx = getSrcIndx(row.latitude, row.longitude, row.height_m);

        // create site accumulator if it does not exist
        if (sites[src_indx] === undefined) {
            sites[src_indx] = {};
            fields.forEach((k) => (sites[src_indx][k] = []));
        }

        // stop if there are three elements or azimuth has already been seen
        let azimuths = sites[src_indx].azimuth;
        if (azimuths.length >= 3) return;
        if (azimuths.indexOf(row.azimuth) !== -1) return;

        // ...else append all the fields
        fields.forEach((k) => sites[src_indx][k].push(row[k]));
    });

    // create geoJSON
    const geoJSON = {
        type: 'FeatureCollection',
        features: Object.keys(sites).map((k) => {
            const site = sites[k];

            const src_indx = parseInt(k);
            const props = { ...site };
            delete props.latitude;
            delete props.longitude;
            props.src_indx = src_indx;
            props.height_m = props.height_m[0];

            return {
                id: src_indx,
                type: 'Feature',
                properties: props,
                geometry: {
                    type: 'Point',
                    coordinates: [site.longitude[0], site.latitude[0]]
                }
            };
        })
    };

    return geoJSON
}
