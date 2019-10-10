'use strict';


const
  searchMovies = require('./searchMovies'),
  stickers = require('./stickers'),
  express = require('express'),
  https = require('https'),
  bodyParser = require('body-parser'),
  VERIFY_TOKEN = process.env.VERIFY_TOKEN,
  request = require('request'),
  PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN,
  app = express().use(bodyParser.json()); // creates express http server

const fetch = require('node-fetch');
const domain = "3.81.59.78"
var async = require('async');

// Sickers
// var sadHacker = require('hacker_boy_18.png')
  // hello


  app.listen(process.env.PORT || 8000, () => console.log('webhook is listening'));


  app.post('/webhook', (req, res) => {
  
    let body = req.body;
  
    if (body.object === 'page') {
    
        body.entry.forEach(function(entry) {
    
            let webhook_event = entry.messaging[0];
            console.log(webhook_event);
    
            let sender_psid = webhook_event.sender.id;
            console.log('Sender PSID: ' + sender_psid);
    
            if (webhook_event.message) {
                handleMessage(sender_psid, webhook_event.message);
            } else if (webhook_event.postback) {
                handlePostback(sender_psid, webhook_event.postback);
            }
    
        });
    
        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
  
  });
  
  app.get('/', (req, res) => {
      res.send("HELLO world")
  });
  
  app.get('/webhook', (req, res) => {
  
      let mode = req.query['hub.mode'];
      let token = req.query['hub.verify_token'];
      let challenge = req.query['hub.challenge'];

      if (mode && token) {

          if (mode === 'subscribe' && token === VERIFY_TOKEN) {
  
              console.log('WEBHOOK_VERIFIED');
              res.status(200).send(challenge);
  
          } else {
              res.sendStatus(403);
          }
      }
      else{
          res.send("SRY");
      }
  });


  async function postSummary(sender_psid, movieID){
   var summary = await searchMovies.searchSummary(movieID)

   console.log(`THIS IS THE SUMMARY \n${summary}`);

   var mssageSent = await callSendAPI(sender_psid, {"text": `Summary : ${summary.trim()}`});

   return mssageSent;

  }


  async function sentimentScore(list, sender_psid){

    console.log("Your score is on its way!!");  
    callSendAPI(sender_psid, {"text" : "Please wait a while...\nApproximate wait time is 19 seconds"})  

    var data = await fetch(`http://${domain}:8090/json`, {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        timeout: 22000,
        body: JSON.stringify(list)
    })
    
    // var responseData = await data.json()
    var responseDataAsString = await data.text()
    var responseData = responseDataAsString.split("Txix+T-xixT")
    return responseData
  }

  function hello(){
    console.log("HELLO I AM HELLO");
    
  }

  async function checkServerStatus(){


    //  CUSTOM JSON

    var hello = {} // empty Object
    var key = 'check';
    hello[key] = []; // empty Array, which you can push() values into


    var data = {
        hello : 'HELLO'
    };

    hello[key].push(data);

    //  CUSTOM JSON 

    var data = await fetch(`http://${domain}:8090/hello`, {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        timeout: 2000,
        body: JSON.stringify(hello)
    })
    
    var responseData = await data.text()

    console.log(`This is the response ${responseData}`);

    if(responseData == "ACK"){return responseData}
    throw error
  }
  

  function handleMessage(sender_psid, received_message) {
    let response;
    // let test = [];

    // Working
    var reviewList = {} // empty Object
    var key = 'Review';
    reviewList[key] = []; // empty Array, which you can push() values into
    // Working

    var movieTitle = ""
    var movieID = ""
    var movieAbstract = ""
    var movieTeaser = ""

    console.log(reviewList.length);
    
    

    // Checks if the message contains text
    if (received_message.text) {    
      // Create the payload for a basic text message, which
      // will be added to the body of our request to the Send API
      

      checkServerStatus()
      .then(() => {
        searchMovies.searchMovie(received_message.text)
        .then(movieList => {
            console.log("TESING BUGGGG+============================");
            console.log("HERE IT IS " + movieList[0].reviewUrl);
            
            console.log(movieList);
            console.log("TESING BUGGGG+============================");
            
            fetch(movieList[0].reviewUrl)
            .then(response => response.text())
            .then(body => {                
                
                movieTitle = movieList[0].title
                movieID = movieList[1].imdbID

                console.log(movieList[0].reviewUrl);
                
                const cheerio = require('cheerio');
                const $ = cheerio.load(body);

                console.log("In CHEERIO");
                

                $('.content').each(function(i, elem) {
                    const $element = $(elem);

                    const $review = $element.find('div.text').text().trim();
                    
                    var review = {
                        review: $review     
                    };

                    // reviewList.push(review);
                    reviewList[key].push(review);
                    // test.push(review)
                    
                });

                console.log("Movie title is = " + movieTitle);
                
                console.log(reviewList);
                
                
                if(JSON.stringify(reviewList).length > 13){

                  console.log("This is my file");

                  sentimentScore(reviewList, sender_psid)
                  .then(sentiment => {
                      // console.log(sentiment);
                      // console.log(sentiment[0]);
                      // console.log(sentiment[1]);                     
                      
                      postSummary(sender_psid, movieID)
                      .then(messageSent => {

                        // response = {
                        //   'text':`The movie you asked for \"${movieTitle}\" has a sentiment score of \n${sentiment[0]}\nThis is the best review we could find`
                        // }
  
                        // callSendAPI(sender_psid, response);
                        
  
                        var rating = "";
  
                        if(sentiment[0] >=0 && sentiment[0] <= 0.2){ rating = "a Very Bad :(" }
                        else if(sentiment[0] > 0.2 && sentiment[0] <= 0.4){ rating = "a Bad :/" }
                        else if(sentiment[0] > 0.4 && sentiment[0] <= 0.6){ rating = "a Mediocre :|" }
                        else if(sentiment[0] > 0.6 && sentiment[0] <= 0.8){ rating = "a Good! :)" }
                        else { rating = "an Excellent!! :D 🎉 🎉 🎉" }
  
                        callSendAPI(sender_psid, {'text': `Accoriding to our review this is\n${rating} movie`})                      
  
                        console.log(sentiment);
                      });

                      
                      

                  })
                  .catch(error => {
                      console.log(error);
                      response = {
                        "text": `Somthing went wrong on the server side\nPlease contact the admin for more Details\nThank You!!`
                      }
        
                      callSendAPI(sender_psid, response);
                  })
                  
                }
                else{
                  response = {
                    "text": `No such movies found.\nReason 1: Please check the movie that you entered actually exists.\n\nReason 2: You might be trying to have a conversation with this bot. If thats the case then please don't. The purpose of this bot is to only provide the user with movie sentiment.\n\nPlease try again with correct input.\nThank You!!`
                  }

                  callSendAPI(sender_psid, response);

                
                }
                            
                return "promis"
                // return reviewList
            })
            .catch(error => {
              console.log(error);
              console.log("I AM HERE");
              
              response = {
                "text": `No such movies found.\nReason 1: Please check the movie that you entered actually exists.\n\nReason 2: You might be trying to have a conversation with this bot. If thats the case then please don't. The purpose of this bot is to only provide the user with movie sentiment.\n\nPlease try again with correct input.\nThank You!!`
              }

              callSendAPI(sender_psid, response);


            });

        });
      })
      .catch(error => {

        response = {
          "text": `Somthing went wrong on the server side\nPlease contact the admin for more Details\nThank You!!`
        }

        callSendAPI(sender_psid, response);
      });


    } else if (received_message.attachments) {
      // Get the URL of the message attachment
      let attachment_url = received_message.attachments[0].payload.url;
      response = {
        "attachment": {
          "type": "template",
          "payload": {
            "template_type": "generic",
            "elements": [{
              "title": "Is this the right picture?",
              "subtitle": "Tap a button to answer.",
              "image_url": attachment_url,
              "buttons": [
                {
                  "type": "postback",
                  "title": "Yes!",
                  "payload": "yes",
                },
                {
                  "type": "postback",
                  "title": "No!",
                  "payload": "no",
                }
              ],
            }]
          }
        }
      }

      callSendAPI(sender_psid, response);
    } 
    
    // Send the response message
    // callSendAPI(sender_psid, response);    
  }

 
  
  function handlePostback(sender_psid, received_postback) {
    let response;
    
    // Get the payload for the postback
    let payload = received_postback.payload;
  
    // Set the response based on the postback payload
    if (payload === 'yes') {
      response = { "text": "Thanks!" }
    } else if (payload === 'no') {
      response = { "text": "Oops, try sending another image." }
    }
    // Send the message to acknowledge the postback
    callSendAPI(sender_psid, response);
  }
  
  function callSendAPI(sender_psid, response) {
  
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": response
    }
  
    request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs": { "access_token": PAGE_ACCESS_TOKEN },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
        console.log('message sent!')
        return 1
    }
    else {
        console.error("Unable to send message:" + err);
        return 0
    }
    });
    
  
  }
