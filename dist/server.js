"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var http_1 = __importDefault(require("http"));
var path_1 = __importDefault(require("path"));
var fs_1 = require("fs");
var child_process_1 = require("child_process");
var app = (0, express_1.default)();
var server = http_1.default.createServer(app);
var port = process.env.PORT || 3000;
app.use(function (req, res, next) {
    var contentType = req.headers['content-type'] || '';
    var mime = contentType.split(';')[0];
    if (mime !== 'text/plain') {
        return next();
    }
    var data = '';
    req.setEncoding('utf-8');
    req.on('data', function (chunk) {
        data += chunk;
    });
    req.on('end', function () {
        // @ts-ignore
        req.rawBody = data;
        next();
    });
});
app.get('/', function (req, res) {
    res.send('Hello world!');
});
function escapeCmdArg(arg) {
    return "'" + arg.replace(/'/g, "'\"'") + "'";
}
app.post('/minify', function (req, res) {
    // @ts-ignore
    var rawBody = req.rawBody;
    if (!rawBody) {
        return res.status(400).send('');
    }
    var uglify = path_1.default.join(__dirname, 'node_modules', '.bin', 'uglifyjs');
    var options = {
        compress: true,
        mangle: true,
        comments: false,
        'keep-fargs': false,
        'keep-fnames': false,
    };
    var cmdArgs = [];
    Object.keys(options).forEach(function (key) {
        // @ts-ignore
        var value = options[key];
        if (!value) {
            return;
        }
        cmdArgs.push("--".concat(key));
    });
    var tempFile = "".concat(__dirname, "/.data/temp/").concat(Date.now(), ".js");
    var outputFile = "".concat(__dirname, "/.data/temp/").concat(Date.now(), "-minified.js");
    var dir = path_1.default.dirname(tempFile);
    if (!(0, fs_1.existsSync)(dir)) {
        (0, fs_1.mkdirSync)(dir, {
            recursive: true,
        });
    }
    (0, fs_1.writeFileSync)(tempFile, rawBody, 'utf-8');
    console.log('run minified command', "".concat(uglify, " ").concat(escapeCmdArg(tempFile), " -o ").concat(escapeCmdArg(outputFile), " ").concat(cmdArgs.join(' ')));
    (0, child_process_1.execSync)("".concat(uglify, " ").concat(escapeCmdArg(tempFile), " -o ").concat(escapeCmdArg(outputFile), " ").concat(cmdArgs.join(' ')));
    var minified = (0, fs_1.readFileSync)(outputFile, 'utf-8');
    (0, fs_1.unlinkSync)(tempFile);
    (0, fs_1.unlinkSync)(outputFile);
    if (minified.length === 0) {
        // minified error
        return res.status(400).send('');
    }
    return res.send(minified);
});
server.listen(port, function () {
    console.log("App started at: http://localhost:".concat(port));
});
