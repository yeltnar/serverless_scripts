import {AbstractParser,ParserContainer} from '../../parse_framework/Parser.class';
import {HttpParser} from '../../HttpParser.class';

let file_location = "serverless_files/notify_leaving/leaving_state.json";

class NotifyLeaving extends HttpParser{

    testRegex=/notify_leaving/;

    constructor( name, config ){
        super( name, config );

        this.state.registerForStateChanges(this.stateChangeListener);
        
    }
    
    stateChangeListener=(state)=>{

        // check data is present
        if( state.obd===undefined || state.obd.previousState===undefined ){
            return;
        }

        // check data matches desired pre conditions
        let shouldContinue = state.obd.engine === 'on' && state.obd.previousState.engine === 'off';
        if( !shouldContinue ){
            return 
        }

        console.log("Notify leaving state check good. Executing one time call")

        this.parse({pathName:"run"});

    }
    
    async _parse(obj){

        let toReturn;

        if( /add/.test(obj.pathName) ){

            let data = {leaving:true};
    
            this.state.setState(data);
    
            toReturn = data;
        }

        if( /remove/.test(obj.pathName) ){

            let data = {leaving:false};
    
            this.state.setState(data);
    
            toReturn = data;
        }


        if( /run/.test(obj.pathName) ){

            let data = await this.state.getState();

            if( data.leaving ){
                toReturn = "true";
                toReturn = await this._parse({"pathName":"remove"});

                let title = "One time notification";
                let message = "notify_leaving/run";

                this.pushNotification({title, message});
            }else{
                toReturn = "false";
            }
            

        }

        return toReturn;
    }
}

export {NotifyLeaving};