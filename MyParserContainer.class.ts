import {ParserContainer,parseInit, AbstractParser} from './parse_framework/Parser.class';

import ObdParser from './serverless_files/obd/obd';
import PhoneWallpaperParser  from './serverless_files/phone_wallpaper/phone_wallpaper';
import HueParser  from './serverless_files/hue/hue';
import WeatherParser  from './serverless_files/weather/weather';
import GeofenceParser  from './serverless_files/geofence/geofence';
import {NotifyLeaving}  from './serverless_files/notify_leaving/notify_leaving';
import GetParsers  from './serverless_files/get_parsers/get_parsers';
import Ping  from './serverless_files/ping/ping';
import Person  from './serverless_files/person/person';
import SlackParser from './serverless_files/slack/slack';
import SendSms from './serverless_files/send_sms/send_sms';

import {pushNotification} from './helpers/ifttt';
import helpers from './helpers/helper';

const config = require('config');


parseInit(pushNotification, helpers);


class MyParserContainer extends ParserContainer{

    httpParsers = {  
        slackParser: new SlackParser("SlackParser", config.slackParser||{}, this),
        obd: new ObdParser("obd", config.obd, this),
        phoneWallpaper: new PhoneWallpaperParser("phoneWallpaper", config.phone_wallpaper, this),
        hue: new HueParser("hue", config.hue, this),
        weather: new WeatherParser("weather", config.weather, this), // TODO these names seem so brok)en
        geofence: new GeofenceParser("geofence", config.geofence, this),
        notify_leaving: new NotifyLeaving("notify_leaving", config.notify_leaving, this),
        ping: new Ping("ping", config.ping, this),
        get_parsers: new GetParsers("get_parsers", config.get_parsers, this),
        sendSms: new SendSms("sendSms", config.sendSms, this),
        person: new Person("person", config.persons.drew, this)    
    }

    constructor(){

        super();

        for( let k in this.httpParsers ){
            const cur:AbstractParser = this.httpParsers[k];
            this.addPublicParser(cur);
        }
    }
}

export default MyParserContainer;