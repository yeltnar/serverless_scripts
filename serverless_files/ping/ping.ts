import {HttpParser} from '../../HttpParser.class';
const requestP = require('request-promise-native');

class Ping extends HttpParser{

    constructor( name, config ){
        super( name, config );
    }
    _shouldParse(parserObj){
        return /ping/.test(parserObj.pathName);
    }

    _transformObj(parserObj){
        return parserObj;
    }

    async _parse( parserObj ){

        let now = new Date();

        let start = new Date(parserObj.obj.date);

        return {
            'time_at_ping_parse':now.toString(),
            'time_at_ping_parse_ms':now.getTime(),

            'start':start.toString(),
            'start_ms':start.getTime(),

            'ms_to_parse':now.getTime()-start.getTime()
        };
    }
}

export default Ping;