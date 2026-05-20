# CG 图片资源目录

## 目录结构
```
cg/
├── work/       打工场景 CG
├── daily/      日常事件 CG
├── rest/       休息剧情 CG
├── char/       角色专属 CG（子文件夹按角色ID命名，如 char/1/）
├── event/      特殊事件 CG
├── shop/       商店 CG
├── corvee/     劳役 CG
└── date/       约会 CG
```

## 使用方法
在剧情数据中添加 `cg` 字段指定图片路径，例如：
```js
{
  id: 'work_mkt_1',
  title: '...',
  cg: 'cg/work/market_rain.jpg',  // ← 添加此字段
  story: [...]
}
```
story.js 的 _renderStoryModal 会自动检测并显示 CG。

## 命名规范
- 打工: `work/[地点缩写]_[描述].jpg`  如 `work/market_rain.jpg`
- 角色: `char/[charId]/[情境].jpg`     如 `char/1/affection_80.jpg`
- 日常: `daily/[事件id].jpg`           如 `daily/pd_morning.jpg`
- 特殊: `event/[事件名].jpg`

## 图片规格建议
- 尺寸：750×1000px（竖屏）或 750×500px（横屏场景）
- 格式：JPG（照片）或 PNG（透明背景立绘）
- 大小：单张建议 < 300KB

## AI 生成提示词模板
放置于 `cg/prompts/` 文件夹，格式参考：
  - `cg/prompts/work_market.txt` — 集市打工场景提示词
  - `cg/prompts/char_[id].txt` — 角色立绘提示词
