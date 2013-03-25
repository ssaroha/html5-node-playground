(function() {

   var SquareState= { READY_TO_PLAY : 0, IN_PLAY : 1, IS_SOLVED : 2 };         
   var imagesDB = null;
var fliptowin = {
       
        canvas:null,
        // numImages:12,
        canvasHeight:440,
        canvasWidth:220,
        startX: 20,
        startY: 20,
        imageHeight: 100,
        imageWidth: 95,

        
        images: [],
        curSqs:[],
        inc: 5,              //set step change in px (wdmax-wdmin must be a multiple) )These two variables
        rate: 50,          //pause between steps (in millisec)                      )determine flip-flop speed
        pause: 1000,       //pause between flip and flop (in millisec)
        wdmax: 95,          //set maximum width of square image (px)
        wdmin: 0,            //set minimum thickness of edge-on image (px)

        
        log: function(msg){
            if(window["console"] && console["log"]){
                console.log(msg);
            }
        },

        nullDataHandler: function(){
          this.log("Seems that SQL statement succeeded");
        }, 

        // create sqlite database to cache the images array blob.
        initDBForImages: function() {
          try {
            if (!window.openDatabase) {
              this.log('Databases are not supported in this browser');
            } else {
            var shortName = 'fliptowinDB';
            var version = '1.0';
            var displayName = 'Fliptowin Images database';
            var maxSize = 20000000; // in bytes
            imagesDB = openDatabase(shortName, version, displayName, maxSize);
            this.log("Database is setup: "+imagesDB);
            } 
          } catch(e) {
	    // Error handling code goes here.
	    if (e == 2) {
	        // Version number mismatch.
	        this.log("Invalid database version.");
	    } else {
	        this.log("Unknown error "+e+".");
	    }
	    return;
	  } 
           
        },

        createTable: function(){
          var that = this;
          imagesDB.transaction(
            function (transaction) {
              /* The first query causes the transaction to (intentionally) fail if the table exists. */
            transaction.executeSql('CREATE TABLE images(image_json TEXT NOT NULL);', [], that.nullDataHandler, that.errorHandler);
           }
          );
        },
        
        updateTable: function(){	
          this.log("Inside updateTable..");
          var that = this;
	      imagesDB.transaction(
	        function (transaction) {
	          transaction.executeSql("INSERT INTO images (image_json) VALUES (?);", [JSON.stringify(that.images)] );
	        }
	      );	
        },
        
        insertImages: function() {
           this.dropTables();
           this.createTable();
           this.updateTable();
        }, 
        errorHandler: function(transaction, error) {
        // this.log("Hello World");
 	  if (error.code==1){
 		//DB Table already exists
 	  } else {
    	  // Error is a human-readable string.
	    this.log('Oops.  Error was '+error.message+' (Code '+error.code+')');
 	  }
          return false;
        },
        initializeImages: function() {
          if (that.images.length >0) {
              that.log("Images are loaded");
              that.initShapes();
              that.bindClickEvents();
              for (var i =0; i < that.images.length ; i++) {
                that.images[i].state = SquareState.READY_TO_PLAY;
              }
            }

        },
        imageSelectHandler: function(transaction, results) {
	  this.log("images had Results: "+results.rows.length);
          // Handle the results
          for (var i=0; i<results.rows.length; i++) {
            this.images = JSON.parse(results.rows.item(i).image_json);
            this.log("Finished assigning image");
          }
          if (this.images.length >0) {
              this.log("Images are loaded");
              this.initShapes();
              this.bindClickEvents();
              for (var i =0; i < this.images.length ; i++) {
                this.images[i].state = SquareState.READY_TO_PLAY;
              }
          }
          else {
            this.getImagesFromWeb();
          }
        },

        getImagesFromWeb: function() {
            this.log("Inside getImagesFromWeb function");
            var that = this;
            if (this.images.length ===0) {
                this.log("Inside getImagesFromWeb function, image len = 0");
                $.getJSON('http://localhost:5678/Images/ImageData?callback=?', function(res) {

            	  var mappedImageData = $.map(res.result, function(item) {
            	        return item;
            	  });
                  that.log("Image data length = " + mappedImageData.length);
            	  that.images = mappedImageData;
            	  that.log("Length of images = " + that.images.length);
                  that.log("First Image name: " + that.images[1].image_name);
              //    localStorage.setItem('fliptowinCache', JSON.stringify(that.images));
            that.insertImages();
            that.initShapes();
            that.bindClickEvents();
            for (var i =0; i < that.images.length ; i++) {
        	that.images[i].state = SquareState.READY_TO_PLAY;
            }
              }).error(function(res) {//error handling
                that.log("Failed to load image data");
              }); 
           }
        },
        imageSelectFailure: function(transaction, error) {
           this.log('Oops Error was '+error.message+' (Code '+error.code+')');
           this.getImagesFromWeb();
        },

        loadImages: function(successCallback, failureCallback) { 
          var that = this;
	  imagesDB.transaction(
	    function (transaction) {
                that.log("about to execute stmt for selecting image_json");
	        transaction.executeSql("SELECT image_json from images;", [], 
                   function(transaction, results) {
                      successCallback.call(that, transaction, results);
                   }, 
                   function (transaction, error) {
                     failureCallback.call(that, transaction, error);
                   }
                );
       
                that.log("finished executing stmt for selecting image_json");
	    }
	  );
        },
        
        dropTables: function() {
	  imagesDB.transaction(
	    function (transaction) {
	        transaction.executeSql("DROP TABLE images;", [], this.nullDataHandler, this.errorHandler);
	    }
	  );	
        },

        init: function() {
            this.canvas = document.getElementById("canvas");
            var that = this;
      	    that.log("Inside init function...");
            that.initDBForImages();
            that.dropTables();
            that.loadImages(this.imageSelectHandler, this.imageSelectFailure);
        },
        
        isAnySquareInPlay:function() {
            this.log("Count of Squares: " + this.images.length);
        	for (var i =0; i < this.images.length ; i++) {
        		if (this.images[i].state === SquareState.IN_PLAY) {
        			this.log("A square is in play, with position: %d", this.images[i].id);
        			return i;
        		}
            }
        	return null;
        },
        
        
        
        canPlayClappingSound:function() {
        	this.log("Playing the clapping sound..");
        	// for (NSNumber* key in gameSquareMap_.keyEnumerator) {
        	for (var i =0; i < this.images.length ; i++) {
        		
        		if ([this.images[i].state] != SquareState.IS_SOLVED) {
        			this.log("Game not over yet..");
        			return false;
        		}
            }
        	return true;
        },

        transitionState:function(e) {
        	this.log("Inside transitionState method");
        	
        	var anySquareInPlay = this.isAnySquareInPlay();
        	var me = this;
            var element = e.target;
            var parent = element.parentNode;
            var squarePos = element.id.substr(8, element.id.length);
            
            var partnerSquarePos = this.images[squarePos].partnerSquareId;
            
        	switch(this.images[squarePos].state) {
        		case SquareState.READY_TO_PLAY:
        			if ((this.images[partnerSquarePos].state == SquareState.READY_TO_PLAY) && (anySquareInPlay == null)) {
        				this.log("Square going from READY_TO_PLAY to IN_PLAY");
        				this.images[squarePos].state = SquareState.IN_PLAY;
        				this.flip(squarePos);
        			}
        			
        			else if ((this.images[partnerSquarePos].state == SquareState.READY_TO_PLAY) && (anySquareInPlay)) {
        				this.images[anySquareInPlay].state = SquareState.READY_TO_PLAY;
        				
        				var that=this;
        				function processThis(callback){
        					that.log("inside main");
        					that.flip(squarePos);
        				
        					callback();
        					function func()
        					{
        						that.flip(anySquareInPlay);
        						that.flip(squarePos);
        					}
        					setTimeout(func,1000);
        					
        					that.log("still in main but exiting")
        					
        				}
        				
        				processThis(function(){
        					//just leaving it here for  call back example, non blocking code that can run parallel to main
        					//http://recurial.com/programming/understanding-callback-functions-in-javascript/
        					that.log("inside callback --non blocking code");
        				});
        				
        				
        				// [anySquareInPlay performSelector:@selector(flipCurrentView) withObject:anySquareInPlay afterDelay:1.5];
        				 
        				// [self performSelector:@selector(flipCurrentView) withObject:self afterDelay:1.5];
        				//clearTimeout(t);
        				this.log("GameBoard square going from IN_PLAY to IN_PLAY");
        				
        			}
        			if ((this.images[partnerSquarePos].state == SquareState.IN_PLAY)) {
        				this.log("Square going from READY_TO_PLAY to SOLVED");
        				this.images[squarePos].state = SquareState.IS_SOLVED;
        				this.images[partnerSquarePos].state = SquareState.IS_SOLVED;
        				var matchingSoundElem = document.getElementById("matching_sound");
        				
        				this.flip(squarePos);
        				if (matchingSoundElem) {
        					this.playSound(matchingSoundElem);
        				}
        				this.playClappingSound();
        				// [[self gameBoard_] playClappingSound];

        			}
        			break;
        		case SquareState.IN_PLAY:
        			if ((this.images[partnerSquarePos].state == SquareState.IN_PLAY) || (this.images[partnerSquarePos].state == SquareState.IS_SOLVED)) {
        				this.log("Square going from IN_PLAY to SOLVED");
        				this.images[squarePos].state = SquareState.IS_SOLVED;
        				this.images[partnerSquarePos].state = SquareState.IS_SOLVED;
        			}
        			break;
        			default: break;
        	}
        },

        playClappingSound: function() {
        	for (var i =0; i < this.images.length ; i++) {
        		if (this.images[i].state != SquareState.IS_SOLVED) {
        			this.log("A square is in play, with position: %d", this.images[i].id);
        			return i;
        		}
            }
        	this.playSound(document.getElementById("winning_sound"));
        },
        
        playSound: function(el) {
        	
        	function outerPlay() {
        		function play() {
        			console.log("about to play ")
        			el.play();
        		}
        		setTimeout(play, 1000);
        	};
        	outerPlay();
        },
        
        
        initShapes:function() {
            this.log("Inside initShapes..");
            this.curSqs = [];
            this.drawImages();
        },
        drawImages:function() {
        	for (var i=0; i<this.images.length; i++) {
        		var xPos = this.startX + this.imageWidth * (i%3);
        		var yPos = this.startY + this.imageHeight * parseInt(i/3);
        	        this.log("Inside Draw Images.. ");	
        		this.curSqs[i] = this.createSquare(xPos, yPos,i);
        	}
        	for (var k=0;k<this.curSqs.length;k++) {
                this.canvas.appendChild(this.curSqs[k]);
            }
        },
        
        createSquare: function(x, y, imagePos) {
        	var el = document.createElement('div');
        	el.id = 'imageDiv' + imagePos;
        	el.appendChild(this.createImageForSquare(x,y,imagePos));
        	el.appendChild(this.createAudioForSquare(imagePos));
        	return el;
        },
        
        createAudioForSquare: function(pos) {
        	// <audio controls="controls"> <source src="song.ogg" type="audio/ogg" /> </audio>
        	this.log('audioPos= ' + pos);
        	var el = document.createElement('audio');
        	var sourceElem = document.createElement('source');
        	el.appendChild(sourceElem);
        	sourceElem.src= 'data:audio/wav;base64,' + this.images[pos].audio;
        	return el;
        },
        
        createImageForSquare:function(x,y,imagePos) {
    		// <img src="pulpit.jpg" alt="Pulpit rock" width="304" height="228" />	
        	this.log('imagePos= ' + imagePos);
        	var el = document.createElement('img');
            el.className = 'square';
            el.style.left = x + 'px';
            el.style.top = y + 'px';
            el.src= 'data:image/png;base64,' + this.images[imagePos].cover_image;
            el.id = 'imageid_' + imagePos;
            
            el.alt= "Flip to Win Image";
            return el;
        },
       
        
        bindClickEvents:function() {
            var me = this;
            var event = "click";
            var cb = function(e) {
                me.handleClick(e);
            };
            for (var k=0; k<this.curSqs.length;k++) {
            	if (window.addEventListener) {
            	    this.curSqs[k].addEventListener(event, cb, false);
            	    this.log('added event listener for image: ' + k);
            	} else {
            		
            	    this.log('attached event for image: ' + k);
            		this.curSqs[k].attachEvent('on' + event, cb);
            	}
            }
            
        },
                                
        handleClick:function(e) {
        	this.log('handle click events');
        	this.transitionState(e);
        	
        },
        
        
        flip: function(squarePos) {
            // TBD the flip is not being done gracefully at present
            var me = this;
            var element = document.getElementById('imageid_' + squarePos);
            var imageElem = '#imageid_' + squarePos;
            
            var parent = element.parentNode;
            var audioElement = parent.getElementsByTagName("audio")[0];
            var keepFlipping = function() {
                me.log("Image Id: " + squarePos);
                if (me.images[squarePos].isFlipped === true) {
                    $(imageElem).fadeOut(500, function() {
                    $(imageElem).attr("src",'data:image/png;base64,' + me.images[squarePos].cover_image);
                    }).fadeIn(500);
               
                    // element.src= 'data:image/png;base64,' + me.images[squarePos].cover_image;
                    me.images[squarePos].isFlipped = false;
                }
                else {
                	$(imageElem).fadeOut(500, function() {
                        // $(imageElem).attr("src",'img/'+ me.images[squarePos].name);
                        $(imageElem).attr("src",'data:image/png;base64,' + me.images[squarePos].image_blob);
                        }).fadeIn(500);
                	// element.src= 'img/'+ me.images[squarePos].name;
                	me.images[squarePos].isFlipped = true;
                	audioElement.play();
                }
               
            }();
        },
};
fliptowin.init();
})();

if (!Array.prototype.eachdo) {
    Array.prototype.eachdo = function(fn) {
        for (var i = 0;i<this.length;i++) {
            fn.call(this[i],i);
        }
    };
}

if (!Array.prototype.remDup) {
    Array.prototype.remDup = function() {
        var temp = [];
        for(var i=0; i<this.length; i++) {
          var bool = true;
            for(var j=i+1; j<this.length; j++) {
                if(this[i] === this[j]) {bool = false;}     
            }   
            if(bool === true) {temp.push(this[i]);}
        }
        return temp;
    }
}
