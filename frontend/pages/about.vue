<template>
  <div class="max-w-3xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold mb-6">关于与致谢</h1>

    <section class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <h2 class="text-lg font-semibold mb-3">开源许可</h2>
      <p class="text-sm text-gray-600 leading-relaxed mb-3">
        Trans-Search 基于 <a href="https://www.gnu.org/licenses/gpl-3.0.html" target="_blank" class="text-primary-600 hover:underline">GNU General Public License v3.0 (GPL-3.0)</a> 开源。
      </p>
      <pre v-pre class="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-500 leading-relaxed overflow-x-auto">
GNU GENERAL PUBLIC LICENSE
Version 3, 29 June 2007

Copyright (C) 2007 Free Software Foundation, Inc. https://fsf.org/

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see https://www.gnu.org/licenses/.
      </pre>
    </section>

    <section class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <h2 class="text-lg font-semibold mb-3">技术致谢</h2>
      <div class="space-y-3 text-sm text-gray-600 leading-relaxed">
        <div class="flex items-start gap-3">
          <span class="shrink-0 w-20 text-xs text-gray-400 font-mono">搜索引擎</span>
          <span><a href="https://qdrant.tech" target="_blank" class="text-primary-600 hover:underline">Qdrant</a> — 开源向量数据库，提供混合检索能力</span>
        </div>
        <div class="flex items-start gap-3">
          <span class="shrink-0 w-20 text-xs text-gray-400 font-mono">基础模型</span>
          <span>
            <a href="https://huggingface.co/Qwen" target="_blank" class="text-primary-600 hover:underline">Qwen</a> 系列模型（Qwen3-8B / Qwen3-Embedding-0.6B）—
            <a href="https://www.siliconflow.cn" target="_blank" class="text-primary-600 hover:underline">硅基流动</a> 提供 API 服务
          </span>
        </div>
        <div class="flex items-start gap-3">
          <span class="shrink-0 w-20 text-xs text-gray-400 font-mono">重排序</span>
          <span><a href="https://huggingface.co/BAAI/bge-reranker-v2-m3" target="_blank" class="text-primary-600 hover:underline">BAAI/bge-reranker-v2-m3</a> — 北京智源人工智能研究院开源的交叉编码器重排序模型</span>
        </div>
        <div class="flex items-start gap-3">
          <span class="shrink-0 w-20 text-xs text-gray-400 font-mono">运行时</span>
          <span><a href="https://workers.cloudflare.com" target="_blank" class="text-primary-600 hover:underline">Cloudflare Workers</a> — 边缘计算平台；<a href="https://hono.dev" target="_blank" class="text-primary-600 hover:underline">Hono</a> — 轻量级 Web 框架</span>
        </div>
        <div class="flex items-start gap-3">
          <span class="shrink-0 w-20 text-xs text-gray-400 font-mono">前端</span>
          <span><a href="https://nuxt.com" target="_blank" class="text-primary-600 hover:underline">Nuxt</a> / <a href="https://vuejs.org" target="_blank" class="text-primary-600 hover:underline">Vue</a> / <a href="https://tailwindcss.com" target="_blank" class="text-primary-600 hover:underline">Tailwind CSS</a></span>
        </div>
      </div>
    </section>

    <section class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 class="text-lg font-semibold mb-3">内容来源</h2>
      <p class="text-sm text-gray-600 leading-relaxed">
        本站聚合的跨性别相关信息来源于多个中文社区、医疗指南、法律文书及公益组织公开资料。
        所有内容的版权归原作者或来源机构所有。如有版权问题，请联系我们处理。
      </p>
    </section>
  </div>
</template>
