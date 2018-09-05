import State from './Redux';
import helpers from '../helpers/helper'

class StateLoader{


    // TODO this only allows for one state per app
    private static state:State = new State();
    
    helpers; name; init_state_file;

    constructor(name, init_state_file){
        
        this.helpers = helpers;
        //this.init_state_file = init_state_file===undefined ? init_state_file : init_state_folder+name+".json";
        this.init_state_file = init_state_file;
        this.name = name;
    }

    async getStateBreakReference(){
        let state_obj = StateLoader.state.getParserState(this.name);
        return JSON.parse(JSON.stringify(state_obj));
    }

    async getState(){
        let state_obj = StateLoader.state.getParserState(this.name);
        return state_obj;
    }

    async setState( newState ){

        try{

            let lastState = await this.getStateBreakReference();

            if( newState && newState.previousState ){
                delete newState.previousState;
            }

            if( lastState && lastState.previousState ){
                delete lastState.previousState;
            }

            newState.previousState = lastState;

            return StateLoader.state.replaceParserState(this.name, newState)
        }catch(e){
            console.error(e);
        }
    }

    registerForStateChanges( funct ){
        return StateLoader.state.registerForStateChanges( funct );
    }

}

export default StateLoader;