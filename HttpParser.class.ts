import {Parser,ParserContainer,AbstractParser} from './parse_framework/Parser.class'

abstract class HttpParser extends AbstractParser {

    parserContainer;

    constructor(parser_starting_state, name, config){
        super( parser_starting_state, name, config );

        this.parserContainer = ParserContainer;
    }

    _abstractTransformObj( obj ){

        let pathName = obj.request._parsedUrl.pathname;
        let query_body = {};

        for(let k in obj.request.query){
            query_body[k] = obj.request.query[k];
        }
        for(let k in obj.request.body){
            query_body[k] = obj.request.body[k];
        }

        let toReturn = {pathName,query_body,obj,response_device:undefined}

        if( obj.response_device!==undefined ){
            toReturn.response_device = obj.response_device;
        }else{
            obj.response_device = { 
                device_name: null,
                device_group: null,
                token:null,
                token_type:null
            };
        }

        return toReturn ;

    };

    abstract _shouldParse(parserObj): boolean;
    abstract _transformObj(parserObj);
    abstract _parse(doParseObj): Promise<any>;


}

export {HttpParser}