'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

require('./prerender-manifest.json');
require('./manifest.json');
require('./routes-manifest.json');
require('./lambda-manifest.json');
require('http');
var defaultHandler = require('./default-handler-029d33b2.js');
require('stream');
require('perf_hooks');
require('url');
require('punycode');
require('https');
require('zlib');
require('crypto');
require('os');
require('path');
require('fs');
require('buffer');
require('http2');
require('process');
require('child_process');
require('util');
require('querystring');



exports.handleRegeneration = defaultHandler.handleRegeneration;
exports.handleRequest = defaultHandler.handleRequest;
exports.handler = defaultHandler.handler;
