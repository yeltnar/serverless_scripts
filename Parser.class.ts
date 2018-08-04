abstract class Parser{

    helpers;
    config;
    parsers;

    private static parserList=[];

    static parseAll(obj){

        let parserObj = Parser._abstractTransformObj(obj);

        Parser.parserList.forEach(( current_parser )=>{
    
            if( !current_parser._shouldParse(parserObj) ){ return; }
    
            let current_doParseObj = current_parser._transformObj(parserObj)

            current_parser.parse( current_doParseObj );
        })
        
    }

    constructor( helpers, config, parsers ){

        this.helpers = helpers;
        this.config = config;
        this.parsers = parsers;

        Parser.parserList.push(this);
        
    }

    abstract _shouldParse(parserObj): boolean;
    abstract _transformObj(parserObj);
    abstract _doParse(doParseObj): Promise<any>;

    parse( obj ){
        
        return this._doParse( obj );

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
}

export default Parser;