import {createStore, Store} from 'redux'

class State{
    private stateObj:any={};

    private store:Store;

    constructor(){
        this.store = createStore( this.reduxParse, this.stateObj );
        this.store.subscribe(this.stateChanged)
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

        //newState = newState ? newState : {};

        return JSON.parse(JSON.stringify(newState)); // make sure new refrence 
    }

    // replaceState(newState){
    //     this.store.dispatch({
    //         type:"REPLACE",
    //         newState
    //     });
    // }

    replaceParserState(name, newState){
        this.store.dispatch({
            type:"REPLACE_PARSER_STATE",
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

    private stateChanged=()=>{
        console.log( Object.keys(this.store.getState()) )
    }

    // dispatch( dispatchObj ){
    //     return this.store.dispatch( dispatchObj );
    // }
}

export default State;