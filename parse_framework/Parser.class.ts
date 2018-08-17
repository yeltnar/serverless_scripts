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

        let previousState = this.getState();

        if( previousState !== undefined && previousState.previousState !== undefined ){
            delete previousState.previousState;
        }

        newState.previousState = previousState;

        if( should_write ){
            try{
                this.helpers.fsPromise.writeFile( this.init_state_file, JSON.stringify(newState) );
            }catch(e){console.error(e);}
        }

        return StateLoader.state.replaceParserState(this.name, newState)
    }

    registerForStateChanges( funct ){
        return StateLoader.state.registerForStateChanges( funct );
    }

}

abstract class AbstractParser extends StateLoader{

    config; name; pushNotification; master_config; parserContainer;
    instance_loaded_promise:Promise<any> = new Promise((res)=>{res()});

    constructor( parser_starting_state:object, name:string, init_config:object, parserContainer:ParserContainer ){
        super(name, init_state_folder+name+".json");

        this.initStateFuncts()

        if( name===undefined || name==="" ){
            name = uuidv4();
        }

        this.pushNotification = pushNotification;
        this.config = init_config || {"error":"not_defined"};
        this.name = name;
        this.master_config = config;
        this.parserContainer = parserContainer;


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

    async parse( obj ){

        await this.instance_loaded_promise;
        
        try{
            return await this._parse( obj );
        }catch(e){
            console.error(e);
        }

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

        this.setState(init_state, should_write);

        return init_state;
    }

    // do I need this?
    private initStateFuncts(){}

    _delete(){
        if( this.parserContainer!==undefined && this.parserContainer!==null ){
            this.parserContainer.removeParser(this.name);
        }
    }
}


class ParserContainer{
    

    private exposedParsers:any = {};
    private privateParsers:any = {};

    // add parsers

    addExposedParser(parser:AbstractParser, allowReplace=false ){

        let name = parser.name || uuidv4();

        let alreadyThere = !(this.exposedParsers[name]===undefined && this.privateParsers[name]===undefined);

        if( allowReplace===true || !alreadyThere ){
            this.exposedParsers[name] = parser;
        }else if( alreadyThere ){
            throw "this.exposedParsers["+name+"] is defined!";
        }

        return parser;
    }

    addPrivateParser(parser:AbstractParser, allowReplace=false ){

        const name = parser.name

        let alreadyThere = !(this.exposedParsers[name]===undefined && this.privateParsers[name]===undefined);

        if( allowReplace===true || !alreadyThere ){
            this.privateParsers[name] = parser;
        }else if( alreadyThere ){
            throw "this.privateParsers["+name+"] is defined!";
        }
    }

    // call parsers
    
    async parse(name, parseObj):Promise<any>{

        let parser = this.exposedParsers[name] || this.privateParsers[name];

        let parseResult;

        if( parser ){
            parseResult = parser.parse(parseObj);
        }
        
        return parseResult;
    }

    async parseExposed(obj, parserObj?):Promise<Array<any>>{
        
        return await this.parseListObj( this.exposedParsers, obj, parserObj );
    }
    
    async parsePrivate(obj, parserObj?):Promise<Array<any>>{
        return await this.parseListObj( this.privateParsers, obj, parserObj );
    }

    // function for parseExposed and parsePrivate to call
    private async parseListObj(listObj, obj, parserObj):Promise<Array<any>>{

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
    removeParser(name:string){

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

    removeExposedParser(name:string){
        if( this.exposedParsers[name]!==undefined ){
            delete this.exposedParsers[name];
        }else if( this.exposedParsers[name]!==undefined ){
            throw "this.exposedParsers["+name+"] is not defined!";
        }
    }

    removePrivateParser(name:string){
        if( this.privateParsers[name]!==undefined ){
            delete this.privateParsers[name];
        }else if( this.privateParsers[name]!==undefined ){
            throw "this.privateParsers["+name+"] is not defined!";
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

export {/*Parser,*/ ParserContainer, AbstractParser, parseInit}


// class Parser extends AbstractParser{

//     constructor( parser_starting_state, name, config={} ){
//         super( parser_starting_state, name, config );
//     }
    
//     // this should be overwritten by any class that extends this one
//     _abstractTransformObj(obj):object{
//         return obj;
//     };
    
//     // this should be overwritten by any class that extends this one
//     _shouldParse(parserObj):boolean{
//         return true;
//     };
    
//     // this should be overwritten by any class that extends this one
//     _transformObj(parserObj):boolean{
//         return parserObj;
//     };
    
//     async _parse(doParseObj):Promise<any>{

//     };

// }