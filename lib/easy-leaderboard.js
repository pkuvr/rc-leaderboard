function EasyLeaderBoard(name, options, redisOptions) {
  this.leaderBoardName = name;
  options || (options = {});
  redisOptions || (redisOptions = {host: '127.0.0.1', port: 6379});
}

module.exports = EasyLeaderBoard;
