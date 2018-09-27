import {createStore, Store} from 'redux'
const fs = require('fs');

const state_obj_path:string = "state/master_state.json";

let state_has_changed = false;

const checkForStateChange=()=>{
    if( state_has_changed ){
        process.send( {msg_from_ws_parser:"UPDATE_STATE"} );
        console.log("state changed; sent message");
    }
}
process.on("exit",checkForStateChange);

class State{
    private stateObj:any={};

    private store:Store;

    constructor(){

        // init state if it was there
        if( fs.existsSync(state_obj_path) ){
            const stateObj_str:string = fs.readFileSync(state_obj_path);
            this.stateObj = JSON.parse(stateObj_str);
        }

        this.store = createStore( this.reduxParse, this.stateObj );
        this.replaceState(this.stateObj);

        this.registerForStateChanges(this.stateChanged);

    }

    private reduxParse=(state, action)=>{

        const {type} = action;
        let newState={};

        if( type==="REPLACE" ){
            newState = action.newState;
        }

        if( type==="REPLACE_PARSER_STATE" ){
            this.stateObj[action.name] = action.newState;
            newState = this.stateObj;
        }

        if( type==="INIT_PARSER_STATE" ){
            this.stateObj[action.name] = action.newState;
            newState = this.stateObj;
        }

        return JSON.parse(JSON.stringify(newState)); // make sure new reference  
    }

    // replaceState(newState){
    //     this.store.dispatch({
    //         type:"REPLACE",
    //         newState
    //     });
    // }

    private replaceState(newState){
        this.store.dispatch({
            type:"REPLACE",
            newState
        });
    }

    replaceParserState(name, newState){
        this.store.dispatch({
            type:"REPLACE_PARSER_STATE",
            newState,
            name
        });
    }

    initParserState(name, newState){
        this.store.dispatch({
            type:"INIT_PARSER_STATE",
            newState,
            name
        });
    }

    getState( ){
        return this.store.getState();
    }

    getParserState(parser:string){
        return this.store.getState()[parser];
    }

    registerForStateChanges(funct){
        return this.store.subscribe(()=>{
            funct( this.store.getState() );
        });
    }

    private stateChanged=(changed_state)=>{

        state_has_changed = true;
        
        console.log( "state changed->writing "/*+ JSON.stringify(Object.keys( changed_state ))*/ )
        try{
            fs.writeFileSync(state_obj_path, JSON.stringify(changed_state) );
        }catch(e){
            console.error(e)
        }
    }

    // dispatch( dispatchObj ){
    //     return this.store.dispatch( dispatchObj );
    // }
}

export default State;