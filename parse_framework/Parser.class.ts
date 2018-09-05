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

    parserContainer=new ParserContainer();

    config; name; pushNotification; master_config; state:StateLoader; helpers;
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

    abstract testRegex:RegExp;
    abstract _abstractTransformObj(obj): object;

    async _parse( parseObj ):Promise<any>{

        let toReturn = await this.parserContainer.parsePrivate( parseObj );

        if( Array.isArray(toReturn) && toReturn.length===1 ){
            toReturn = toReturn[0];
        }

        console.log('toReturn')
        console.log(toReturn)

        return toReturn
    
    }

    _shouldParse(parserObj): boolean{
        return this.testRegex.test(parserObj.pathName);
    };
    
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

    // do I need this?
    private initStateFuncts(){}

    // _delete(){
    //     ParserContainer.removeParser(this.name);
    // }

    toJSON(){

        let childrenJSON = this.parserContainer.toPrivateJSON();

        // remove if have empty result
        if( childrenJSON.length === 0 ){
            childrenJSON = undefined;
        }

        return {
            name:this.name,
            testRegex: this.testRegex.toString(),
            childrenJSON,
            state:this.state.getState()
        }
    }
}

abstract class remove_AbstractSubParser extends AbstractParser{
    _abstractTransformObj(obj){return obj;}
}

abstract class Parser extends AbstractParser{
    
    _abstractTransformObj(obj):object{
        return obj;
    };
}

class FunctionalParser extends AbstractParser{

    testRegex:RegExp;

    constructor(name, local_config, state, parseFunction, testRegex, functionalShouldParse?){
        super(name, local_config, state);

        this.parseFunction = parseFunction;
        this.testRegex = testRegex;

        if( functionalShouldParse!== undefined && functionalShouldParse!==null ){
            this.functionalShouldParse = functionalShouldParse;
        }
    }
    _abstractTransformObj(obj):object{
        return obj;
    };

    _shouldParse(parseObj):boolean{
        let shouldParse:boolean = super._shouldParse(parseObj) || this.functionalShouldParse(parseObj);
        if(shouldParse){
            console.log("going to parse "+this.name)
        }
        return shouldParse;
    }

    private functionalShouldParse(parseObj):boolean{
        return false;
    }

    // stub to be over written 
    private async parseFunction(parseObj:ParserObj):Promise<any>{
        return parseObj;
    }

    async _parse(parseObj){
        return await this.parseFunction(parseObj);
    }
}

class ParserContainer{
    

    private static exposedParsers:any = {};  // these all should be AbstractParser s
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
    static async parse(name, parseObj:ParserObj):Promise<any>{

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

    toPrivateJSON(){

        let privateParsers = [];

        for(let k in this.privateParsers){
            privateParsers.push( this.privateParsers[k].toJSON() )
        }

        return (privateParsers);

    }

    static toJSON(){

        let staticParsers = [];

        for(let k in ParserContainer.exposedParsers){
            staticParsers.push( ParserContainer.exposedParsers[k].toJSON() )
        }

        return (staticParsers);
    }
}

function parseInit(init_pushNotification, init_config){
    pushNotification = init_pushNotification;
    config = init_config;
    return {};
}

export {Parser, ParserContainer, AbstractParser, parseInit, FunctionalParser}