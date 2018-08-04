import Parser from '../../Parser.class';

class geofence extends Parser{
    constructor( helpers, config, parsers ){
        super( helpers, config, parsers );
    }
    _shouldParse(parserObj){
        return /geofence/.test(parserObj.pathName);
    }
    _transformObj(parserObj){return parserObj;}
    _doParse( parserObj ){
        let toReturn;
    
        toReturn = this._check_geofence( parserObj.query_body.lat, parserObj.query_body.lon );
    
        return toReturn;
    }

    _check_geofence( in_lat, in_lon ){

        let matched_locations = [];

        for(let k in this.config.points){
            let c_lat = this.config.points[k].lat;
            let c_lon = this.config.points[k].lon;

            let lat_distance = c_lat - in_lat;
            let lon_distance = c_lon - in_lon;

            let distance = Math.sqrt( Math.pow(lat_distance,2)+Math.pow(lon_distance,2) );

            if( distance <= this.config.points[k].threashold ){
                matched_locations.push(this.config.points[k].name);
            }
        }

        return matched_locations;

    }
}

export default geofence;