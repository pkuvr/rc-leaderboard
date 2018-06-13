'use strict';

const LeaderBoard = require('./lib/leaderboard'),
  cron = require('node-cron');

/**
 * 清除周期性排行榜
 * @param pattern
 * @param period
 * @returns {function(this:T)}
 */
let clearPeriodLeaderBoard = (pattern, period) => {
  return cron.schedule(pattern, function () {
    this.lb.clearPeriodLeaderBoard(period, (err, res) => {
      console.debug('clear period leaderboards.');
    })
  }).bind(this);
};

let EasyLeaderBoard = (host, port, options) => {
  this.lb = new LeaderBoard();
  this.lb.createClient(host, port, options);
};

let p = EasyLeaderBoard.prototype;

/**
 * 新增一个实体
 * @param entity
 * @param callback
 * @param options
 */
p.add = (entity, callback, options) => {
  entity = entity || {};
  if (!entity.userId || !entity.attrName) {
    callback('parameter error.');
  }
  entity.createdAt = entity.createdAt || new Date().toString();
  entity.score = entity.score || 0;
  entity.extra = entity.extra || '';

  options = options || {};
  options.group = options.group || 'default';
  options.op = options.op || 'bestScore';
  this.lb.add(entity, callback, options);
};

module.exports = EasyLeaderBoard;