import State from './Redux';
const schedule = require('node-schedule');
const uuidv4 = require('uuid/v4');

let pushNotification, helpers, config;

let state:State = new State();

abstract class AbstractParser{

    helpers; config; name; pushNotification; master_config;

    constructor( parser_starting_state:object, name:string ){

        if( name===undefined || name==="" ){
            name = uuidv4();
        }

        this.pushNotification = pushNotification;
        this.helpers = helpers;
        this.config = config[name] || {"error":"not_defined"};
        this.name = name;
        this.master_config = config;

        state.replaceParserState(this.name, parser_starting_state);
    }

    // this _should_ be overridden by any class that extends this one
    abstract _abstractTransformObj(obj): object;

    abstract _shouldParse(parserObj): boolean;
    abstract _transformObj(parserObj): boolean;
    abstract _parse(doParseObj): Promise<any>;

    async checkAndParse(parserObj){

        let toReturn;

        if( this._shouldParse(parserObj) ){

            let current_doParseObj = this._transformObj(parserObj)

            toReturn = this.parse( current_doParseObj );

        }

        return toReturn;
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
        return state.registerForStateChanges( funct );
    }
    _delete(){
        ParserContainer.removeParser(this.name);
    }

}

class Parser extends AbstractParser{

    constructor( parser_starting_state, name ){
        super( parser_starting_state, name );
    }
    
    // this should be overwritten by any class that extends this one
    _abstractTransformObj(obj):object{
        return obj;
    };
    
    // this should be overwritten by any class that extends this one
    _shouldParse(parserObj):boolean{
        return true;
    };
    
    // this should be overwritten by any class that extends this one
    _transformObj(parserObj):boolean{
        return parserObj;
    };
    
    async _parse(doParseObj):Promise<any>{

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

        return parser;
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

    static async parseExposed(obj, parserObj?):Promise<Array<any>>{
        
        return await ParserContainer.parseListObj( ParserContainer.exposedParsers, obj, parserObj );
    }
    
    static async parsePrivate(obj, parserObj?):Promise<Array<any>>{
        return await ParserContainer.parseListObj( ParserContainer.privateParsers, obj, parserObj );
    }

    // function for parseExposed and parsePrivate to call
    private static async parseListObj(listObj, obj, parserObj):Promise<Array<any>>{

        //parserObj = parserObj!==undefined ? parserObj : Parser._abstractTransformObj(obj);

        let results = [];

        for(let k in listObj ){
            parserObj = parserObj!==undefined ? parserObj : listObj[k]._abstractTransformObj(obj);

            let parseResult = await listObj[k].checkAndParse(parserObj);

            if( parseResult!==undefined ){
                results.push( parseResult );
            }
        }

        return results;

    }

    // remove parsers

    //TODO do this...mebe
    static removeParser(name:string){

        let result = {
            removeExposedParser_result:undefined,
            removePrivateParser_result:undefined
        };

        try{
            result.removeExposedParser_result = this.removeExposedParser(name);
        }catch(e){}
        
        try{
            result.removePrivateParser_result = this.removePrivateParser(name);
        }catch(e){}

        return result;
        

    }

    static removeExposedParser(name:string){
        if( ParserContainer.exposedParsers[name]!==undefined ){
            delete ParserContainer.exposedParsers[name];
        }else if( ParserContainer.exposedParsers[name]!==undefined ){
            throw "ParserContainer.exposedParsers["+name+"] is not defined!";
        }
    }

    static removePrivateParser(name:string){
        if( ParserContainer.privateParsers[name]!==undefined ){
            delete ParserContainer.privateParsers[name];
        }else if( ParserContainer.privateParsers[name]!==undefined ){
            throw "ParserContainer.privateParsers["+name+"] is not defined!";
        }
    }

    notify(){

    }
}

function parseInit(init_pushNotification, init_helpers, init_config){
    pushNotification = init_pushNotification;
    helpers = init_helpers
    config = init_config
    return {};
}

export {Parser, ParserContainer, AbstractParser, parseInit}