let geofence_config, helpers;

function geofence(parse_obj){
    let toReturn;

    toReturn = check_geofence( parse_obj.query_body.lat, parse_obj.query_body.lon );

    return toReturn;
}

function check_geofence( in_lat, in_lon ){

    let matched_locations = [];

    for(let k in geofence_config.points){
        let c_lat = geofence_config.points[k].lat;
        let c_lon = geofence_config.points[k].lon;

        let lat_distance = c_lat - in_lat;
        let lon_distance = c_lon - in_lon;

        let distance = Math.sqrt( Math.pow(lat_distance,2)+Math.pow(lon_distance,2) );

        if( distance <= geofence_config.points[k].threashold ){
            matched_locations.push(k);
        }
    }

    return matched_locations;

}

function geofence_init( helpers_local, geofence_config_local ){
    geofence_config = geofence_config_local;
    helpers = helpers_local;
    return geofence;
}

export default geofence_init;