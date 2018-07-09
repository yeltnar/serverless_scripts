DIR="bm_iot_keep_alive"

rm -rf $DIR;
mkdir $DIR
cd $DIR
pwd
git clone "https://git.ng.bluemix.net/andcbrant/drew-iot-new.git" .
date > date.txt
git add .
git commit -m "keep alive"
git push
cd ..
rm -rf $DIR

#DIR="bm_iot_keep_alive";rm -rf $DIR