import { HttpParser } from '../HttpParser.class';

class geofence extends HttpParser{
    constructor( name, config ){
        super( {}, name, config );
    }
    _shouldParse(parserObj){
        return false; // return /geofence/.test(parserObj.pathName);
    }
    _transformObj(parserObj){return parserObj;}
    async _parse(){}
}

export default geofence;