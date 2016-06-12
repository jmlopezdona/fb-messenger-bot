'use strict';

var express = require('express');
var router = express.Router();
var logger = require('../utils/logger');
const config = require('../utils/const');

router.get('/', function (req, res) {
  if (req.query['hub.verify_token'] === config.FB_VERIFY_TOKEN) {
    logger.info('verify facebook token');
    res.send(req.query['hub.challenge']);
  } else {
    logger.info('not verify facebook token');
    res.send('Error, wrong validation token');
  }
}).bind(this);

router.post('/', function (req, res) {
  var data = req.body;
  logger.info("facebook webhook data: " + JSON.stringify(data));

  // Make sure this is a page subscription
  if (data.object == 'page') {
    // Iterate over each entry
    // There may be multiple if batched
    data.entry.forEach(function(pageEntry) {
      var pageID = pageEntry.id;
      var timeOfEvent = pageEntry.time;

      // Iterate over each messaging event
      pageEntry.messaging.forEach(function(messagingEvent) {
        if (messagingEvent.optin) {
          receivedAuthentication(messagingEvent);
        } else if (messagingEvent.message) {
          receivedMessage(messagingEvent);
        } else if (messagingEvent.delivery) {
          receivedDeliveryConfirmation(messagingEvent);
        } else if (messagingEvent.postback) {
          receivedPostback(messagingEvent);
        } else {
          logger.error("Webhook received unknown messagingEvent: ", messagingEvent);
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know you've
    // successfully received the callback. Otherwise, the request will time out.
    res.sendStatus(200);
  }
}).bind(this);

function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  logger.debug("Received message for user %d and page %d at %d with message:",
    senderID, recipientID, timeOfMessage);
  logger.debug(JSON.stringify(message));

  var messageId = message.mid;

  // You may get a text or attachment but not both
  var messageText = message.text;
  var messageAttachments = message.attachments;

  if (messageText) {

    // If we receive a text message, check to see if it matches any special
    // keywords and send back the corresponding example. Otherwise, just echo
    // the text we received.
    switch (messageText) {
      case 'image':
        sendImageMessage(senderID);
        break;

      case 'button':
        sendButtonMessage(senderID);
        break;

      case 'generic':
        sendGenericMessage(senderID);
        break;

      case 'receipt':
        sendReceiptMessage(senderID);
        break;

      default:
        sendTextMessage(senderID, messageText);
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
  }
}

function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}

function callSendAPI(messageData) {
  var request = require('request');
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token:  config.FB_PAGE_TOKEN },
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      logger.debug("Successfully sent generic message with id %s to recipient %s",
        messageId, recipientId);
    } else {
      logger.error("Unable to send message.");
      logger.error(response);
      logger.error(error);
    }
  });
}

function receivedAuthentication(event) {
  console.log("receivedAuthentication event");
}

function receivedDeliveryConfirmation(event) {
  console.log("receivedDeliveryConfirmation event");
}

function receivedPostback(event) {
  console.log("receivedPostback event");

  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  // The 'payload' param is a developer-defined field which is set in a postback
  // button for Structured Messages.
  var payload = event.postback.payload;

  logger.debug("Received postback for user %d and page %d with payload '%s' " +
    "at %d", senderID, recipientID, payload, timeOfPostback);

  // When a postback is called, we'll send a message back to the sender to
  // let them know it was successful
  sendTextMessage(senderID, "Postback called");
}

module.exports = router;
