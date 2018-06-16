'use strict';

const async = require('async');
const redis = require('redis');
const AUTO_INCREMENT_KEY = 'score_id';

//周期性排行榜前缀
const ALLTIME_PREFIX = 'alltime:',
  DAILY_PREFIX = 'daily:',
  WEEKLY_PREFIX = 'weekly:',
  MONTHLY_PREFIX = 'monthly:',
  YEARLY_PREFIX = 'yearly:';

//总表
const HASH_TABLE_SCORE_KEY_PREFIX = 'score:',
  HASH_TABLE_SCORE_FIELD_USER_ID = 'user_id',
  HASH_TABLE_SCORE_FIELD_ATTR_NAME = 'attr_name',
  HASH_TABLE_SCORE_FIELD_CREATED_AT = 'created_at',
  HASH_TABLE_SCORE_FIELD_SCORE = 'score',
  HASH_TABLE_SCORE_FIELD_EXTRA = 'extra';

//用户高分表
const HASH_TABLE_HIGHT_SCORE_KEY_PREFIX = 'hscore:',
  HASH_TABLE_HIGHT_SCORE_FIELD_BEST_SCORE = 'best_score',
  HASH_TABLE_HIGHT_SCORE_FIELD_TOTAL_SCORE = 'total_score',
  HASH_TABLE_LEARDER_BOARD_KEY_PREFIX = 'leaderboard:';

//排行榜类型
const LEADERBOARD_KEY_BEST_SCORE_PREFIX = 'bestscore:',
  LEADERBOARD_KEY_TOTAL_SCORE_PREFIX = 'totalscore:';

/**
 * 排行榜类
 */
class LeaderBoard {
  constructor() {
    /**
     * [private]
     * 设置高分累计分和排行榜
     * @param userId 用户编号
     * @param attrName 属性名
     * @param scoreId 积分对应总表ID
     * @param score 积分
     * @param hScoreKeyPrefix 高分和累计分前缀
     * @param ldKeyPrefix 排行榜前缀
     */
    this.upsertHightScore = (userId, attrName, scoreId, score, hScoreKeyPrefix, ldKeyPrefix) => {
      let self = this;
      let hScoreKey = hScoreKeyPrefix + userId + ':' + attrName;

      //设置最高分
      let setBestScore = (userId, attrName, scoreId, score) => {
        self.client.hset(hScoreKey, HASH_TABLE_HIGHT_SCORE_FIELD_BEST_SCORE, scoreId);
        self.client.zadd(ldKeyPrefix + LEADERBOARD_KEY_BEST_SCORE_PREFIX + attrName, score, userId);
      };

      self.client.hget(hScoreKey, HASH_TABLE_HIGHT_SCORE_FIELD_BEST_SCORE, (err, bestScoreId) => {
        if (err) {
          console.log(err);
          return;
        }
        if (bestScoreId === null) {
          setBestScore(userId, attrName, scoreId, score);
          return;
        }

        self.client.hget(HASH_TABLE_SCORE_KEY_PREFIX + bestScoreId, HASH_TABLE_SCORE_FIELD_SCORE, (err, prevBestScore) => {
          if (err) {
            console.log(err);
            return;
          }
          if (Number(score) > Number(prevBestScore)) {
            setBestScore(userId, attrName, scoreId, score);
          }
        });
      });
      //设置累计分
      let setTotalScore = (userId, attrName, score) => {
        self.client.hset(hScoreKey, HASH_TABLE_HIGHT_SCORE_FIELD_TOTAL_SCORE, score);
        self.client.zadd(ldKeyPrefix + LEADERBOARD_KEY_TOTAL_SCORE_PREFIX + attrName, score, userId);
      };
      self.client.hget(hScoreKey, HASH_TABLE_HIGHT_SCORE_FIELD_TOTAL_SCORE, (err, oldTotalScore) => {
        if (oldTotalScore === null) {
          setTotalScore(userId, attrName, score);
          return;
        }
        let totalScore = Number(oldTotalScore) + Number(score);
        setTotalScore(userId, attrName, totalScore);
      });
    };

    /**
     * [private]
     * 设置用户高分和累计分
     * @param userId
     * @param attrName
     * @param scoreId
     * @param score
     * @param options
     */
    this.addHightScore = (userId, attrName, scoreId, score, options) => {
      options = options || {};
      let group = options.group || 'default';

      let hightScoreKeyPrefix = group + ':' + HASH_TABLE_HIGHT_SCORE_KEY_PREFIX;
      let leaderBoardKeyPrefix = group + ':' + HASH_TABLE_LEARDER_BOARD_KEY_PREFIX;
      this.upsertHightScore(userId, attrName, scoreId, score, hightScoreKeyPrefix + ALLTIME_PREFIX, leaderBoardKeyPrefix + ALLTIME_PREFIX);
      if (this.daily) {
        this.upsertHightScore(userId, attrName, scoreId, score, hightScoreKeyPrefix + DAILY_PREFIX, leaderBoardKeyPrefix + DAILY_PREFIX);
      }
      if (this.weekly) {
        this.upsertHightScore(userId, attrName, scoreId, score, hightScoreKeyPrefix + WEEKLY_PREFIX, leaderBoardKeyPrefix + WEEKLY_PREFIX);
      }
      if (this.monthly) {
        this.upsertHightScore(userId, attrName, scoreId, score, hightScoreKeyPrefix + MONTHLY_PREFIX, leaderBoardKeyPrefix + MONTHLY_PREFIX);
      }
      if (this.yearly) {
        this.upsertHightScore(userId, attrName, scoreId, score, hightScoreKeyPrefix + YEARLY_PREFIX, leaderBoardKeyPrefix + YEARLY_PREFIX);
      }
    };

    /**
     * [private]
     * 获得高分累计分表Key前缀
     * @param group
     * @param period
     * @param prefix
     * @param excludeAllTime
     * @returns {string}
     */
    this.getPeriodKeyPrefix = (group, period, prefix, excludeAllTime = false) => {
      prefix = group + ':' + prefix;
      if (period === 'daily') {
        return prefix + DAILY_PREFIX;
      } else if (period === 'weekly') {
        return prefix + WEEKLY_PREFIX;
      } else if (period === 'monthly') {
        return prefix + MONTHLY_PREFIX;
      } else if (period === 'yearly') {
        return prefix + YEARLY_PREFIX;
      } else {
        if (excludeAllTime) {
          return null;
        } else {
          return prefix + ALLTIME_PREFIX;
        }
      }
    };

    /**
     * [private]
     * 添加总表记录
     * @param scoreId
     * @param userId
     * @param attrName
     * @param createdAt
     * @param score
     * @param extra
     * @param options
     */
    this.addScore = (scoreId, userId, attrName, createdAt, score, extra, options) => {
      let self = this;
      self.client.hmset(HASH_TABLE_SCORE_KEY_PREFIX + scoreId,
        HASH_TABLE_SCORE_FIELD_USER_ID, userId,
        HASH_TABLE_SCORE_FIELD_ATTR_NAME, attrName,
        HASH_TABLE_SCORE_FIELD_CREATED_AT, createdAt,
        HASH_TABLE_SCORE_FIELD_SCORE, score,
        HASH_TABLE_SCORE_FIELD_EXTRA, JSON.stringify(extra),
        (err, res) => {
          self.addHightScore.call(this, userId, attrName, scoreId, score, options);
        });
    };
  }


