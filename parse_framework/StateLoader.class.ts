import ReduxState from './Redux';
import helpers from '../helpers/helper'

class StateLoader{


    // TODO this only allows for one state per app
    private static state:ReduxState = new ReduxState();
    
    helpers; name; init_state_file;

    constructor(name, init_state_file){
        
        this.helpers = helpers;
        //this.init_state_file = init_state_file===undefined ? init_state_file : init_state_folder+name+".json";
        this.init_state_file = init_state_file;
        this.name = name;
    }

    static async updateState():Promise<any>{
        console.log("updating loaded master state")
        StateLoader.state = new ReduxState();
        console.log("state updated");
    }

    async getStateBreakReference(){
        let state_obj = await StateLoader.state.getParserState(this.name) || {};
        return JSON.parse(JSON.stringify(state_obj));
    }

    async getState(){
        let state_obj = await StateLoader.state.getParserState(this.name);
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