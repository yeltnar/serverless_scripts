import {Parser,ParserContainer} from '../../parse_framework/Parser.class';

class NotifyLeavingController extends Parser{
    constructor( name ){
        super( {}, name );
        
    }
    _shouldParse(parserObj){
        return /add_notify_leaving/.test(parserObj.pathName);
    }
    _transformObj(parserObj){return parserObj;}
    async _parse(obj){
        let parser = ParserContainer.addExposedParser( new NotifyLeaving() );
        return "worked "+parser.name;
    }
}

class NotifyLeaving extends Parser{
    constructor(){
        super( {"notify_leaving_call_count":0}, "" );
    }
    _shouldParse(parserObj){
        return /call_notify_leaving/.test(parserObj.pathName);
    }
    _transformObj(parserObj){return parserObj;}
    async _parse(){
        let title="Title";
        let message="About to remove one time call";
        this.pushNotification({title,message})
        console.log({title,message});
        this._delete();
        return "worked...it won't again"
    }
}

export {NotifyLeaving, NotifyLeavingController};