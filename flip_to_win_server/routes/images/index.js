var util = require('util');
var imageData = require('./imageData');

module.exports = function (app) {
    //------------------------------------------------------------//
    app.get('/images/imageData', imageData.getImageData);
    //--------------------------------------------------------------//
};
