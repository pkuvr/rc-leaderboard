'use strict';

let leaderboard = require('../lib/leaderboard');
let chai = require('chai');
let assert = require('chai').assert;
let expect = chai.expect;

describe('leaderboard', function () {
  let lb = new leaderboard();
  lb.createClient('127.0.0.1', 6379);

  beforeEach(function (done) {
    this.timeout(3000);
    setTimeout(done, 2500);

    lb.activePeriod('daily');

    lb.add({
      userId: 1,
      attrName: 'cal',
      createdAt: new Date().toString(),
      score: 30,
      extra: {nickname: 'user1'}
    });
    lb.add({
      userId: 2,
      attrName: 'cal',
      createdAt: new Date().toString(),
      score: 10,
      extra: {nickname: 'user2'}
    });
    lb.add({
      userId: 3,
      attrName: 'cal',
      createdAt: new Date().toString(),
      score: 60,
      extra: {nickname: 'user3'}
    });
    lb.add({
      userId: 4,
      attrName: 'cal',
      createdAt: new Date().toString(),
      score: 8,
      extra: {nickname: 'user4'}
    });
    lb.add({
      userId: 5,
      attrName: 'cal',
      createdAt: new Date().toString(),
      score: 100,
      extra: {nickname: 'user5'}
    });

    setTimeout(function () {
      lb.add({
        userId: 5,
        attrName: 'cal',
        createdAt: new Date().toString(),
        score: 5,
        extra: {nickname: 'user5'}
      });
    }, 50);
  });

  afterEach(function (done) {
    lb.flushAll();
    done();
  });

  /**
   * 获取总榜排名
   */
  it('#getRank() alltime', function (done) {
    lb.getRank('default', 'alltime', '1', 'cal', 'best', (err, rank) => {
      assert.equal(2, rank);
      done();
    });
  });

  /**
   * 获取日榜排名
   */
  it('#getRank() daily', function (done) {
    lb.getRank('default', 'daily', '1', 'cal', 'best', (err, rank) => {
      assert.equal(2, rank);
      done();
    });
  });

  /**
   * 获取总排行榜
   */
  it('#getLeaderboard() alltime', function (done) {
    lb.getLeaderboard('default', 'alltime', 'cal', 'best', 0, 10, (err, userIds) => {
      assert.equal('5', userIds[0]);
      assert.equal('3', userIds[1]);
      assert.equal('1', userIds[2]);
      done();
    });
  });

  /**
   * 获取日排行榜
   */
  it('#getLeaderboard() daily', function (done) {
    lb.getLeaderboard('default', 'daily', 'cal', 'best', 0, 10, (err, userIds) => {
      assert.equal('1', userIds[2]);
      assert.equal('2', userIds[3]);
      assert.equal('4', userIds[4]);
      done();
    });
  });

  /**
   * 清除周期性排行
   */
  it('#clearPeriodLeaderboard() leaderboard', function (done) {
    lb.clearPeriodLeaderBoard('default', 'daily', (err, res) => {
      lb.getRank('default', 'daily', '1', 'cal', 'best', (err, rank) => {
        assert.equal(null, rank);
        done();
      });
    });
  });

  /**
   * 最总体高分
   */
  it('#getUserBestScore() alltime', function (done) {
    lb.getUserBestScore('default', 'alltime', '1', 'cal', (err, bestScore) => {
      assert.equal(30, bestScore);
      done();
    });
  });

  /**
   * 日最高分
   */
  it('#getUserBestScore() daily', function (done) {
    lb.getUserBestScore('default', 'daily', '1', 'cal', (err, bestScore) => {
      assert.equal(30, bestScore);
      done();
    });
  });

  /**
   * 总累计分
   */
  it('#getUserTotalScore() alltime', function (done) {
    lb.getUserTotalScore('default', 'alltime', '5', 'cal', (err, totalScore) => {
      assert.equal(105, totalScore);
      done();
    });
  });

  /**
   * 日累计分
   */
  it('#getUserTotalScore() daily', function (done) {
    lb.getUserTotalScore('default', 'daily', '5', 'cal', (err, totalScore) => {
      assert.equal(105, totalScore);
      done();
    });
  });

  /**
   * 清除周期性数据测试
   */
  it('#clearPeriodLeaderboard() highScore', function (done) {
    this.timeout(4000);
    setTimeout(done, 3000);
    lb.getUserBestScore('default', 'daily', '1', 'cal', (err, bestScore) => {
      assert.equal(30, bestScore);
    });
    lb.getUserTotalScore('default', 'daily', '1', 'cal', (err, totalScore) => {
      assert.equal(30, totalScore);
    });
    lb.clearPeriodLeaderBoard('default', 'daily', (err, res) => {
      lb.getUserBestScore('default', 'daily', '1', 'cal', (err, bestScore) => {
        assert.equal(null, bestScore);
      });
      lb.getUserTotalScore('default', 'daily', '1', 'cal', (err, totalScore) => {
        assert.equal(null, totalScore);
      });
    });
  });

});

