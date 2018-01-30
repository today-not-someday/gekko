var _ = require('lodash');
var log = require('../core/log.js');
var RSI16 = require('./indicators/RSI.js');
var RSI12 = require('./indicators/RSI.js');
var RSI24 = require('./indicators/RSI.js');


var SMA5 = require('technicalindicators').EMA;
var SMA10 =  require('technicalindicators').EMA;
var SMA20 =  require('technicalindicators').EMA;

const chalk = require('chalk'); // https://www.npmjs.com/package/chalk
chalkNum = (value, cond) => cond ? chalk.cyan(value) : chalk.magenta(value);
chalkNumBright = (value, cond) => cond ? chalk.cyanBright(value) : chalk.magentaBright(value);
var method = {};

method.init = function() {
    this.name = 'RSIv2';
    var stochParams = {
        optInFastKPeriod: 5,
        optInSlowKPeriod: 3,
        optInSlowDPeriod: 3
      };
    
    var RSI12Params ={
        interval: 12
     };
    var RSI16Params ={
        interval: 16
    };
    var RSI24Params ={
        interval: 24
    };

    this.trend = {
        direction: 'none',
        duration: 0,
        persisted: false,
        adviced: false,
        price : 0,
    };
    this.longcount = 0;
    this.shortcount = 0;
    this.requiredHistory = this.tradingAdvisor.historySize;
    this.addTulipIndicator('stoch', 'stoch', stochParams);
    
    this.addIndicator('RSI12', 'RSI', RSI12Params);
    this.addIndicator('RSI16','RSI',RSI16Params);
    this.addIndicator('RSI24','RSI',RSI24Params);
}

method.log = function(candle) {
    var digits = 8;
    var rsi = this.indicators.rsi;

    
    var LastCandle = candle;
    // log.debug('calculated RSI properties for candle:');
    // log.debug('\t', 'rsi:', rsi.result.toFixed(digits));
    // log.debug('\t', 'price:', candle.close.toFixed(digits));
}
var Currents =[];
var PriceList = [];

ManageArraySize = function() 
{
    if(PriceList.length > 500)
    {
        //log.debug('reducing array size');
        
        PriceList.shift();

    }
}

method.check = function() {
 
    ManageArraySize();
    
    var fixedclose = this.candle.close.toFixed(6);

    PriceList.push(this.candle.close);
    var rsi12 = this.indicators.RSI12.result;
    var rsi16 = this.indicators.RSI16.result;
    var rsi24 = this.indicators.RSI24.result;

    // SMA Calculation
    var sma5 = SMA5.calculate({period : 5, values :PriceList});
    sma5 = sma5[sma5.length -1];
    var sma10 = SMA10.calculate({period : 10, values :PriceList});
    sma10 = sma10[sma10.length -1];
    var sma20 = SMA20.calculate({period : 20, values :PriceList});
    sma20 = sma20[sma20.length -1];


    var sma5lower = parseFloat(this.candle.close,3) - parseFloat(sma5,3);
    // log.debug('SMA 5:',sma5);
    // log.debug('SMA 10:',sma10);
    // log.debug('SMA 20 :',sma20);
    // log.debug('SMA 5 sup :',sma5lower);    

    /// Candle Color 
    this.direction = this.candle.close - this.candle.open;
    this.direction > 0 ? this.candleColor = 'green' : this.candleColor = 'red';
    uptrend = this.candleColor == "green";;
    downtrend = this.candleColor == "red"

    // Stoch Results
    this.stochK = this.tulipIndicators.stoch.result.sotchK;
    this.stochD = this.tulipIndicators.stoch.result.stochD; 
    
    const stop_loss_pct = 0.95; // stop loss percentage (e.g. 0.95 for 5%)
    this.stop = this.candle.close * stop_loss_pct;
    Currents.push(this.trend);

    if(rsi12 == undefined || rsi16 == undefined || rsi24 == undefined
     || sma5 == undefined || sma10 == undefined || sma20 == undefined
     || fixedclose == undefined
    ) { return this.advice();}
    if ( rsi16 > 60) {

        if (this.trend.direction !== 'high')
            this.trend = {
                duration: 0,
                persisted: false,
                direction: 'high',
                adviced: false,
                price : this.candle.close,
                stop: this.candle.close - (this.candle.close * .2)
            };

        this.trend.duration++;
        // log.debug('In high since', this.trend.duration, 'candle(s)');

        if (this.trend.duration >= this.settings.thresholds.persistence)
            this.trend.persisted = true;

        if (this.trend.persisted && !this.trend.adviced) {
            // add stochastic

            if(sma5.toFixed(6) == sma10.toFixed(6))
            {
                log.debug('short: ', this.candle.close);
                this.shortcount++;
                this.trend.adviced = true;
                return this.advice('short'); 

            }
 
        } 
    } else if (rsi16 < 20 && rsi24 < 30  ) {

        // new trend detected
        if (this.trend.direction !== 'low')
            this.trend = {
                duration: 0,
                persisted: false,
                direction: 'low',
                price : this.candle.close,
                adviced: false
            };

        this.trend.duration++;

        // log.debug('In low since', this.trend.duration, 'candle(s)');
        if (this.trend.duration >= this.settings.thresholds.persistence)
            this.trend.persisted = true;

        if (this.trend.persisted && !this.trend.adviced) {


            // log.debug("Entering Long Order with stop : ", this.stop)
                if(this.longCount == 0)
                {
                    this.buyPrice = this.candle.close;
                    this.longCount++; 
                    this.trend.adviced = false;
                    return;
                }
                else
                {
                //    if(this.stochK > this.stochD
                //      )
                //     {
                        var isbellowsma = sma5 > this.candle.close;
                        // var diffsma = this.candle.close - sma.result;
                        // if(diffsma < -0.0)
                        //  {
                        // //     this.longCount++;
                        var sma5projectedvalue = sma5.toFixed(7) * 100000;
                        var closeprojected = this.candle.close.toFixed(7) * 100000;
                        var matchedx = closeprojected < sma5projectedvalue;
                        if(closeprojected < sma5projectedvalue)
                        {
                        
                            log.debug("Long SMA5 Projected value : ",closeprojected);
                            log.debug('long : ', this.candle.close);
                            log.debug("long rsi 12 : ", rsi12);
                            log.debug('long rsi 16 : ',rsi16);
                            log.debug('long rsi 24 : ',rsi24)
                            log.debug('long SMA 5 : ',sma5);
                            log.debug('long SMA 10: ',sma10);
                            log.debug('long SMA 20 : ',sma20);
                            
                            this.trend.adviced = true;

                            return this.advice('long');

                        }
        
                        //  }

 
                //    }

                }

        } else
            this.advice();

    } else {

        this.advice();
    }
}

module.exports = method;