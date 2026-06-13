# 普拉提教练端会员管理智能体系统设计

## 1. 本地架构

当前版本采用静态前端应用实现，数据存储在浏览器 `localStorage` 中，适合单店/单教练本机使用。

- 入口页面：`index.html`
- 样式：`styles.css`
- 业务逻辑：`app.js`
- 可选本地服务/图片代理：`server.js`
- 本地存储键：`pilates-coach-agent-v1`

后续如果需要云端同步，可以沿用以下数据结构迁移到数据库。

## 2. 会员档案数据结构

```json
{
  "id": "member_1710000000000",
  "createdAt": "2026-06-12T08:00:00.000Z",
  "updatedAt": "2026-06-12T08:00:00.000Z",
  "basic": {
    "name": "会员姓名",
    "gender": "女",
    "age": 32,
    "height": 165,
    "weight": 56,
    "contact": "手机号/微信",
    "archiveDate": "2026-06-12",
    "occupationPattern": "久坐办公"
  },
  "health": {
    "medicalHistory": "既往病史",
    "surgeryHistory": "手术史",
    "chronicPainAreas": ["肩颈", "腰"],
    "postpartum": {
      "enabled": true,
      "months": 8,
      "deliveryMethod": "剖宫产"
    },
    "postureFlags": ["头前引", "圆肩", "骨盆前倾"],
    "mobilityLimits": ["胸椎伸展受限"],
    "weakMuscles": ["核心", "臀中肌"],
    "currentPain": [
      { "area": "肩颈", "score": 6 }
    ],
    "contraindications": ["卷腹", "跳跃"],
    "cautiousActions": ["深蹲", "过度后弯"]
  },
  "goals": {
    "chiefComplaint": "肩颈痛、体态改善",
    "shortTermGoals": ["降低肩颈疼痛", "建立核心激活"],
    "longTermGoals": ["改善圆肩", "提升稳定性"],
    "exerciseBackground": "练过瑜伽",
    "weeklyFrequency": 2
  },
  "preferences": {
    "communicationStyle": "多鼓励，解释动作目的",
    "specialPeriod": "生理期需降低强度"
  }
}
```

## 3. 单次课程记录数据结构

```json
{
  "id": "session_1710000000000",
  "memberId": "member_1710000000000",
  "date": "2026-06-12",
  "sessionNo": 6,
  "actions": [
    {
      "name": "肩桥",
      "sets": 3,
      "reps": "12",
      "equipment": "垫上",
      "difficulty": 3,
      "targets": ["核心", "髋", "脊柱"]
    }
  ],
  "feedback": {
    "completion": "良好",
    "effort": 6,
    "painArea": "肩颈",
    "painScore": 3,
    "emotion": "稳定",
    "notes": "后半程略疲劳"
  },
  "observation": {
    "quality": "骨盆控制比上节课稳定",
    "compensation": "右侧肩胛上提",
    "progress": "核心启动更快"
  },
  "summary": "课后生成的单课总结文本",
  "createdAt": "2026-06-12T08:30:00.000Z"
}
```

## 4. 页面框架

### 总览

- 当前会员概览
- 本月上课次数、疼痛预警、训练覆盖提醒
- 最近课程记录

### 会员档案

- 基本信息
- 健康与体态评估
- 训练目标
- 特殊注意事项

### 课程记录

- 课程日期与课程序号
- 动作清单快速录入
- 会员反馈
- 教练观察
- 保存前风险检查

### 智能总结

- 单课总结：教练复盘、累积趋势、会员端轻奢文案三段式输出
- 复制总结
- 导出 `.txt`

### 进度报告

- 周期范围选择
- 动作历史汇总
- 疼痛趋势
- 身体能力提升
- 打卡/坚持度
- 目标匹配度
- 下阶段训练方向
- 会员成长/续课沟通版

### AI分析中心

- 智能提醒：风险、重复动作、训练覆盖缺口、情绪/疲劳信号
- 4周训练方向：按当前会员问题与历史课程自动生成
- 体态变化时间轴：建档、第4节、第10节、第20节、最近课程节点
- 续课沟通素材：用于微信反馈、续课复盘或阶段案例整理

### 动作库

- 按会员主诉、体态标签、薄弱部位和历史课程推荐动作
- 支持按核心、肩颈、髋、脊柱等模块筛选
- 标注器械、难度、推荐原因和已练次数

### 画图

- 接口地址：默认 `https://xiaoji.baziapi.site/v1/images/generations`
- 本地配置：API Key、模型、尺寸、数量、本地代理开关
- 提示词：可结合当前会员目标与体态关注生成
- 输出：支持显示、下载、复制提示词、本地历史记录
- 返回兼容：支持 OpenAI 兼容的 `data[].url` 与 `data[].b64_json`

### 数据管理

- 导出本地 JSON
- 导入 JSON
- 清空本地数据

## 5. 画图接口

静态页面会直接向配置的图片接口发起 POST 请求：

```json
{
  "model": "gpt-image-1",
  "prompt": "图片提示词",
  "n": 1,
  "size": "1024x1024"
}
```

如果浏览器直接请求时遇到跨域限制，可以启动本地服务：

```bash
node server.js
```

然后打开 `http://127.0.0.1:4173/`，在画图页勾选“使用本地代理请求接口”。本地代理会把 `/api/images/generations` 转发到 `https://xiaoji.baziapi.site/v1/images/generations`。

## 6. 防呆规则

- 禁忌动作拦截：动作名称命中会员档案中的禁忌动作时阻止保存。
- 慎做动作提醒：动作名称命中慎做动作时允许保存，但提示调整。
- 动作重复检测：近 45 天同一动作出现 3 次及以上时提示变化动作或调整刺激角度。
- 覆盖提醒：近 4 次课未覆盖的训练模块会被列出。
- 疼痛预警追踪：同一疼痛部位近 3 次记录中出现 2 次及以上，或本次疼痛分数大于等于 7，标记为重点关注。
- 情绪/疲劳提醒：近几次反馈出现疲惫、抗拒、紧张、高吃力程度或睡眠压力关键词时提醒降强度。