  /**
   * 创建redis客户端
   * @param host
   * @param port
   * @param options
   */
  createClient(host, port, options) {
    let self = this;
    self.client = redis.createClient(port, host, options);
    self.client.on('error', (err) => {
      console.error('error: host=' + host + ', port=' + port + ' - ' + err);
    });
  }

  /**
   * 设置启用某个周期性排行
   * @param period
   */
  activePeriod(period) {
    if (period === 'daily') {
      this.daily = true;
    } else if (period === 'weekly') {
      this.weekly = true;
    } else if (period === 'monthly') {
      this.monthly = true;
    } else if (period === 'yearly') {
      this.yearly = true;
    }
  }

  /**
   * 添加一个实体
   * @param entity
   * @param options
   */
  add(entity, options) {
    let self = this;
    self.client.incr(AUTO_INCREMENT_KEY, (err, scoreId) => {
      self.addScore.call(this, scoreId, entity.userId, entity.attrName, entity.createdAt, entity.score, entity.extra, options);
    });
  }

  /**
   * 获得用户最高分
   * @param group
   * @param period
   * @param userId
   * @param attrName
   * @param callback
   * @param filterOptions
   */
  getUserBestScore(group, period, userId, attrName, callback, filterOptions) {
    let self = this;
    let key = self.getPeriodKeyPrefix.call(this, group, period, HASH_TABLE_HIGHT_SCORE_KEY_PREFIX);
    let hScoreKey = key + userId + ':' + attrName;
    self.client.hget(hScoreKey, HASH_TABLE_HIGHT_SCORE_FIELD_BEST_SCORE, (err, scoreId) => {
      self.client.hgetall(HASH_TABLE_SCORE_KEY_PREFIX + scoreId, (err, res) => {
        if (err) {
          callback(err, res);
          return;
        }
        if (res === null) {
          callback(err, res);
          return;
        }

        filterOptions = filterOptions || {};
        let containsScore = filterOptions.score || true,
          containsExtra = filterOptions.extra || false,
          containsCreatedAt = filterOptions.createdAt || false;

        let scoreObject = {};
        if (containsExtra || containsCreatedAt) {
          if (containsExtra) scoreObject.extra = res.extra;
          if (containsCreatedAt) scoreObject.createdAt = res.created_at;
          if (containsScore) scoreObject.score = res.score;
        } else {
          scoreObject = res.score;
        }
        callback(err, scoreObject);
      });
    });
  }

