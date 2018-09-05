import {HttpParser} from '../../HttpParser.class';
import { ParserContainer } from '../../parse_framework/Parser.class';

class geofence extends HttpParser{

    testRegex=/geofence/;

    parserContainer:ParserContainer;

    constructor(name, config ){

        super( name, config );

    }

    async _parse(parserObj){
        let toReturn;

        if( /get_close_locations/.test(parserObj.pathName) ){
            toReturn = await this._check_geofence( parserObj.query_body.lat, parserObj.query_body.lon );
        }

        if( /add/.test(parserObj.pathName) ){
            toReturn = await this.add_location(parserObj)
        }
    
        return toReturn;
    }

    private  async _check_geofence( in_lat, in_lon ){
 
         let matched_locations = [];

         let location_arr = (await this.state.getState()).points || this.config.points;

         console.log("location_arr")
         console.log(location_arr.length)
         console.log(location_arr)
 
         for(let k in location_arr){
             let c_lat = location_arr[k].lat;
             let c_lon = location_arr[k].lon;
 
             let lat_distance = c_lat - in_lat;
             let lon_distance = c_lon - in_lon;
 
             let distance = Math.sqrt( Math.pow(lat_distance,2)+Math.pow(lon_distance,2) );
 
             if( distance <= location_arr[k].threashold ){
                 matched_locations.push(location_arr[k].name);
             }
         }
 
         return matched_locations;
 
    }

    private async add_location(parserObj){

        let toReturn="";

        if( parserObj.query_body.name!==undefined && parserObj.query_body.lat!==undefined && parserObj.query_body.lon!==undefined && parserObj.query_body.threashold!==undefined ){

            let points = (await this.state.getState()).points;

            if( points === undefined ){
                points = this.config.points;
                console.log("setting up state points for geofence")
            }

            let name = parserObj.query_body.name;
            let lat = parserObj.query_body.lat;
            let lon = parserObj.query_body.lon;
            let threashold = parserObj.query_body.threashold;

            points.push({name,lat,lon,threashold});

            this.state.setState( {points} );

            return await this.state.getState();

        }else{
            toReturn = "parserObj.name && parserObj.lat && parserObj.lon && parserObj.threashold";
        }

        return toReturn;
     }
}

export default geofence;