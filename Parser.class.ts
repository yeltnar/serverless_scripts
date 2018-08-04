abstract class Parser{

    helpers;
    config;
    parsers;

    constructor( helpers, config, parsers ){

        this.helpers = helpers;
        this.config = config;
        this.parsers = parsers;
        
    }

    abstract _shouldParse(parserObj): boolean;
    abstract _transformObj(parserObj);
    abstract async _doParse(doParseObj);

    parse( obj, local_call=false ){

        let doParseObj;

        if( local_call ){
            doParseObj = obj;
        }else{

            let parserObj={pathName:null,query_body:null,obj};

            let {pathName,query_body} = Parser._abstractTransformObj(obj);
            parserObj.pathName = pathName;
            parserObj.query_body = query_body;

            if( !this._shouldParse(parserObj) ){ return; }

            doParseObj = this._transformObj(parserObj)
        }
        
        this._doParse(doParseObj);

    };

    static _abstractTransformObj( obj ){

        let pathName = obj.request._parsedUrl.pathname;
        let query_body = {};

        for(let k in obj.request.query){
            query_body[k] = obj.request.query[k];
        }
        for(let k in obj.request.body){
            query_body[k] = obj.request.body[k];
        }

        return {pathName,query_body};

    };
}

export default Parser;