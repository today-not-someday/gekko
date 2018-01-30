// helpers
// var _ = require('lodash');
var log = require('../core/log.js');

var config = require('../core/util.js').getConfig();
var settings = config.buyatsellat_ui;
var queue = [];


// let's create our own method
var method = {};

// prepare everything our method needs
  method.init = function() {
  this.name = 'buyatsellat_ui';

  this.previousAction = 'firstbuy';
  this.previousActionPrice = Infinity;
}

// What happens on every new candle?
method.update = function(candle) {
  //log.debug('in update');
}

// for debugging purposes log the last 
// calculated parameters.
method.log = function(candle) {
  //log.debug(this.previousAction)
}
method.check = function(candle, canBuy) {  
  const stop_loss_pct = settings.stop_loss_pct; // amount of stop loss percentage
  const stopLossPrice= candle.close * stop_loss_pct;
  const goodConditionToBuy = true;

  queue.push(candle.close);
  // console.log("Last 5 candles", queue);

  //1,2 ,3 , 4, 5, 6, 7,8 ,9 ,10
  // Shift 5 times to keep only last 5.
  if (queue.length == 5) {
      queue.splice(1, 1)
  }
  
  // We never sell here, we only update stop loss.
  if(this.previousAction === "stoplossbuy") {

    // 1. Update to new stop. loss. 
    // Save the current candle.
    // if the current candle is greater than the last saved candle
    // now update new stop loss.For eg, last stop order price: 1000, candle.close: 1001


    //this.previousAction = 'stoplosssell';



    if (candle.close > lastCandlePrice)
    {
      // cancel last stop loss 
      this.advice('cancel');
      this.advice('stoploss');
      this.previousStopLossPrice = stopLossPrice;
    }
    // update last candle after all checks.
    this.lastCandlePrice = candle.close

  }

  // Buy first or only after a stop loss if condition is good.
  else if((this.previousAction === "stoplosssell") || this.previousAction === "firstbuy")  {

    // 2. When to buy?
    // In good condition 
    // goodConditionToBuy = [1,2,3,2,4] > out of 5 last values, 3 values, including the last candle are increasing.
    
    if(goodConditionToBuy) {
      this.advice('long');
      console.log("This is my first buy")
      this.lastActionPrice = candle.close;
      this.previousAction = 'buy'
      console.log("This is my stoploss")
      this.advice('stoplossbuy')
      this.previousStopLossPrice = stopLossPrice;
    }
  }
}

module.exports = method;
