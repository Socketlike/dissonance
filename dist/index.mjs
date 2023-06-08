var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/const.ts
var const_exports = {};
__export(const_exports, {
  creator: () => creator,
  endpoints: () => endpoints,
  libraryName: () => libraryName,
  userAgent: () => userAgent,
  version: () => version
});
import fs from "fs";
var endpoints = {
  gatewayBot: "gateway/bot"
};
var libraryName = "Dissonance";
var creator = "Socketlike";
var version = JSON.parse(fs.readFileSync("./package.json", "utf-8")).version;
var userAgent = `${libraryName} (https://github.com/${creator}/${libraryName}, ${version})`;

// src/gateway/index.ts
var gateway_exports = {};
__export(gateway_exports, {
  GatewayManager: () => GatewayManager,
  constructors: () => constructors_exports
});

// src/gateway/constructors.ts
var constructors_exports = {};
__export(constructors_exports, {
  Heartbeat: () => Heartbeat,
  Identify: () => Identify,
  Resume: () => Resume
});
import {
  GatewayOpcodes
} from "discord-api-types/v10";
import process from "process";
function Identify(token, intents) {
  this.op = GatewayOpcodes.Identify;
  this.d = {
    token,
    properties: {
      os: process.platform,
      browser: libraryName,
      device: libraryName
    },
    intents
  };
  Object.defineProperty(this, "toJSON", {
    value: () => JSON.stringify({ ...this }),
    writable: false
  });
}
function Heartbeat(seq) {
  this.op = GatewayOpcodes.Heartbeat;
  this.d = seq;
  Object.defineProperty(this, "toJSON", {
    value: () => JSON.stringify({ ...this }),
    writable: false
  });
}
function Resume(token, session_id, seq) {
  this.op = GatewayOpcodes.Resume;
  this.d = {
    token,
    session_id,
    seq
  };
  Object.defineProperty(this, "toJSON", {
    value: () => JSON.stringify({ ...this }),
    writable: false
  });
}

// src/gateway/manager.ts
import EventEmitter from "eventemitter3";
import {
  GatewayDispatchEvents,
  GatewayOpcodes as GatewayOpcodes2
} from "discord-api-types/v10";
import WebSocket from "ws";
import _ from "lodash";

// src/rest.ts
var rest_exports = {};
__export(rest_exports, {
  REST: () => REST,
  getAPIUrl: () => getAPIUrl
});
import { APIVersion } from "discord-api-types/v10";
var getAPIUrl = (path) => new URL(path, `https://discord.com/api/v${APIVersion}/`);
var REST = class {
  static async fetch(path, auth, options) {
    const response = await fetch(getAPIUrl(path), {
      method: typeof options?.method === "string" ? options.method : "GET",
      headers: {
        ...options?.headers,
        ...typeof auth === "string" ? { Authorization: `Bot ${auth}` } : void 0,
        "Accept-Encoding": "gzip,deflate",
        "User-Agent": userAgent
      }
    });
    return {
      response,
      data: await response.clone().json()
    };
  }
};

