import State from './Redux';
const schedule = require('node-schedule');

const uuidv4 = require('uuid/v4');

let state:State = new State();

abstract class Parser{

    name;
    helpers;
    config;

    constructor( helpers, config, name:string, parser_starting_state={} ){

        this.helpers = helpers;
        this.config = config;
        this.name = name;

        state.replaceParserState(this.name, parser_starting_state);
    }

    abstract _shouldParse(parserObj): boolean;
    abstract _transformObj(parserObj);
    abstract _parse(doParseObj): Promise<any>;

    checkAndParse(parserObj){

        if( this._shouldParse(parserObj) ){

            let current_doParseObj = this._transformObj(parserObj)

            this.parse( current_doParseObj );

        }
    }

    parse( obj ){
        
        return this._parse( obj );

    };

    getState(){
        return state.getParserState(this.name);
    }

    setState( newState ){
        return state.replaceParserState(this.name, newState)
    }

    registerForStateChanges( funct ){
        state.registerForStateChanges( funct );
    }

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

class ParserContainer{

    private static exposedParsers:any = {};
    private static privateParsers:any = {};

    // add parsers

    static addExposedParser(parser:Parser, allowReplace=false ){

        let name = parser.name || uuidv4();

        let alreadyThere = !(ParserContainer.exposedParsers[name]===undefined && ParserContainer.privateParsers[name]===undefined);

        if( allowReplace===true || !alreadyThere ){
            ParserContainer.exposedParsers[name] = parser;
        }else if( alreadyThere ){
            throw "ParserContainer.exposedParsers["+name+"] is defined!";
        }
    }

    static addPrivateParser(parser:Parser, allowReplace=false ){

        const name = parser.name

        let alreadyThere = !(ParserContainer.exposedParsers[name]===undefined && ParserContainer.privateParsers[name]===undefined);

        if( allowReplace===true || !alreadyThere ){
            ParserContainer.privateParsers[name] = parser;
        }else if( alreadyThere ){
            throw "ParserContainer.privateParsers["+name+"] is defined!";
        }
    }

    // call parsers
    
    static async parse(name, parseObj):Promise<any>{

        let parser = ParserContainer.exposedParsers[name] || ParserContainer.privateParsers[name];

        let parseResult;

        if( parser ){
            parseResult = parser.parse(parseObj);
        }
        
        return parseResult;
    }
    
    static parseAll(obj):Array<any>{
        const parseObj = Parser._abstractTransformObj(obj)
        
        let exposedResult = ParserContainer.parseExposed(obj, parseObj);
        let privateResult = ParserContainer.parsePrivate(obj, parseObj);

        return exposedResult.concat(privateResult);
    }

    static parseExposed(obj, parserObj?):Array<any>{
        return ParserContainer.parseListObj( ParserContainer.exposedParsers, obj, parserObj );
    }
    
    static parsePrivate(obj, parserObj?):Array<any>{
        return ParserContainer.parseListObj( ParserContainer.privateParsers, obj, parserObj );
    }

    private static parseListObj(listObj, obj, parserObj):Array<any>{

        parserObj = parserObj!==undefined ? parserObj : Parser._abstractTransformObj(obj);

        let results = [];

        for(let k in listObj ){
            results.push(listObj[k].checkAndParse(parserObj));
        }

        return results;

    }

    // remove parsers

    static removeExposedParser(name){
        if( ParserContainer.exposedParsers[name]!==undefined ){
            delete ParserContainer.exposedParsers[name];
        }else if( ParserContainer.exposedParsers[name]!==undefined ){
            throw "ParserContainer.exposedParsers["+name+"] is not defined!";
        }
    }

    static removePrivateParser(name){
        if( ParserContainer.privateParsers[name]!==undefined ){
            delete ParserContainer.privateParsers[name];
        }else if( ParserContainer.privateParsers[name]!==undefined ){
            throw "ParserContainer.privateParsers["+name+"] is not defined!";
        }
    }

    //TODO do this...mebe
    private static removeParser(name:string){

    }
}

export {Parser, ParserContainer};