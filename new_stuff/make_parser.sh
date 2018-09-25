app_name=$1
if [ -z ${app_name} ];then 
    echo "app_name is unset"; 
    exit -1
else 
    echo "app_name is set to '$app_name'"; 
fi


cp -r starter_files $app_name
echo "cp done"

log=node init.js $app_name
echo $log




# clearn up for testing
# cd ..
# rm -rf $app_name
# echo "cleanup done"

# rm -rf test123