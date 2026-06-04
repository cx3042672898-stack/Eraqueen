# 角色预设图像指南

## 目录结构

```
cg/char/
  {charId}/
    normal.jpg        ← 角色默认头像（在庄园、调教页面自动显示）
    manifest.json     ← 相册预设图清单（可选）
    scene_01.jpg      ← 其他图片（在 manifest.json 中声明后显示）
    portrait_01.jpg
    ...
```

## manifest.json 格式

```json
{
  "images": [
    {
      "file": "portrait_01.jpg",
      "ratio": "3-4",
      "album": "立绘"
    },
    {
      "file": "scene_01.jpg",
      "ratio": "16-9",
      "album": "场景"
    }
  ]
}
```

## ratio 可用值

| 值     | 说明         |
|--------|-------------|
| 9-16   | 9:16 竖版   |
| 16-9   | 16:9 横版   |
| 4-3    | 4:3 横版    |
| 3-4    | 3:4 竖版    |
| 1-1    | 1:1 正方形  |

## 优先级说明

- 庄园头像：用户自己上传 > normal.jpg > emoji 默认
- 相册：用户上传的图 > manifest.json 预设图（显示在"内置图库"区）
