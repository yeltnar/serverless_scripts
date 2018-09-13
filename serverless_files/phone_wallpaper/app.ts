import {HttpParser} from '../../HttpParser.class';
import { Parser, FunctionalParser, ParserContainer, FunctionalParserObj } from '../../parse_framework/Parser.class';
import ResponseObj from '../../parse_framework/ResponseObj.interface';
const requestP = require("request-promise-native");

class PhoneWallpaper extends HttpParser{

    testRegex = /wallpaper/;

    constructor( name, config, mainParserContainer ){
        super( name, config, mainParserContainer );

        for( let k in this.functionalParsersObj ){
            let cur:FunctionalParserObj = this.functionalParsersObj[k];
            let parseFunction = cur.funct;

            this.parserContainer.addPrivateParser( 
                new FunctionalParser(
                    cur.name, 
                    config, 
                    this.state, 
                    parseFunction, 
                    cur.testRegex, 
                    this.mainParserContainer,
                    cur.functionalShouldParse
                )
            );
        }

    }

    private setPreselectedWallpaper=async (reqObj)=>{

        let query_body = reqObj.query_body
        console.log("using preselected: "+query_body.imgUrl);
        try{
            this.sendSetPhoneWallpaperRequest({"wallpaper_url":query_body.imgUrl});
        }catch(e){
            console.error(e);
        }
    }

    private getSavedWallpapers=async ():Promise<Array<string>>=>{
        let toReturn;
        try{
            let toPrint = await this.getUsedWallpapers();
            toReturn = toPrint;
            console.log("getSavedWallpapers");
        }catch(e){
            console.error(e);
        }
        return toReturn;
    }

    private topWallpaper=async ()=>{

        let toReturn;

        console.log("running top wallpaper");
        try{
            let wallpaper_info = await this.getPhoneWallpaperFromInternet();
            this.sendSetPhoneWallpaperRequest(wallpaper_info);
            toReturn = {};
            if( wallpaper_info.wallpaper_url === undefined ){
                wallpaper_info.wallpaper_url = "undefined";
            }
            toReturn.wallpaper_info = wallpaper_info;
        }catch(e){
            console.error(e);
        }

        return toReturn

    }

    private getLastWallpaper=async ():Promise<string>=>{
        let toReturn;
        try{
            let toPrint = await this.getUsedWallpapers();
            toReturn = toPrint.pop();
            console.log("getLastWallpaper");
        }catch(e){
            console.error(e);
        }
        return toReturn;
    }

    private newWallpaper=async ()=>{

        console.log("setting new wallpaper");
        try{
            let walpaper_info = await this.getPhoneWallpaperFromInternet( true )
            this.sendSetPhoneWallpaperRequest(walpaper_info);
        }catch(e){
            console.error(e);
        }
    }

    private saveLastWallpaper=async ()=>{
        try{
            let last_used_wallpaper_url_arr = await this.getUsedWallpapers();
            let last_used_wallpaper_url = last_used_wallpaper_url_arr[last_used_wallpaper_url_arr.length-1];

            let savedWallpaperArr = ( await this.getSavedWallpapaers() );

            if(savedWallpaperArr.indexOf(last_used_wallpaper_url)<0){
                savedWallpaperArr.push(last_used_wallpaper_url);
            }
            await this.saveWallpapers(savedWallpaperArr);

            console.log(JSON.stringify(savedWallpaperArr));
        }catch(e){
            console.error(e);
        }
    }

    private openSavedWallpapers=async ():Promise<string>=>{
        let toReturn="";
        try{
            let last_used_wallpaper_arr = (await this.getSavedWallpapaers());

            let toLog = "<script>"+JSON.stringify(last_used_wallpaper_arr)+".forEach((ele)=>{window.open(ele);}); </script>";
            
            toReturn = toLog;

            console.log(toLog)
        }catch(e){
            console.error(e);
        }
        return toReturn;
    }

    async sendSetPhoneWallpaperRequest(walpaper_info) {
    
        let {wallpaper_url, used_wallpaper} = walpaper_info;
    
        if(used_wallpaper===undefined){
            console.log("getting used wallpaper");
            try{
                used_wallpaper = await this.getUsedWallpapers();
            }catch(e){
                used_wallpaper=[];
            }
        }
    
        if(wallpaper_url!==undefined){
            console.log("setting walpaper to " + wallpaper_url);
            
            let options = {
                "url":this.config.set_wallpaper_url,
                "method": "post",
                "body": {
                    "value1":wallpaper_url,
                    "value2":"Device: "+"funny finding this, isn't it?"
                },
                "json":true
            };
            await requestP(options);
            this.pushNotification({title:"set_wallpaper", message:wallpaper_url, link:wallpaper_url});
            used_wallpaper.push(wallpaper_url);
            used_wallpaper=used_wallpaper.slice(-10);
            this.saveUsedWallpapers(used_wallpaper)
        }else{
            console.log("not setting walpaper to " + wallpaper_url);
        }
    }

