let exportObj:any={};

exportObj.justInTimePackageInit = function( package_name, key? ):Function{
    console.log("key is `"+JSON.stringify(key)+"`");
    console.log("typeof key is `"+typeof key+"`");

    if( key===undefined ){
        
        let package_cache; // put close to the function set up. Should never be directly called, hence the `_`
        function f (){
            package_cache = package_cache || require(package_name);
            return package_cache;
        }
        //console.log(f());
        return f;
        
    }else if( key.length === undefined ){
        throw "error getting key's length. Likely not arr: "+typeof key;
    }else/*assume is array*/{
        throw "justInTimePackageInit with key is not ready"
        let local_key = key.shift();

        if( local_key!==undefined ){
            console.log("at point 1 "+local_key);
            let toReturn = exportObj.justInTimePackageInit( package_name, key )[local_key];
            console.log("1 typeof toReturn is "+typeof toReturn)
            return  toReturn;
        }else{
            console.log("at point 2 "+local_key);
            let toReturn = exportObj.justInTimePackageInit( package_name );
            console.log("2 typeof toReturn is "+typeof toReturn)
            return  toReturn;
        }
        
    }

    
}

module.exports = exportObj;