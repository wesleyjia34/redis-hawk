"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
var redis = __importStar(require("redis"));
var data_stores_1 = require("./models/data-stores");
var utils_1 = require("./utils");
var utils_2 = require("../controllers/utils");
var instances = process.env.IS_TEST ?
    JSON.parse(fs.readFileSync(path.resolve(__dirname, '../tests-config/tests-config.json')).toString())
    : JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../config.json')).toString());
var redisMonitors = [];
var initMonitor = function (monitor) { return __awaiter(void 0, void 0, void 0, function () {
    var e_1, res, e_2, _loop_1, dbIndex;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                redisMonitors.push(monitor);
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4, monitor.redisClient.config('SET', 'notify-keyspace-events', 'KEA')];
            case 2:
                _a.sent();
                return [3, 4];
            case 3:
                e_1 = _a.sent();
                console.log("Could not configure client to publish keyspace event noficiations");
                return [3, 4];
            case 4:
                _a.trys.push([4, 6, , 7]);
                return [4, monitor.redisClient.config('GET', 'databases')];
            case 5:
                res = _a.sent();
                monitor.databases = +res[1];
                return [3, 7];
            case 6:
                e_2 = _a.sent();
                console.log("Could not get database count from client");
                return [3, 7];
            case 7:
                monitor.keyspaceSubscriber.psubscribe('__keyspace@*__:*');
                _loop_1 = function (dbIndex) {
                    var eventLog, keyspaceSnapshot, keyspace;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                eventLog = new data_stores_1.EventLog();
                                monitor.keyspaceSubscriber.on('pmessage', function (channel, message, event) {
                                    if (+message.match(/[0-9]+/)[0] === dbIndex) {
                                        var key = message.replace(/__keyspace@[0-9]*__:/, '');
                                        eventLog.add(key, event);
                                    }
                                });
                                return [4, utils_2.getKeyspace(monitor.redisClient, dbIndex)];
                            case 1:
                                keyspaceSnapshot = _b.sent();
                                keyspace = {
                                    eventLog: eventLog,
                                    keyspaceHistories: new data_stores_1.KeyspaceHistoriesLog(),
                                    keyspaceSnapshot: keyspaceSnapshot,
                                    eventLogSnapshot: []
                                };
                                monitor.keyspaces.push(keyspace);
                                setInterval(utils_1.recordKeyspaceHistory, monitor.recordKeyspaceHistoryFrequency, monitor, dbIndex);
                                return [2];
                        }
                    });
                };
                dbIndex = 0;
                _a.label = 8;
            case 8:
                if (!(dbIndex < monitor.databases)) return [3, 11];
                return [5, _loop_1(dbIndex)];
            case 9:
                _a.sent();
                _a.label = 10;
            case 10:
                dbIndex++;
                return [3, 8];
            case 11: return [2];
        }
    });
}); };
instances.forEach(function (instance, idx) {
    var client;
    var subscriber;
    if (instance.host && instance.port) {
        client = redis.createClient({ host: instance.host, port: instance.port });
        subscriber = redis.createClient({ host: instance.host, port: instance.port });
    }
    else if (instance.url) {
        client = redis.createClient({ url: instance.url });
        subscriber = redis.createClient({ url: instance.url });
    }
    else {
        console.log("No valid connection host/port or URL provided - check your config. Instance details: " + instance);
        return;
    }
    client = utils_1.promisifyClientMethods(client);
    var monitor = {
        instanceId: idx + 1,
        redisClient: client,
        keyspaceSubscriber: subscriber,
        host: instance.host,
        port: instance.port,
        url: instance.url,
        keyspaces: [],
        recordKeyspaceHistoryFrequency: instance.recordKeyspaceHistoryFrequency
    };
    initMonitor(monitor);
});
exports.default = redisMonitors;