    async getPhoneWallpaperFromInternet( force_new=false ) {
    
        let wallpaper_url="";
        let used_wallpapers:any=[];
    
        try {
            let options = {
                "url": this.config.search_url
            }
    
            let search_result = await requestP(options)
            search_result = JSON.parse(search_result);
            search_result = search_result.data.children;
            search_result = search_result.map((ele) => {
                let toReturn = undefined;
                if( !ele.data.over_18 ){
                    return ele.data.url;
                }
                return toReturn;
            });
    
            used_wallpapers = await this.getUsedWallpapers();
    
            if( force_new ){
    
                // find wallpaper not in the save 
                wallpaper_url = search_result.reduce((acc, cur) => {
                    if (acc === undefined && used_wallpapers.indexOf(cur)<0) {
                        acc = cur;
                    }
                    return acc;
                }, undefined);
    
            }else{
    
                if( used_wallpapers.indexOf(search_result[0])<0 ){
                    wallpaper_url = search_result[0]; // only send top result
                }else{
                    wallpaper_url = undefined;
                }
            }
    
        } catch (e) {
            console.error(e)
        }
        return {wallpaper_url,used_wallpapers};
    }

    // start of local functions

    private saveWallpapers=async ( savedWallpaperArr )=>{
        //return await this.helpers.fsPromise.writeFile(this.config.saved_wallpaper_file, JSON.stringify(savedWallpaperArr))
        let state = await this.state.getState();
        console.log("savedWallpaperArr "+JSON.stringify(savedWallpaperArr))
        state.savedWallpaperArr = savedWallpaperArr;
        await this.state.setState(state);
    }

    private saveUsedWallpapers=async( used_wallpaper_arr:[string] )=>{
        //return await this.helpers.fsPromise.writeFile(this.config.used_wallpaper_file, JSON.stringify(used_wallpaper));
        let state = await this.state.getState();
        state.usedWallpaperArr = used_wallpaper_arr;
        await this.state.setState(state);
    }

    private getUsedWallpapers=async ():Promise<[string]>=>{
        //return await this.helpers.fsPromise.readFile(this.config.used_wallpaper_file)
        //state.usedWallpaperArr
        return (await this.state.getState()).usedWallpaperArr || [];
    }

    private getSavedWallpapaers=async ():Promise<Array<string>>=>{
        //return await this.helpers.fsPromise.readFile(this.config.saved_wallpaper_file)
        return (await this.state.getState()).savedWallpaperArr || [];
    }

    functionalParsersObj:Array<FunctionalParserObj>=[
        {
            "name":"setPreselectedWallpaper",
            "funct":this.setPreselectedWallpaper,
            "testRegex":/set\//,
            functionalShouldParse:(parseObj)=>{
                let query_body = parseObj.query_body;
                return (query_body.preSelected===true||query_body.preSelected==="true") && query_body.imgUrl!==undefined
            }
        },{
            "name":"getSavedWallpapers",
            "funct":this.getSavedWallpapers,
            "testRegex":/get_saved/,
            functionalShouldParse:(parseObj)=>{
                let query_body = parseObj.query_body;
                return query_body.getSaved===true||query_body.getSaved==="true"
            }
        },{
            "name":"topWallpaper",
            "funct":this.topWallpaper,
            "testRegex":/set_top/,
            functionalShouldParse:(parseObj)=>{return false}
        },{
            "name":"getLastWallpaper",
            "funct":this.getLastWallpaper,
            "testRegex":/get_last/,
            functionalShouldParse:(parseObj)=>{
                let query_body = parseObj.query_body;
                return (query_body.getLastWallpaper===true||query_body.getLastWallpaper==="true")
            }
        },{
            "name":"newWallpaper",
            "funct":this.newWallpaper,
            "testRegex":/force_new/,
            functionalShouldParse:(parseObj)=>{
                let query_body = parseObj.query_body;
                return (query_body.newWallpaper===true||query_body.newWallpaper==="true")
            }
        },{
            "name":"saveLastWallpaper",
            "funct":this.saveLastWallpaper,
            "testRegex":/save_last/,
            functionalShouldParse:(parseObj)=>{
                let query_body = parseObj.query_body;
                return (query_body.saveLastWallpaper===true||query_body.saveLastWallpaper==="true")
            }
        },{
            "name":"openSavedWallpapers",
            "funct":this.openSavedWallpapers,
            "testRegex":/open_saved/,
            functionalShouldParse:(parseObj)=>{
                let query_body = parseObj.query_body;
                return query_body.openSavedWallpapers===true||query_body.openSavedWallpapers==="true"
            }
        }
    ]

}

export default PhoneWallpaper;