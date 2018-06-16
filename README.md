# rc-leaderboard

rc-leaderboard 是一个轻量级的nodejs排行榜模块。

- 支持功能

分组排行
周期性排行：日、周、月、年
最高分和累计分排行
top榜

- 安装

```
npm i rc-leaderload --save
```

- 接口

```
`activePeriods` 启用周期性排行

`add` 添加一个实体

`getLeaderboard` 获取排行榜

`getTop` 获取top榜

`getAroundUserLeaderboard` 前后范围排行

`getBestScore` 最高分

`getTotalScore` 累计分

`getRank` 名次

`removeLeaderboards` 清除排行榜
```


