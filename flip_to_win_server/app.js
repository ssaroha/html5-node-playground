"use strict"

var util = require('util');
var express = require('express');
var cluster = require('cluster');

var numCpus = require('os').cpus().length;
var config = require('./config/config.js');
var proc  = require('./lib/proc');


var argv = require('optimist').argv;


var startServer = function(){
  util.log('Worker starting ' + process.pid);
  var app = express.createServer();
  app.configure(function(){
    app.set('root', __dirname);
    /* app.set('db', db); */
    // app.set('view options', { layout: 'layout.ejs', releasetag: release,  menu:'', environment: app.settings.env });
    app.set('view engine', 'ejs');
    app.set('views', __dirname + '/views');
    app.enable('jsonp callback');

    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.favicon(__dirname + '/public/images/favicon.ico', { maxAge: 2592000000 })); 

    express.logger.token('istDate', function(req,res){ return new Date();});
    express.logger.token('user', function(req,res){ return (req.session && req.session.user)?req.session.user.name:'guest';});
  });

  app.configure('development', function(){
    app.use(express.session({  secret: '1a2b3c4d5e6f' }));
    app.use(express.static(__dirname + '/public', { maxAge: 86400 }));
    app.use(express.logger('dev'));
    app.use(app.router);
    app.disable('auth');
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
  });

  require('./routes/images')(app);
  

  /* 404 and 500 error handling. This works only if we have static provider above router, 
  * otherwise it breaks all static content. */

  app.get('/*', function(req, res){
    res.render('404', {status: 404});
  });

  /* End 404, 500 error handling */

  app.listen(config.port);

  console.log("Admin Console Server listening on port " + config.port + " in " + app.settings.env);
  exports.app = app;

  proc.init(app);

  //catch all exception
  process.on('uncaughtException', function (err) {
    switchHandlers();
    util.log('Uncaught exception: ' + err);
    util.log(err.message);
    util.log(err.stack);
    process.exit();
  });
};

if(undefined !== argv){
  if(undefined !== argv.cluster){
    if(cluster.isMaster){
      util.log('Master ' + process.pid);
      var numWorkers = numCpus;
      for(var i = 0 ; i < numCpus ; i++){
        cluster.fork();
      }
      cluster.on('death', function(worker){
        util.log('Worker  ' + worker.pid + ' died');
        numWorkers -=  1;
        if(0 == numWorkers){
          util.log('All workers died... Shutting down master with pid ' + process.pid);
      process.exit(0); 
        }
      });
    }else{
      startServer();
    }    
  }else{
    startServer();
  }
}else{
  startServer();
}