  /**
   * 获取用户累计分
   * @param group
   * @param period
   * @param userId
   * @param attrName
   * @param callback
   */
  getUserTotalScore(group, period, userId, attrName, callback) {
    let self = this;
    let key = self.getPeriodKeyPrefix.call(this, group, period, HASH_TABLE_HIGHT_SCORE_KEY_PREFIX);
    let hScoreKey = key + userId + ':' + attrName;
    self.client.hget(hScoreKey, HASH_TABLE_HIGHT_SCORE_FIELD_TOTAL_SCORE, (err, score) => {
      if (err)
        callback(err, score);
      if (score === null) {
        callback(err, score);
      }
      callback(null, score);
    });
  }

  /**
   * 获取排行榜
   * @param group
   * @param period
   * @param attrName
   * @param scoreType best最高分 total累计分
   * @param from
   * @param to
   * @param callback
   */
  getLeaderboard(group, period, attrName, scoreType, from, to, callback) {
    let SCORE_TYPE = scoreType === 'best' ? LEADERBOARD_KEY_BEST_SCORE_PREFIX : LEADERBOARD_KEY_TOTAL_SCORE_PREFIX;
    let key = this.getPeriodKeyPrefix.call(this, group, period, HASH_TABLE_LEARDER_BOARD_KEY_PREFIX) + SCORE_TYPE + attrName;
    this.client.zrevrange(key, from, to, callback);
  }

  /**
   * 获取用户排名
   * @param group
   * @param period
   * @param userId
   * @param attrName
   * @param scoreType best最高分 total累计分
   * @param callback
   */
  getRank(group, period, userId, attrName, scoreType, callback) {
    let SCORE_TYPE = scoreType === 'best' ? LEADERBOARD_KEY_BEST_SCORE_PREFIX : LEADERBOARD_KEY_TOTAL_SCORE_PREFIX;
    let key = this.getPeriodKeyPrefix.call(this, group, period, HASH_TABLE_LEARDER_BOARD_KEY_PREFIX) + SCORE_TYPE + attrName;
    this.client.zrevrank(key, userId, callback);
  }

  /**
   * 获取用户前后范围的排行榜
   * @param group
   * @param period
   * @param userId
   * @param attrName
   * @param scoreType best最高分 total累计分
   * @param range
   * @param callback
   */
  getAroundUserLeaderboard(group, period, userId, attrName, scoreType, range, callback) {
    let self = this;
    self.getRank(group, period, userId, attrName, scoreType, (err, rank) => {
      if (err)
        callback(err, rank);
      let fromRank = rank - range,
        toRank = rank + range;
      self.getLeaderboard(group, period, attrName, scoreType, fromRank, toRank, callback)
    });
  }

  /**
   * 清除周期性排行榜
   * @param group
   * @param period
   * @param callback
   */
  clearPeriodLeaderBoard(group, period, callback) {
    let self = this;
    let hScoreKeyPrefix = self.getPeriodKeyPrefix.call(this, group, period, HASH_TABLE_HIGHT_SCORE_KEY_PREFIX, true);
    let ldKeyPrefix = self.getPeriodKeyPrefix.call(this, group, period, HASH_TABLE_LEARDER_BOARD_KEY_PREFIX, true);
    let hScoreKey = hScoreKeyPrefix + "*";
    let ldKey = ldKeyPrefix + "*";
    if (!hScoreKeyPrefix || !ldKeyPrefix) {
      return;
    }
    let tasks = [
      (cb) => {
        self.client.keys(ldKey, (err, keys) => {
          self.client.del(keys, cb);
        });
      },
      (cb) => {
        self.client.keys(hScoreKey, (err, keys) => {
          self.client.del(keys, cb);
        });
      }
    ];
    async.parallel(tasks, callback);
  }

  flushAll() {
    this.client.flushall((err, res) => {
      if (err) {
        console.log(err);
      }
    });
  }

  quit() {
    this.client.quit((err, res) => {
      console.info('exiting...');
    });
  }
}

module.exports = LeaderBoard;