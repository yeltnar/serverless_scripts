import {HttpParser} from '../../HttpParser.class';
import { Parser, ParserContainer, AbstractParser } from '../../parse_framework/Parser.class';
import ResponseObj from '../../parse_framework/ResponseObj.interface'
const requestP = require('request-promise-native');

class Person extends HttpParser{

    testRegex = /person/;

    constructor( name, config, mainParserContainer ){
        super( name, config, mainParserContainer );
        
        this.parserContainer = new ParserContainer();

        this.parserContainer.addPrivateParser( new AddParser("set_"+name, config, this.state, mainParserContainer) );
        this.parserContainer.addPrivateParser( new GetParser("get_"+name, config, this.state, mainParserContainer) );

        this.state.registerForStateChanges( this.stateChangeCallback );
    }

    async _parse( parserObj:ResponseObj ){

        let result = await this.parserContainer.parsePrivate( parserObj );

        if( result.length === 1 ){
            result = result[0];
        }

        return result;
    }

    stateChangeCallback=async ( master_state )=>{

        return;

        let state = await this.state.getState();

        let title = "t";
        let message = JSON.stringify(master_state.obd);

        //if( master_state.obd  ){
            let res = await this.pushNotification({title, message});
            console.log(res);
            console.log(master_state);
        //}

    }
}

class AddParser extends Parser{
    
    testRegex=/set/;

    constructor(name, local_config, state, mainParserContainer){
        super(name, local_config, state, mainParserContainer);
    }

    async _parse(parserObj:ResponseObj){

        let person = parserObj.query_body.person;
        let person_state = parserObj.query_body.state;
        let state;
        
        if( typeof person_state === 'string' ){
            try{
                person_state = JSON.parse(person_state);
            }catch(e){}
        }

        if( person && person_state ){

            state = await this.state.getState();
            state[person] = person_state;
            this.state.setState(state);

            console.log("set "+person+" to ")
            console.log(state)

        }
        return state;
    }
}

class GetParser extends Parser{
    
    testRegex=/get/;

    constructor(name, local_config, state, mainParserContainer){
        super(name, local_config, state, mainParserContainer);
    }

    async _parse(parserObj:ResponseObj){

        //return "pkay"

        let person = parserObj.query_body.person;
        let person_state = parserObj.query_body.state;
        let state;

        if( person ){

            state = this.state.getState();
            state[person] = person_state;
            await this.state.setState(state);

        }
        return state;
        
    }
}

export default Person;