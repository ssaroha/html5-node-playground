
var util = require('util');

if(typeof(EZ2MO) === 'undefined'){
    EZ2MO = {};
}

if(typeof(EZ2MO.Models) === 'undefined'){
    EZ2MO.Models = {};
}


/**
 *  ImageData
 *
 *  @class EZ2MO.Models.ImageData
 *  @constructor
 *  @param 
 */

 EZ2MO.Models.ImageData = (function() { 
	var images = [];
	// var sqlite = require("../vendor/sqlite");
	// var db = sqlite.openDatabaseSync("imagematch.sqlite");
	var sqlite3 = require('sqlite3').verbose();
	var db = new sqlite3.Database('imagematch.sqlite');
	if (db) {
		util.log("Database opened successfully!!");
	}
	else util.log("DB open Failed!!");
	var that = this;
	var imageCtr = 0;
	
        	
        var printImageRecord = function(record) {
            util.log(" Image Name: " + record.name);
            util.log(" Image pair id: " + record.image_pair_id);
            util.log(" Image answer name: " + record.image_answer_name);
            if (record.image_question_blob) 
                util.log(" Image Question Blob: DEFINED"); 
            else
                util.log("Image Question Blob: UNDEFINED");
            if (record.image_answer_blob)
                util.log("Image Answer Blob: DEFINED");
            else
                util.log("Image Answer Blob: UNDEFINED");
              
        };

        var base64Image = function(binaryData) {
           var base64 = new Buffer(binaryData, 'binary').toString('base64');
//           var prefix = "data:" + "image/png" + ";base64,";
           return base64;
        }
        var coverImage_;
        var getCoverImage = function(imageSetId) {
           var COVER_IMAGE_SQL = "SELECT individual_cover from image_sets where image_set_id=" + imageSetId;
           db.each(COVER_IMAGE_SQL, function(err, record) {
                  util.log("Entered in getCoverImage..");
                  coverImage_ =  base64Image(record.individual_cover);
                  util.log("fetched coverImage..");
           });
           util.log("Returning base64 image..");
        }

	return {
		getImageList : function(imageSetId) {
		    // implement connectivity to DB
			if (images.length > 0) {
				return images;
			}
			var imagesRef = images;
                        var SELECT_STR = "SELECT image_pair_id, image_set_id, name, image_question_blob, image_answer_blob, big_image_question_blob, big_image_answer_blob, image_answer_name, image_answermatch_sound from image_pairs where image_set_id=" + imageSetId;
                        getCoverImage(imageSetId);
                        
			db.each(SELECT_STR, function(err, record) {
		                        printImageRecord(record);
                                        util.log("about to use coverImage..");
					var imageStruct = {
					  image_name : record.name,
                                          cover_image : coverImage_,
				    	  image_blob : base64Image(record.image_question_blob),
					  audio : base64Image(record.big_image_question_blob),
					  isFlipped : false,
                                          imagePairId : record.image_pair_id,
					  squareId : imageCtr,
                                          partnerSquareId : imageCtr + 1, 
					};
					imagesRef[imageCtr] = imageStruct;
					imageCtr++;
					var imageStruct2 = {
					   image_name : record.image_answer_name,
                                           cover_image : coverImage_,
				       	   image_blob : base64Image(record.image_answer_blob),
					   audio : base64Image(record.big_image_answer_blob),
					   isFlipped : false,
                                           imagePairdId : record.image_pair_id,
					   squareId : imageCtr,
                                           partnerSquareId : imageStruct.squareId
					}; 
					imagesRef[imageCtr] = imageStruct2;
					imageCtr++;
			});
			util.log("image size: " + imagesRef.length);
			// return this so that chaining can happen
			
			return imagesRef;
		},
		
	};
}());


