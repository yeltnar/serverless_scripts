import State from './Redux';
const schedule = require('node-schedule');
const uuidv4 = require('uuid/v4');

let pushNotification, helpers, config;

let state:State = new State();

class Parser{

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

    // TODO flesh out or reomve
    _shouldParse(parserObj): boolean{
        return true;
    };
    
    // TODO flesh out or reomve
    _transformObj(parserObj): boolean{
        return parserObj;
    };

    // TODO flesh out or reomve
    _parse(doParseObj): Promise<any>{
        return doParseObj;
    };

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
    
    static parseAll(obj):Array<any>{
        const parseObj = Parser._abstractTransformObj(obj)

        let resArr = Promise.all([ParserContainer.parseExposed(obj, parseObj), ParserContainer.parsePrivate(obj, parseObj)]);

        let exposedResult = resArr[0];
        let privateResult = resArr[1];

        return exposedResult.concat(privateResult);
    }

    static async parseExposed(obj, parserObj?):Promise<Array<any>>{
        return await ParserContainer.parseListObj( ParserContainer.exposedParsers, obj, parserObj );
    }
    
    static async parsePrivate(obj, parserObj?):Promise<Array<any>>{
        return await ParserContainer.parseListObj( ParserContainer.privateParsers, obj, parserObj );
    }

    private static async parseListObj(listObj, obj, parserObj):Promise<Array<any>>{

        parserObj = parserObj!==undefined ? parserObj : Parser._abstractTransformObj(obj);

        let results = [];

        for(let k in listObj ){
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

export {Parser, ParserContainer, parseInit}