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

let RcLeaderBoard = function (host, port, options) {
  this.lb = new LeaderBoard();
  this.lb.createClient(host, port, options);
};

let p = RcLeaderBoard.prototype;

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

p.activePeriods = (options) => {
  options = options || {};
  let daily = options.daily || false,
    weekly = options.weekly || false,
    monthly = options.monthly || false,
    yearly = options.yearly || false;
  if (daily) {
    this.dailyTask = clearPeriodLeaderBoard(this, '0 0 * * *');
    this.lb.activePeriod('daily');
  }

  if (weekly) {
    this.weeklyTask = clearPeriodLeaderBoard(this, '0 0 * * 0');
    this.lb.activePeriod('weekly');
  }

  if (monthly) {
    this.monthlyTask = clearPeriodLeaderBoard(this, '0 0 1 * *');
    this.lb.activePeriod('monthly');
  }

  if (yearly) {
    this.yearlyTask = clearPeriodLeaderBoard(this, ' 0 0 1 1 *');
    this.lb.activePeriod('yearly');
  }
};

/**
 * 获取排行榜
 * @param callback
 * @param options
 */
p.getLeaderboard = (callback, options) => {
  options = options || {};
  let group = options.group || 'default',
    period = options.period || 'alltime',
    attrName = options.attrName || null,
    from = options.from || 0,
    to = options.to || -1;
  if (!userId || !attrName) {
    callback('params error.');
    return;
  }
  this.ld.getLeaderboard(group, period, attrName, from, to, callback);
};

/**
 * 获取top榜，例如top100
 * @param top
 * @param callback
 * @param options
 */
p.getTop = (top, callback, options) => {
  options = options || {};
  let group = options.group || 'default',
    period = options.period || 'alltime',
    attrName = options.attrName || null;
  if (!attrName) {
    callback('params error.');
    return;
  }
  this.ld.getLeaderboard(group, period, attrName, 1, top, callback);
};

/**
 * 获取用户上下范围的排行榜
 * @param userId
 * @param callback
 * @param options
 */
p.getAroundUserLeaderboard = (userId, callback, options) => {
  options = options || {};
  let group = options.group || 'default',
    period = options.period || 'alltime',
    attrName = options.attrName || null,
    range = options.range || 10;
  if (!userId || !attrName) {
    callback('params error.');
    return;
  }
  this.ld.getAroundUserLeaderboard(group, period, userId, attrName, range, callback);
};


/**
 * 获取用户最高分
 * @param userId
 * @param callback
 * @param options
 * @param filterOptions
 */
p.getBestScore = (userId, callback, options, filterOptions) => {
  options = options || {};
  let group = options.group || 'default',
    period = options.period || 'alltime',
    attrName = options.attrName || null;
  if (!userId || !attrName) {
    callback('params error.');
    return;
  }
  this.ld.getUserBestScore(group, period, userId, attrName, callback, filterOptions);
};

/**
 * 获取用户累计分
 * @param userId
 * @param callback
 * @param options
 */
p.getTotalScore = (userId, callback, options) => {
  options = options || {};
  let group = options.group || 'default',
    period = options.period || 'alltime',
    attrName = options.attrName || null;
  if (!userId || !attrName) {
    callback('params error.');
    return;
  }
  this.ld.getUserTotalScore(group, period, userId, attrName, callback);
};

/**
 * 获取用户排名
 * @param userId
 * @param callback
 * @param options
 */
p.getRank = (userId, callback, options) => {
  options = options || {};
  let group = options.group || 'default',
    period = options.period || 'alltime',
    attrName = options.attrName || null;
  if (!userId || !attrName) {
    callback('params error.');
    return;
  }
  this.ld.getRank(group, period, userId, attrName, callback);
};

p.flushAll = () => {
  this.ld.flushAll();
};

p.removeLeaderboards = (options) => {
  options = options || {};
  let
    group = options.group || 'default',
    daily = options.daily || false,
    weekly = options.weekly || false,
    monthly = options.monthly || false,
    yearly = options.yearly || false;

  if (daily && !!this.dailyTask) {
    this.dailyTask.destroy();
    this.ld.clearPeriodLeaderBoard(group, 'daily');
  }

  if (weekly && !!this.weeklyTask) {
    this.weeklyTask.destroy();
    this.ld.clearPeriodLeaderBoard(group, 'weekly');
  }

  if (monthly && !!this.monthlyTask) {
    this.monthlyTask.destroy();
    this.ld.clearPeriodLeaderBoard(group, 'monthly');
  }

  if (yearly && !!this.yearlyTask) {
    this.yearlyTask.destroy();
    this.ld.clearPeriodLeaderBoard(group, 'yearly');
  }
};


module.exports = RcLeaderBoard;