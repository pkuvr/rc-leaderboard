'use strict';

const LeaderBoard = require('./lib/leaderboard');
const cron = require('node-cron');

class RcLeaderBoard {
  constructor(host, port, options = null) {
    this.lb = new LeaderBoard();
    this.lb.createClient(host, port, options);

    /**
     * [private]
     * 清除周期性排行榜
     * @param pattern
     * @param group
     * @param period
     * @returns {*}
     */
    this.clearPeriodLeaderBoard = (pattern, group, period) => {
      let self = this;
      return cron.schedule(pattern, function () {
        self.lb.clearPeriodLeaderBoard(group, period, (err, res) => {
          console.debug('clear period leaderboards.');
        })
      }.bind(this));
    };
  }

  /**
   * 新增一个实体
   * @param entity
   * @param options
   */
  add(entity, options = {}) {
    entity = entity || {};
    if (!entity.userId || !entity.attrName) {
      console.log('parameter error.');
      return;
    }
    entity.createdAt = entity.createdAt || new Date().toString();
    entity.score = entity.score || 0;
    entity.extra = entity.extra || '';

    options.group = options.group || 'default';
    this.lb.add(entity, options);
  }

  activePeriods(options = {}) {
    let group = options.group || 'default',
      daily = options.daily || false,
      weekly = options.weekly || false,
      monthly = options.monthly || false,
      yearly = options.yearly || false;
    if (daily) {
      this.dailyTask = this.clearPeriodLeaderBoard.call(this, '0 0 * * *', group, 'daily');
      this.lb.activePeriod('daily');
    }

    if (weekly) {
      this.weeklyTask = this.clearPeriodLeaderBoard.call(this, '0 0 * * 0', group, 'weekly');
      this.lb.activePeriod('weekly');
    }

    if (monthly) {
      this.monthlyTask = this.clearPeriodLeaderBoard.call(this, '0 0 1 * *', group, 'monthly');
      this.lb.activePeriod('monthly');
    }

    if (yearly) {
      this.yearlyTask = this.clearPeriodLeaderBoard.call(this, '0 0 1 1 *', group, 'yearly');
      this.lb.activePeriod('yearly');
    }
  }

  /**
   * 获取排行榜
   * @param callback
   * @param options
   */
  getLeaderboard(callback, options = {}) {
    let group = options.group || 'default',
      period = options.period || 'alltime',
      attrName = options.attrName || null,
      scoreType = options.scoreType || 'best',
      from = options.from || 0,
      to = options.to || -1;
    if (!attrName) {
      callback('params error.');
      return;
    }
    this.lb.getLeaderboard(group, period, attrName, scoreType, from, to, callback);
  }

  /**
   * 获取top榜，例如top100
   * @param top
   * @param callback
   * @param options
   */
  getTop(top, callback, options = {}) {
    let group = options.group || 'default',
      period = options.period || 'alltime',
      attrName = options.attrName || null,
      scoreType = options.scoreType || 'best';
    if (!attrName) {
      callback('params error.');
      return;
    }
    this.lb.getLeaderboard(group, period, attrName, scoreType, 1, top, callback);
  }

  /**
   * 获取用户上下范围的排行榜
   * @param userId
   * @param callback
   * @param options
   */
  getAroundUserLeaderboard(userId, callback, options = {}) {
    let group = options.group || 'default',
      period = options.period || 'alltime',
      attrName = options.attrName || null,
      scoreType = options.scoreType || 'best',
      range = options.range || 10;
    if (!userId || !attrName) {
      callback('params error.');
      return;
    }
    this.lb.getAroundUserLeaderboard(group, period, userId, attrName, scoreType, range, callback);
  }

  /**
   * 获取用户最高分
   * @param userId
   * @param callback
   * @param options
   * @param filterOptions
   */
  getBestScore(userId, callback, options = {}, filterOptions) {
    let group = options.group || 'default',
      period = options.period || 'alltime',
      attrName = options.attrName || null;
    if (!userId || !attrName) {
      callback('params error.');
      return;
    }
    this.lb.getUserBestScore(group, period, userId, attrName, callback, filterOptions);
  }

  /**
   * 获取用户累计分
   * @param userId
   * @param callback
   * @param options
   */
  getTotalScore(userId, callback, options = {}) {
    let group = options.group || 'default',
      period = options.period || 'alltime',
      attrName = options.attrName || null;
    if (!userId || !attrName) {
      callback('params error.');
      return;
    }
    this.lb.getUserTotalScore(group, period, userId, attrName, callback);
  }


  /**
   * 获取用户排名
   * @param userId
   * @param callback
   * @param options
   */
  getRank(userId, callback, options = {}) {
    let group = options.group || 'default',
      period = options.period || 'alltime',
      attrName = options.attrName || null,
      scoreType = options.scoreType || 'best';
    if (!userId || !attrName) {
      callback('params error.');
      return;
    }
    this.lb.getRank(group, period, userId, attrName, scoreType, callback);
  }

  flushAll() {
    this.lb.flushAll();
  }

  removeLeaderboards(options = {}) {
    let
      group = options.group || 'default',
      daily = options.daily || false,
      weekly = options.weekly || false,
      monthly = options.monthly || false,
      yearly = options.yearly || false;

    if (daily && !!this.dailyTask) {
      this.dailyTask.destroy();
      this.lb.clearPeriodLeaderBoard(group, 'daily');
    }

    if (weekly && !!this.weeklyTask) {
      this.weeklyTask.destroy();
      this.lb.clearPeriodLeaderBoard(group, 'weekly');
    }

    if (monthly && !!this.monthlyTask) {
      this.monthlyTask.destroy();
      this.lb.clearPeriodLeaderBoard(group, 'monthly');
    }

    if (yearly && !!this.yearlyTask) {
      this.yearlyTask.destroy();
      this.lb.clearPeriodLeaderBoard(group, 'yearly');
    }
  }
}


module.exports = RcLeaderBoard;