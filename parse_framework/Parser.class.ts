import helpers from '../helpers/helper'
import StateLoader from './StateLoader.class'
import State from './Redux';
import ParserObj from './ResponseObj.interface'

const schedule = require('node-schedule');
const uuidv4 = require('uuid/v4');

let pushNotification, config;

// this should be used sparingly 
//let state:State = new State();

let init_state_folder = "./state/";
const getFileName = (name)=>{
    init_state_folder+name+".json"
}


abstract class AbstractParser{

    config; name; pushNotification; master_config; state; helpers;
    instance_loaded_promise:Promise<any> = new Promise((res)=>{res()});

    constructor( name:string, local_config:object, state:StateLoader){
        //super(name, init_state_folder+name+".json");

        this.helpers = helpers;

        this.initStateFuncts()

        if( name===undefined || name==="" ){
            name = uuidv4();
        }

        this.pushNotification = pushNotification;
        this.config = local_config || {"error":"not_defined"};
        this.name = name;
        this.master_config = config;
        this.state = state;


        //this.instance_loaded_promise = this.getInitState(this.init_state_file)
    }

    // this _should_ be overridden by any class that extends this one
    abstract _abstractTransformObj(obj): object;

    abstract _shouldParse(parserObj): boolean;
    abstract _parse(doParseObj): Promise<any>;
    
    _transformObj(parserObj:ParserObj):ParserObj {
        return parserObj;
    }

    

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

    async toRemove_getInitState(init_state_file){

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

        this.state.setState(init_state, should_write);

        return init_state;
    }

    // do I need this?
    private initStateFuncts(){}

    // _delete(){
    //     ParserContainer.removeParser(this.name);
    // }
}

abstract class remove_AbstractSubParser extends AbstractParser{
    _abstractTransformObj(obj){return obj;}
}

abstract class Parser extends AbstractParser{
    
    // this should be overwritten by any class that extends this one
    _abstractTransformObj(obj):object{
        return obj;
    };
}

class ParserContainer{
    

    private static exposedParsers:any = {};
    private privateParsers:any = {};

    // add parsers

    static addStaticParser(parser:AbstractParser, allowReplace=false ){

        let name = parser.name || uuidv4();

        let alreadyThere = !(ParserContainer.exposedParsers[name]===undefined);

        if( allowReplace===true || !alreadyThere ){
            ParserContainer.exposedParsers[name] = parser;
        }else if( alreadyThere ){
            throw "ParserContainer.exposedParsers["+name+"] is defined!";
        }

        return parser;
    }

    addPrivateParser(parser:AbstractParser, allowReplace=false ){

        const name = parser.name

        let alreadyThere = !(ParserContainer.exposedParsers[name]===undefined && this.privateParsers[name]===undefined);

        if( allowReplace===true || !alreadyThere ){
            this.privateParsers[name] = parser;
        }else if( alreadyThere ){
            throw "ParserContainer.privateParsers["+name+"] is defined!";
        }
    }

    // call parsers // TODO rename this to be parse public or something like that 
    static async parse(name, parseObj):Promise<any>{

        let parser = ParserContainer.exposedParsers[name];

        let parseResult;

        if( parser ){
            parseResult = parser.parse(parseObj);
        }
        
        return parseResult;
    }
    
    async parsePrivate(obj, parserObj?):Promise<Array<any>>{
        return await ParserContainer.parseListObj( this.privateParsers, obj, parserObj );
    }

    static async parseExposed(obj, parserObj?):Promise<Array<any>>{
        
        return await ParserContainer.parseListObj( ParserContainer.exposedParsers, obj, parserObj );
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

    static removeExposedParser(name:string){
        if( ParserContainer.exposedParsers[name]!==undefined ){
            delete ParserContainer.exposedParsers[name];
        }else if( ParserContainer.exposedParsers[name]!==undefined ){
            throw "ParserContainer.exposedParsers["+name+"] is not defined!";
        }
    }

    removePrivateParser(name:string){
        if( this.privateParsers[name]!==undefined ){
            delete this.privateParsers[name];
        }else if( this.privateParsers[name]!==undefined ){
            throw "this.privateParsers["+name+"] is not defined!";
        }
    }
}

function parseInit(init_pushNotification, init_config){
    pushNotification = init_pushNotification;
    config = init_config;
    return {};
}

export {Parser, ParserContainer, AbstractParser, parseInit}