'use strict';

var request = require('request-promise');
const config = require('../utils/const');
var moment = require('moment');

var euromillions = {
  lastResult: lastResult,
  formatResult: formatResult
};

function lastResult() {
  return request({
    uri: 'https://euromillions.p.mashape.com/ResultsService/FindLast',
    headers: { "X-Mashape-Key": config.MASHAPE_EUROMILLIONS_API_TOKEN },
    method: 'GET',
    json: true
  });
}

function formatResult(data) {
  var result = 'Euromillions ' +
      moment(data.Date).format('YYYY/MM/DD') +  ': ' +
      'Numbers (' +
      data.Num1 + ', ' +
      data.Num2 + ', ' +
      data.Num3 + ', ' +
      data.Num4 + ', ' +
      data.Num5 + ') and Stars ' + '(' +
      data.Star1 + ', ' +
      data.Star2 + '). ' +
      'Next jackpot: ' + data.NextJackpot / 1000000 + 'M€';
  return result;
}

module.exports = euromillions;
