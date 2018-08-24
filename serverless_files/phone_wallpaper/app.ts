import {HttpParser} from '../../HttpParser.class';
const requestP = require("request-promise-native");

class PhoneWallpaper extends HttpParser{
    parseObj;

    constructor( name, config ){
        super( name, config );
    }
    _shouldParse(parserObj){
        return /wallpaper/.test(parserObj.pathName);
    }
    _transformObj(parserObj){
        return parserObj.query_body;
    }
    async _parse( query_body ){

        //console.log(JSON.stringify(obj));
        //console.log(JSON.stringify(wallpaper_obj));

        let toReturn = "done";
    
        if( (query_body.preSelected===true||query_body.preSelected==="true") && query_body.imgUrl!==undefined){
            
            console.log("using preselected: "+query_body.imgUrl);
            try{
                this.setPhoneWallpaper({"wallpaper_url":query_body.imgUrl});
            }catch(e){
                console.error(e);
            }
        }else if( (query_body.newWallpaper===true||query_body.newWallpaper==="true") ){
            
            console.log("setting new wallpaper");
            try{
                let walpaper_info = await this.getPhoneWallpaper( true )
                this.setPhoneWallpaper(walpaper_info);
            }catch(e){
                console.error(e);
            }
        }else if( (query_body.getLastWallpaper===true||query_body.getLastWallpaper==="true") ){
            
            //console.log("get last wallpaper");
            try{
                let toPrint = await this.helpers.fsPromise.readFile(this.config.used_wallpaper_file);
                toPrint = JSON.parse(toPrint);
                toPrint = toPrint.pop();
                toReturn = toPrint;
                console.log(toPrint);
            }catch(e){
                console.error(e);
            }
        }else if( (query_body.saveLastWallpaper===true||query_body.saveLastWallpaper==="true") ){
            
            try{
                let last_used_wallpaper_url = (await this.helpers.fsPromise.readFile(this.config.used_wallpaper_file)).toString();
                last_used_wallpaper_url = JSON.parse(last_used_wallpaper_url);
                last_used_wallpaper_url = last_used_wallpaper_url[last_used_wallpaper_url.length-1];
    
                let savedWallpaperArr = ( await this.helpers.fsPromise.readFile(this.config.saved_wallpaper_file) ).toString();
                try{
                    savedWallpaperArr = JSON.parse(savedWallpaperArr);
                }catch(e){
                    savedWallpaperArr = [];
                }
    
                if(savedWallpaperArr.indexOf(last_used_wallpaper_url)<0){
                    savedWallpaperArr.push(last_used_wallpaper_url);
                }
                await this.helpers.fsPromise.writeFile(this.config.saved_wallpaper_file, JSON.stringify(savedWallpaperArr));
    
                console.log(JSON.stringify(savedWallpaperArr));
            }catch(e){
                console.error(e);
            }
        }else if( query_body.openSavedWallpapers===true||query_body.openSavedWallpapers==="true" ){
            try{
                let last_used_wallpaper_arr = (await this.helpers.fsPromise.readFile(this.config.saved_wallpaper_file)).toString();
    
                let toLog = "<script>"+last_used_wallpaper_arr+".forEach((ele)=>{window.open(ele);}); </script>";
                
                toReturn = toLog;
    
                console.log(toLog)
            }catch(e){
                console.error(e);
            }
        }else{
            
               console.log("running top wallpaper");
            try{
                let walpaper_info = await this.getPhoneWallpaper();
                this.setPhoneWallpaper(walpaper_info);
            }catch(e){
                console.error(e);
            }
        }

        return toReturn;
    
    }

    async setPhoneWallpaper(walpaper_info) {
    
        let {wallpaper_url, used_wallpaper} = walpaper_info;
    
        if(used_wallpaper===undefined){
            try{
                used_wallpaper = await this.helpers.fsPromise.readFile(this.config.used_wallpaper_file);
                used_wallpaper = JSON.parse(used_wallpaper);
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
            used_wallpaper.push(wallpaper_url);
            used_wallpaper=used_wallpaper.slice(-10);
            this.helpers.fsPromise.writeFile(this.config.used_wallpaper_file, JSON.stringify(used_wallpaper));
        }else{
            console.log("not setting walpaper to " + wallpaper_url);
        }
    }

    async getPhoneWallpaper( force_new=false ) {
    
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
    
            used_wallpapers = JSON.parse( await this.helpers.fsPromise.readFile(this.config.used_wallpaper_file) );
    
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
}

export default PhoneWallpaper;