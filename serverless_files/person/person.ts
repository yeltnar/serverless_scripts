import {HttpParser} from '../../HttpParser.class';
import { Parser, ParserContainer, AbstractParser, FunctionalParser, FunctionalParserObj } from '../../parse_framework/Parser.class';
import ResponseObj from '../../parse_framework/ResponseObj.interface'
const requestP = require('request-promise-native');

class Person extends HttpParser{

    testRegex = /person/;

    constructor( name, config, mainParserContainer ){
        super( name, config, mainParserContainer );


        for( let k in this.subParsers ){
            const cur:FunctionalParserObj = this.subParsers[k];

            this.parserContainer.addPrivateParser( new FunctionalParser(cur.name, this.config, this.state, cur.funct, cur.testRegex, this.mainParserContainer) )
        }

        this.state.registerForStateChanges( this.stateChangeCallback );
    }

    subParsers = {
        set:{
            name:"set",
            testRegex:/set\//,
            funct:async (parserObj:ResponseObj)=>{

                let person = parserObj.query_body.person;
                let person_state = parserObj.query_body.state;
                
                if( typeof person_state === 'string' ){
                    try{
                        person_state = JSON.parse(person_state);
                    }catch(e){}
                }
        
                if( person && person_state ){

                    person_state = await this.setPersonState(person, person_state);
        
                }else{
                    console.log("person & state");
                }

                return person_state;
            }
        },
        get:{
            name:"get",
            testRegex:/get/,
            funct:async (parserObj:ResponseObj)=>{
        
                let person = parserObj.query_body.person;
                let person_state;
        
                if( person ){

                    person_state = await this.getPersonState(person);
        
                }else{
                    console.error("person is required");
                }

                return person_state;
                
            }
        },
        set_location:{
            name:"set_location",
            testRegex:/set_location/,
            funct: async ( parserObj:ResponseObj)=>{

                const person = parserObj.query_body.person;
                const location = parserObj.query_body.location;
                let location_result;

                if( person && location ){
                    location_result = this.set_location( person, location );
                }else{
                    console.log("person && location");
                }

                return location_result;

                
            }
        }
    }

    set_location=async ( person:string, location:Array<string> )=>{

        let old_state = await this.getPersonState(person);

        let location_changed = old_state 
                               && old_state.location 
                               && !old_state.location.includes('home') 
                               && location.indexOf('home')>-1;
                               
        if( location_changed  ){

            const title = "You're at "+location;
            const message = "Glad you made it";
    
            this.pushNotification({title, message});
            console.log({title, message});

        }else{
            if( old_state && old_state.location  ){
                console.log('location didnt change location:'+location+"  old_state.location:"+old_state.location);
            }
        }


        const personState = (await this.getPersonState( person )) || {};

        personState.location = location;
        return await this.setPersonState(person, personState);
    }

    setPersonState=async ( person:string, personState:object )=>{
        
        let state = this.state.getState();
        state[person] = personState;
        await this.state.setState(state);
        return await this.getPersonState(person);
    }

    getPersonState=async ( person:string )=>{
        return (await this.state.getState()||{})[person];
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

export default Person;