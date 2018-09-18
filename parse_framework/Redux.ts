//import {createStore, Store} from 'redux'
const fs = require('fs');

const state_obj_path:string = "state/master_state.json";

// these are basically static vars 
let state_has_changed = false;
let changed_state;

const checkForStateChange=()=>{
    if( state_has_changed && changed_state!==undefined ){

        process.send( {msg_from_ws_parser:"UPDATE_STATE"} );
        console.log("state changed; sent message");
        
        console.log( "state changed->writing "/*+ JSON.stringify(Object.keys( changed_state ))*/ )
        try{
            fs.writeFileSync(state_obj_path, JSON.stringify(changed_state) );
        }catch(e){
            console.error(e)
        }

    }
}
process.on("exit",()=>{console.log("exiting");});
process.on("exit",checkForStateChange);

class State{

    // currently just register on any changes... there are no sub groups
    private registered_state_functs:Array<Function>=[];

    can_update_state = new Promise((resolve)=>{resolve();});

    constructor(){

        // do this first if you want them to be called for the first set of data
        this.registerForStateChanges((new_state)=>{
            changed_state = new_state;
            state_has_changed = true;
        });

        // init state if it was there
        if( fs.existsSync(state_obj_path) ){
            const stateObj_str:string = fs.readFileSync(state_obj_path);
            this.can_update_state = this.init_replaceState( JSON.parse(stateObj_str) );
        }else{
            this.can_update_state = this.init_replaceState();
        }
        
    }

    init_replaceState(newState={}):Promise<any>{
        return this.replaceState(newState, false);
    }
    // this must be called in the constructor 
    // if nothing is passed in it returns the state object
    private replaceState=(newState?, call_callbacks=true):Promise<any>=>{

        let state = {};

        this.replaceState = async(newState?, call_callbacks=true):Promise<any>=>{

            await this.can_update_state;

            let promise_to_wait_on = new Promise((resolve)=>{resolve([])});

            if( newState!==undefined ){

                state = newState;

                if( call_callbacks ){
                    promise_to_wait_on = callRegisteredCallbacks(state)
                }
            }

            return promise_to_wait_on.then(()=>{
                return JSON.parse(JSON.stringify(state));
            });
        }

        const callRegisteredCallbacks=async (state):Promise<any>=>{


            let callpack_promise_arr:Array<Function> = []

            this.registered_state_functs.forEach((cur:Function, i, arr)=>{
                callpack_promise_arr.push( cur(state) );
            });

            return await Promise.all( callpack_promise_arr ).catch((e)=>{})
        }

        return this.replaceState(newState, call_callbacks);

    }

    replaceParserState=async(name:string, newState, caller_str?:string)=>{

        (()=>{
            let str="replace "+name;
            str += caller_str!==undefined ? " - caller_str='"+caller_str+"'" : "" ;
            console.log(str);
        })()

        let master_state = await this.getState();
        master_state[name] = newState;
        this.replaceState(master_state); // this returns a promise but we don't wait for it to resolve
        return newState;

    }

    getState=async():Promise<any>=>{
        return await this.replaceState(); // calling with no params returns the original state
    }

    getParserState=async(parser:string)=>{
        const state = await this.getState();
        return state[parser] || {};
    }

    registerForStateChanges = (funct:Function)=>{
        this.registered_state_functs.push( funct );
    }
}

export default State;