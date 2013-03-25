html5-node-playground
=====================

Fun game to try out html5 concepts with nodejs. 
I had developed a memory game for my kids in native Objective C and put it on iOS appstore, 
download it free from here on iPhone/iPad: https://itunes.apple.com/us/app/flip-to-win-for-kids/id505076069?ls=1&mt=8
that is doing decently with about 150 players playing it every day.

This project aims to implement the same game using pure HTML5/Javascript, in the process giving me opportunity to try 
out features like localStorage of HTML5.
the client side javascript invokes Node.JS based webservice entrypoint to fetch images one time over the wire and 
then cache it locally using HTML5 local storage.
