'use strict';

var express = require('express');
var router = express.Router();
var euromillions = require('../services/euromillions');

/* GET users listing. */
router.get('/', function(req, res) {
  euromillions.lastResult().then((data) => {
    res.send(euromillions.formatResult(data));
  })
}).bind(this);

module.exports = router;
