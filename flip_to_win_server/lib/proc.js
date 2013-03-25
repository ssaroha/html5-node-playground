"use strict"

var fs  = require('fs');
var util = require('util');
var argv = require('optimist').argv;
var config = require('../config/config');


var app;
var shutdownInProgress = false;

/**
  * Close the standard output and error descriptors
  * and redirect them to the specified files provided
  * in the argument
  */
function reload(args){
  if(args !== undefined){
    if(args.l !== undefined){
      fs.closeSync(1);
      fs.openSync(args.l, 'w');
    }

    if(args.e !== undefined){
      fs.closeSync(2);
      fs.openSync(args.e, 'w+');
    }

    // TODO: we may want to re-read the config file here
  }
}

/**
  * Monitor the specified file for restart. If that file
  * is modified, shut down the current process instance.
  */
function monitorRestartFile(){
  fs.watchFile('./public/system/restart', function(curr, prev){
        util.log('Restart signal received, shutting down current instance...');
        gracefulShutdown();
  });    
}

function gracefulShutdown(err) {
  // only allow one instance at a time
  if (shutdownInProgress)
    return;

  shutdownInProgress = true;
  try {
    util.log('Initiating graceful shutdown');
    if (err) {
      util.log('Uncaught exception: ' + err);
      util.log(err.message);
      util.log(err.stack);
    }
    if (app)
      app.close();

   // db.end(function() {
   //   process.exit(0);
   // });

    // give us 3 seconds to clean up
    setTimeout(function() {
      process.exit(1);
    },3000);
  } catch(e) {
    util.error('shutting down after exception ' + e);
    process.exit(1);
  }
}

/**
  * Reopen logfiles on SIGHUP
  * Exit on uncaught exceptions
  */
function setupHandlers() {
  process.on('uncaughtException', gracefulShutdown);

  process.addListener('SIGINT', gracefulShutdown);

  process.addListener("SIGHUP", function() {
    util.log("RECIEVED SIGHUP");
    reload(argv);
  });

  monitorRestartFile();
}

/**
  * su/sudo/start-stop-daemon work too badly with upstart
  * and setuid is only available in > 1.4, hence this
  */
function setupUGID(uid,gid) {
  if(uid) {
    if (!gid) gid = uid;
    try {
      process.setgid(gid);
      util.log("changed gid to " + gid);
      process.setuid(uid);
      util.log("changed uid to " + uid);
    } catch(e) {
      util.log("Failed to set uid/gid to (" + uid + "," + gid + ") Error: " + e);
    }
  }
}

var proc = {

  init : function(a){
    app = a;
    setupUGID(argv.u);
    reload(argv);
    setupHandlers();
  }

};

module.exports = proc;

/* ----------------- Test Code ----------------- */
if (require.main == module) {

    (function () {
      gracefulShutdown();
    })();
}