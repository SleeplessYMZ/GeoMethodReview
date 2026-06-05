# GeoMethodReview

本仓库用于持续收集、筛选和总结 GIScience、遥感、空间分析与 GeoAI 相关的方法论文。

## 研究目标

本项目关注地理信息科学中的方法发展，而不是围绕单一应用主题筛选文献。当前流程沿用 `LiteratureReview` 的期刊追踪、关键词筛选、月度文献库和每日精读包机制，但将筛选重点调整为方法、数据和时空分析语境。

重点关注的问题包括：

- GeoAI、机器学习和深度学习如何改变 GIScience 研究流程？
- 神经网络、图模型、Transformer、LSTM 等模型如何处理空间、时间和时空数据？
- 空间统计、空间计量、地统计和多尺度分析方法有哪些新进展？
- 遥感影像、街景、轨迹、传感器、POI、OSM 等数据源如何支撑方法创新？
- 因果推断、自然实验、面板模型和准实验设计如何进入地理学研究？
- 哪些方法具有可复用性，适合迁移到健康地理、城市研究、环境暴露或区域分析中？

## 方法范围

收集范围包括但不限于以下方向。

### GeoAI 与基础模型

- GeoAI、geospatial artificial intelligence、spatial AI
- 地理基础模型、遥感基础模型、多模态模型
- 大语言模型、视觉语言模型、知识增强模型
- 自监督学习、对比学习、迁移学习和领域自适应

### 机器学习与深度学习

- machine learning、random forest、SVM、XGBoost、ensemble learning
- neural network、CNN、RNN、LSTM、GRU、autoencoder
- Transformer、attention、U-Net、ResNet、temporal convolutional network
- 分类、预测、聚类、异常检测、特征选择和表示学习

### 图、网络与空间交互

- graph neural network、GCN、GAT、knowledge graph
- road network、spatial graph、flow network、complex network
- spatial interaction model、gravity model、radiation model
- OD 流、轨迹挖掘、出行预测和可达性模型

### 空间统计与空间计量

- spatial regression、spatial econometrics、GWR、MGWR
- spatial autocorrelation、Moran's I、LISA、hotspot analysis
- kriging、geostatistics、variogram、point pattern analysis
- MAUP、spatial heterogeneity、spatial dependence、spatial nonstationarity

### 时序与时空分析

- time series、spatiotemporal modeling、space-time analysis
- LSTM、sequence model、state-space model、Kalman filter
- change detection、trend analysis、event detection、forecasting
- panel data、longitudinal analysis、before-after comparison

### 因果推断与仿真优化

- causal inference、difference-in-differences、synthetic control
- instrumental variable、regression discontinuity、propensity score
- agent-based model、cellular automata、microsimulation
- optimization、genetic algorithm、reinforcement learning、scenario analysis

## 当前期刊范围

目前追踪 25 本核心 GIScience 期刊，主要来自 GIScience 文献计量研究中常见的核心期刊清单。

1. *Annals of the American Association of Geographers*
2. *Annals of GIS*
3. *Applied Geography*
4. *Cartography and Geographic Information Science*
5. *Computers & Geosciences*
6. *Computers, Environment and Urban Systems*
7. *Environment and Planning B: Urban Analytics and City Science*
8. *Geographical Analysis*
9. *Geoinformatica*
10. *GIScience & Remote Sensing*
11. *Geo-spatial Information Science*
12. *International Journal of Digital Earth*
13. *International Journal of Geographical Information Science*
14. *ISPRS International Journal of Geo-Information*
15. *International Journal of Applied Earth Observation and Geoinformation*
16. *Journal of Geographical Systems*
17. *Journal of Geovisualization and Spatial Analysis*
18. *Journal of Spatial Information Science*
19. *Journal of Spatial Science*
20. *ISPRS Journal of Photogrammetry and Remote Sensing*
21. *Photogrammetric Engineering & Remote Sensing*
22. *PFG - Journal of Photogrammetry, Remote Sensing and Geoinformation Science*
23. *Spatial Cognition & Computation*
24. *Transactions in GIS*
25. *ACM Transactions on Spatial Algorithms and Systems*

## 文献筛选原则

优先收集符合以下条件的文章：

1. 标题或摘要中明确出现方法类关键词。
2. 方法与空间、时间、时空、遥感、轨迹、网络或地理数据有关。
3. 具有可复用的方法价值，而不仅是单个案例应用。
4. 对 GIScience、GeoAI、空间统计、遥感分析、城市计算或地理建模有直接贡献。
5. 能为后续研究提供算法、数据处理流程、评价指标或理论框架参考。

应用论文可以进入候选库，但精读时优先选择方法贡献清晰、可迁移性强的文章。

## 工作流程

```text
定期收集目标期刊新文章
        ↓
根据标题和摘要匹配方法关键词
        ↓
标记方法家族、数据来源和时空语境
        ↓
选取核心文献并生成每日精读包
        ↓
按方法方向总结模型、数据、评价和可复用经验
```

## 使用方式

默认抓取从 2026 年 1 月至上一个完整月份的数据：

```bash
node scripts/fetch-crossref.mjs
```

指定月份范围：

```bash
node scripts/fetch-crossref.mjs --from 2026-01 --to 2026-05
```

生成每日精读包：

```bash
node scripts/prepare-daily-reading.mjs --count 3
```

生成月度方法文献简报：

```bash
node scripts/generate-reports.mjs --from 2025-01 --to 2026-05
```

## 项目资料

- [健康数据源](docs/健康数据源.md)：整理中国优先、其他国家和世界尺度的居民健康、慢性病、睡眠、心理健康、时序和地理位置相关数据源。

## 当前状态

项目处于初始化阶段。首要任务是稳定期刊配置、方法关键词体系和 Crossref 筛选流程，然后逐步形成可持续更新的方法文献库。
