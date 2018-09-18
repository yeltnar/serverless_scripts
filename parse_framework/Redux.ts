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
            console.log("written")
            console.log("state_obj_path")
            console.log(state_obj_path)
            console.log(changed_state)
        }catch(e){
            console.error(e)
        }

    }
}
process.on("exit",checkForStateChange);

class State{

    // currently just register on any changes... there are no sub groups
    private registered_state_functs:Array<Function>=[];

    constructor(){
        this.init_replaceState();

        // do this first if you want them to be called for the first set of data
        this.registerForStateChanges((new_state)=>{
            changed_state = new_state;
            state_has_changed = true;
        });

        // init state if it was there
        if( fs.existsSync(state_obj_path) ){
            const stateObj_str:string = fs.readFileSync(state_obj_path);
            this.replaceState( JSON.parse(stateObj_str) );
        }

        //this.store = createStore( this.reduxParse, this.stateObj );
        
    }

    init_replaceState():Promise<any>{return this.replaceState({});}
    // this must be called in the constructor 
    // if nothing is passed in it returns the state object
    replaceState=(newState?):Promise<any>=>{

        let state = {};

        this.replaceState = (newState?):Promise<any>=>{

            let promise_to_wait_on = new Promise((resolve)=>{resolve([])});

            if( newState!==undefined ){

                state = newState;

                promise_to_wait_on = callRegisteredCallbacks(state)

                console.log("replacing state")
                console.log("newState")
                console.log(newState)
            }

            return promise_to_wait_on.then(()=>{
                return JSON.parse(JSON.stringify(state));
            });
        }

        const callRegisteredCallbacks=async (state):Promise<any>=>{


            let callpack_promise_arr:Array<Function> = []

            this.registered_state_functs.forEach((cur:Function, i, arr)=>{
                callpack_promise_arr.push( cur(state) );
                console.log("callRegisteredCallbacks loop");
            });

            return await Promise.all( callpack_promise_arr ).catch((e)=>{})
        }

        return this.replaceState(newState);

    }

    replaceParserState(name:string, newState){

        let master_state = this.getState();
        master_state[name] = newState;
        this.replaceState(master_state); // this returns a promise but we don't wait for it to resolve
        return newState;

    }

    getState=async():Promise<any>=>{
        return await this.replaceState(); // calling with no params returns the original state
    }

    getParserState=async(parser:string)=>{
        const state = await this.getState();
        return state[parser];
    }

    registerForStateChanges = (funct:Function)=>{
        this.registered_state_functs.push( funct );
    }
}

export default State;