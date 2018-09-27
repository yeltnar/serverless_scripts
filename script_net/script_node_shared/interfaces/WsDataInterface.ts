

// wrapper interface for either client or server
interface WsDataInterface{
    client?:WsDataClientInterface,
    server?:WsDataServerInterface
}
// interface for exposed client
interface WsDataClientInterface{
    server_url:string,
    protocol:string,
    url_test_regex:RegExp,
    max_ping_interval?:number
}
// interface for server
interface WsDataServerInterface{

}

export {WsDataInterface,WsDataClientInterface,WsDataServerInterface}