// src/gateway/manager.ts
var GatewayManager = class extends EventEmitter {
  _options;
  _ws;
  _forceClosed = true;
  _sessionData;
  _data = {
    heartbeat: {
      ack: true,
      interval: 0,
      seq: null,
      timer: null,
      timeout: null
    }
  };
  constructor(options) {
    super();
    this._options = options;
  }
  async connect() {
    if (typeof this._ws?.readyState === "number" && this._ws.readyState !== this._ws.CLOSED)
      return false;
    const gatewayBotInfo = (await REST.fetch(endpoints.gatewayBot, this._options.token)).data;
    if (gatewayBotInfo.code)
      console.error(`gateway connect error: ${gatewayBotInfo.code}, ${gatewayBotInfo.message}`);
    else {
      this._ws = new WebSocket(
        `${this._forceClosed ? gatewayBotInfo.url : this._sessionData.resume_gateway_url}?encoding=json`
      ).on("open", () => this.emit("connect", this._ws)).on("message", this._message).on("close", (code, reason) => this.emit("disconnect", code, reason, this._ws));
    }
    return true;
  }
  disconnect(force = true) {
    if (!this._ws || typeof this._ws?.readyState === "number" && this._ws.readyState === this._ws.CLOSED)
      return false;
    this._heartbeat.stop();
    if (force) {
      this._ws.close(1001);
      this._forceClosed = true;
    } else
      this._ws.terminate();
    this._ws.removeAllListeners();
    this._ws = null;
    return true;
  }
  async reconnect(forceDisconnect = true) {
    const disconnectRes = this.disconnect(forceDisconnect);
    const connectRes = await this.connect();
    return disconnectRes || connectRes;
  }
  _heartbeat = (() => {
    const _heartbeat = (force = false) => {
      if (this._heartbeat.ack || force) {
        this.emit("heartbeat");
        this._ws.send(new Heartbeat(this._heartbeat.seq).toJSON());
        if (!force)
          this._heartbeat.ack = false;
      } else
        this.reconnect(false).catch(() => console.error("reconnect failed")).then((res) => console.log("reconnect status", res));
    };
    Object.defineProperties(_heartbeat, {
      ack: {
        get: () => this._data.heartbeat.ack,
        set: (ack) => void (this._data.heartbeat.ack = ack)
      },
      interval: {
        get: () => this._data.heartbeat.interval,
        set: (interval) => void (this._data.heartbeat.interval = interval)
      },
      seq: {
        get: () => this._data.heartbeat.seq,
        set: (seq) => void (this._data.heartbeat.seq = seq)
      },
      start: {
        value: () => {
          this._heartbeat.timeout = setTimeout(() => {
            this._heartbeat(true);
            this._heartbeat.timer = setInterval(this._heartbeat, this._heartbeat.interval);
          }, this._heartbeat.interval * Math.random());
        }
      },
      stop: {
        value: () => {
          this._heartbeat.timeout = null;
          this._heartbeat.timer = null;
        }
      },
      timer: {
        get: () => this._data.heartbeat.timer,
        set: (timer) => {
          clearInterval(this._heartbeat.timer);
          this._data.heartbeat.timer = timer;
        }
      },
      timeout: {
        get: () => this._data.heartbeat.timeout,
        set: (timeout) => {
          clearTimeout(this._heartbeat.timeout);
          this._data.heartbeat.timeout = timeout;
        }
      }
    });
    return _heartbeat;
  })();
  _message = (raw) => {
    const data = JSON.parse(raw.toString("utf-8"));
    this.emit("message", data);
    if (data.op == 0)
      this._dispatch(data);
    else
      this._receive(data);
    this._heartbeat.seq = data.s;
  };
  _dispatch(data) {
    switch (data.t) {
      case GatewayDispatchEvents.Ready: {
        this.emit("ready", _.clone(data.d), this._ws);
        this._sessionData = data.d;
        break;
      }
      case GatewayDispatchEvents.Resumed: {
        this.emit("resumed");
        break;
      }
    }
  }
  _receive(data) {
    switch (data.op) {
      case GatewayOpcodes2.Hello: {
        this.emit("hello", data.d);
        this._heartbeat.interval = data.d.heartbeat_interval;
        if (this._forceClosed)
          this._ws.send(new Identify(this._options.token, this._options.intents).toJSON());
        else
          this._ws.send(
            new Resume(
              this._options.token,
              this._sessionData.session_id,
              this._heartbeat.seq
            ).toJSON()
          );
        this._heartbeat.start();
        this._forceClosed = false;
        break;
      }
      case GatewayOpcodes2.HeartbeatAck: {
        this.emit("ack", this._ws);
        this._heartbeat.ack = true;
        break;
      }
      case GatewayOpcodes2.Reconnect: {
        this.emit("reconnect", this._ws);
        this.reconnect(false);
        break;
      }
      case GatewayOpcodes2.InvalidSession: {
        this.emit("invalidSession", data.d, this._ws);
        this.reconnect(!data.d);
        break;
      }
    }
  }
};

// src/ws.ts
var ws_exports = {};
__export(ws_exports, {
  WebSocketManager: () => WebSocketManager
});
var WebSocketManager = class {
  _options;
  _gateway;
  constructor(options) {
    this._options = options;
    this._gateway = new GatewayManager(this._options);
  }
  connect() {
    return this._gateway.connect();
  }
  disconnect(force) {
    return this._gateway.disconnect(force);
  }
  reconnect(forceDisconnect) {
    return this._gateway.reconnect(forceDisconnect);
  }
  on(event, listener, context) {
    this._gateway.on(event, listener, context);
    return this;
  }
  once(event, listener, context) {
    this._gateway.once(event, listener, context);
    return this;
  }
  off(event, listener, context) {
    this._gateway.off(event, listener, context);
    return this;
  }
};
export {
  const_exports as constants,
  gateway_exports as gateway,
  rest_exports as rest,
  ws_exports as ws
};
