import State from './Redux';
const schedule = require('node-schedule');
const uuidv4 = require('uuid/v4');

let pushNotification, helpers, config;

// this should be used sparingly 
//let state:State = new State();

let init_state_folder = "./state/";

class StateLoader{

    helpers; name; init_state_file;

    constructor(name, init_state_file){
        this.helpers = helpers;
        this.init_state_file = init_state_file;
        this.name = name;
    }

    // TODO this only allows for one state per app
    private static state:State = new State();

    getState(){
        let state_obj = StateLoader.state.getParserState(this.name)||{};
        return state_obj;
    }

    setState( newState, should_write=true ){

        if( should_write ){
            try{
                this.helpers.fsPromise.writeFile( this.init_state_file, JSON.stringify(newState) );
            }catch(e){console.error(e);}
        }

        let oldState = this.getState();

        if( oldState !== undefined && oldState.oldState !== undefined ){
            delete oldState.oldState;
        }

        newState.oldState = oldState;

        return StateLoader.state.replaceParserState(this.name, newState)
    }

    registerForStateChanges( funct ){
        return StateLoader.state.registerForStateChanges( funct );
    }

}

abstract class AbstractParser extends StateLoader{

    config; name; pushNotification; master_config;
    instance_loaded_promise:Promise<any> = new Promise((res)=>{res()});

    constructor( parser_starting_state:object, name:string, init_config:object ){
        super(name, init_state_folder+name);

        this.initStateFuncts()

        if( name===undefined || name==="" ){
            name = uuidv4();
        }

        this.pushNotification = pushNotification;
        this.config = init_config || {"error":"not_defined"};
        this.name = name;
        this.master_config = config;


        this.instance_loaded_promise = this.getInitState(this.init_state_file)
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

    async getInitState(init_state_file){
        let init_state = {};
        let should_write=false;

        if( !this.helpers.fsPromise.existsSync(init_state_folder) ){
            this.helpers.fsPromise.mkdir(init_state_folder);
        }

        if( this.helpers.fsPromise.existsSync(init_state_file) ){
            let init_state_str = await this.helpers.fsPromise.readFile( init_state_file );
            init_state = JSON.parse(init_state_str);
        }else{
            should_write = true;
        }

        console.log(this.name+" state is "+JSON.stringify(init_state))

        this.setState(init_state, should_write);

        return init_state;
    }

    // do I need this?
    private initStateFuncts(){}

    _delete(){
        ParserContainer.removeParser(this.name);
    }
}

class Parser extends AbstractParser{

    constructor( parser_starting_state, name, config={} ){
        super( parser_starting_state, name, config );
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