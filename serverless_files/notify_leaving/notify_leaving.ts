import {AbstractParser,ParserContainer} from '../../parse_framework/Parser.class';
import {HttpParser} from '../../HttpParser.class';

let file_location = "serverless_files/notify_leaving/leaving_state.json";

class NotifyLeaving extends HttpParser{
    constructor( name, config ){
        super( {}, name, config );

        this.registerForStateChanges(this.stateChangeListener);
        
    }
    
    stateChangeListener(state){

        // check data is present
        if( state.obd===undefined || state.obd.previousState===undefined ){
            return;
        }

        // check data matches desired pre conditions
        let shouldContinue = state.obd.engine === 'on' && state.obd.previousState.engine === 'off';
        if( !shouldContinue ){
            return 
        }

        this.parse({pathName:"run"});

    }

    _shouldParse(parserObj){
        return /notify_leaving/.test(parserObj.pathName);
    }
    _transformObj(parserObj){return parserObj;}
    
    async _parse(obj){

        let toReturn;

        if( /add/.test(obj.pathName) ){

            let data = {leaving:true};
    
            await this.helpers.fsPromise.writeFile(file_location,JSON.stringify(data));
    
            toReturn = data;
        }

        if( /remove/.test(obj.pathName) ){

            let data = {leaving:false};
    
            await this.helpers.fsPromise.writeFile(file_location,JSON.stringify(data));
    
            toReturn = data;
        }


        if( /run/.test(obj.pathName) ){

            let data = JSON.parse(await this.helpers.fsPromise.readFile(file_location));

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