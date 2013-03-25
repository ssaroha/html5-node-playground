'use strict';

var util = require('util');
var imageDataModel = require('../../model/images_data');

var imageData = {
  /**
    * Method : Get
    * Get all the image data
    */
  getImageData : function(req, res){
	 var imageData = EZ2MO.Models.ImageData; 
	 var images = imageData.getImageList(3);
    util.log("Image data length: " + images.length);
    if (null !== images) {
          res.json({
          status: 'success',
          result: images,
        });
    }else {
        util.log('[routes/images/imageData] error while getting imagedata: ' + err);
        res.json({
          status: 'failure'
        });
      }
    }             
};

module.exports = imageData;
