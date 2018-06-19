'use strict';
let RcLeaderBoard = require('../index');

//let chai = require('chai');
let assert = require('chai').assert;

describe('index', function () {
  let lb = new RcLeaderBoard('127.0.0.1', 63790);

  beforeEach(function (done) {
    this.timeout(3000);
    setTimeout(done, 2500);
    lb.flushAll();

    lb.activePeriods({
      group: 'default',
      daily: true,
      weekly: true,
      monthly: true,
      yearly: true
    });

    lb.add({
      userId: 1,
      attrName: 'time_len',
      createdAt: new Date().toString(),
      score: 30,
      extra: {nickname: 'user1'}
    });

    lb.add({
      userId: 2,
      attrName: 'time_len',
      createdAt: new Date().toString(),
      score: 10,
      extra: {nickname: 'user2'}
    });
    lb.add({
      userId: 3,
      attrName: 'time_len',
      createdAt: new Date().toString(),
      score: 60,
      extra: {nickname: 'user3'}
    });
    lb.add({
      userId: 4,
      attrName: 'time_len',
      createdAt: new Date().toString(),
      score: 8,
      extra: {nickname: 'user4'}
    });
    lb.add({
      userId: 5,
      attrName: 'time_len',
      createdAt: new Date().toString(),
      score: 100,
      extra: {nickname: 'user5'}
    });

    setTimeout(function () {
      lb.add({
        userId: 5,
        attrName: 'time_len',
        createdAt: new Date().toString(),
        score: 5,
        extra: {nickname: 'user5'}
      });
    }, 50);
  });

  afterEach(function (done) {
    this.timeout(3000);
    setTimeout(done, 2500);
    lb.flushAll();
  });

  /**
   * 获取排行榜 alltime
   */
  it('#getLeaderboard()', function (done) {
    lb.getLeaderboard((err, userIds) => {
      assert.equal(5, userIds.length);
      done();
    }, {
      group: 'default',
      attrName: 'time_len',
      period: 'alltime'
    });
  });

  /**
   * top榜
   */
  it('#top', function (done) {
    lb.getTop(3, (err, userIds) => {
      assert.equal(3, userIds.length);
      done();
    }, {
      group: 'default',
      period: 'alltime',
      attrName: 'time_len'
    });
  });

  /**
   * 获取用户上下范围排行榜
   */
  it('#getAroundUserLeaderboard()', function (done) {
    lb.getAroundUserLeaderboard(1, (err, userIds) => {
      assert.equal(3, userIds.length);
      done();
    }, {
      group: 'default',
      period: 'alltime',
      attrName: 'time_len',
      range: 1
    });
  });

  /**
   * 获取排名
   */
  it('#getRank', function (done) {
    lb.getRank(3, (err, rank) => {
      assert.equal(1, rank);
      done();
    }, {
      group: 'default',
      period: 'alltime',
      attrName: 'time_len'
    });
  });


  /**
   * 最高分
   */
  it('#getBestScore', function (done) {
    lb.getBestScore(1, (err, score) => {
      assert.equal(30, score);
      done();
    }, {
      group: 'default',
      period: 'alltime',
      attrName: 'time_len'
    });
  });

  /**
   * 累计分
   */
  it('#getTotalScore', function (done) {
    lb.getTotalScore(5, (err, score) => {
      assert.equal(105, score);
      done();
    }, {
      group: 'default',
      period: 'alltime',
      attrName: 'time_len'
    });
  });

  /**
   * 开启周期性排行
   */
  /*it('#activePeriods', function (done) {
    this.timeout(3500);
    lb.activePeriods({daily: true});
    setTimeout(() => {
      lb.getLeaderboard((err, userIds) => {
        assert.equal(0, userIds.length);
        lb.removeLeaderboards({group: 'default', period: 'daily'});
        done();
      }, {group: 'default', period: 'daily', attrName: 'time_len'});
    }, 1100);
  });*/
});