import { GatewayIdentify, GatewayHeartbeat, GatewayResume } from 'discord-api-types/v10';
import EventEmitter from 'eventemitter3';

declare const endpoints: {
    gatewayBot: string;
};
declare const libraryName = "Dissonance";
declare const creator = "Socketlike";
declare const version: string;
declare const userAgent: string;

declare const _const_creator: typeof creator;
declare const _const_endpoints: typeof endpoints;
declare const _const_libraryName: typeof libraryName;
declare const _const_userAgent: typeof userAgent;
declare const _const_version: typeof version;
declare namespace _const {
  export {
    _const_creator as creator,
    _const_endpoints as endpoints,
    _const_libraryName as libraryName,
    _const_userAgent as userAgent,
    _const_version as version,
  };
}

declare function Identify(this: GatewayIdentify & {
    toJSON: () => string;
}, token: string, intents: number): void;
declare function Heartbeat(this: GatewayHeartbeat & {
    toJSON: () => string;
}, seq: null | number): void;
declare function Resume(this: GatewayResume & {
    toJSON: () => string;
}, token: string, session_id: string, seq: null | number): void;

declare const constructors_Heartbeat: typeof Heartbeat;
declare const constructors_Identify: typeof Identify;
declare const constructors_Resume: typeof Resume;
declare namespace constructors {
  export {
    constructors_Heartbeat as Heartbeat,
    constructors_Identify as Identify,
    constructors_Resume as Resume,
  };
}

declare class GatewayManager extends EventEmitter {
    private _options;
    private _ws;
    private _forceClosed;
    private _sessionData;
    private _data;
    constructor(options: GatewayManager.Options);
    connect(): Promise<boolean>;
    disconnect(force?: boolean): boolean;
    reconnect(forceDisconnect?: boolean): Promise<boolean>;
    private _heartbeat;
    private _message;
    private _dispatch;
    private _receive;
}
declare namespace GatewayManager {
    interface Data {
        heartbeat: {
            ack: boolean;
            interval: number;
            seq: null | number;
            timer: null | NodeJS.Timer;
            timeout: null | NodeJS.Timeout;
        };
    }
    interface Options {
        token: string;
        intents: number;
    }
}

declare const index_GatewayManager: typeof GatewayManager;
declare const index_constructors: typeof constructors;
declare namespace index {
  export {
    index_GatewayManager as GatewayManager,
    index_constructors as constructors,
  };
}

declare const getAPIUrl: (path: string | URL) => URL;
declare class REST {
    static fetch<ResponseType = Response>(path: string, auth?: string, options?: {
        headers?: HeadersInit;
        method?: string;
        body?: BodyInit;
    }): REST.FetchResponse<ResponseType>;
}
declare namespace REST {
    type FetchResponse<ResponseType> = Promise<{
        response: Response;
        data: ResponseType;
    }>;
}

declare const rest_REST: typeof REST;
declare const rest_getAPIUrl: typeof getAPIUrl;
declare namespace rest {
  export {
    rest_REST as REST,
    rest_getAPIUrl as getAPIUrl,
  };
}

declare class WebSocketManager {
    private _options;
    private _gateway;
    constructor(options: WebSocketManager.Options);
    connect(): Promise<boolean>;
    disconnect(force?: boolean): boolean;
    reconnect(forceDisconnect?: boolean): Promise<boolean>;
    on(event: string | symbol, listener: (...args: any[]) => void, context?: any): this;
    once(event: string | symbol, listener: (...args: any[]) => void, context?: any): this;
    off(event: string | symbol, listener: (...args: any[]) => void, context?: any): this;
}
declare namespace WebSocketManager {
    type Options = GatewayManager.Options;
}

declare const ws_WebSocketManager: typeof WebSocketManager;
declare namespace ws {
  export {
    ws_WebSocketManager as WebSocketManager,
  };
}

export { _const as constants, index as gateway, rest, ws };
