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

    async getState(){
        let state_obj = StateLoader.state.getParserState(this.name) || this.getStateFromFs();
        return state_obj;
    }

    async getStateFromFs(){
        let stateFromFs = {};

        try{
            
            if( this.helpers.fsPromise.existsSync(this.init_state_file) ){
                let init_state_str = await this.helpers.fsPromise.readFile( this.init_state_file );
                stateFromFs = JSON.parse(init_state_str);
            }

        }catch(e){}

        return stateFromFs;
    }

    async setState( newState, should_write=true ){

        try{

            let previousState = await this.getState();

            if( previousState !== undefined && previousState.previousState !== undefined ){
                delete previousState.previousState;
            }

            newState.previousState = previousState;

            if( should_write ){
                try{
                    this.helpers.fsPromise.writeFile( this.init_state_file, JSON.stringify(newState) );
                }catch(e){console.error(e);}
            }

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