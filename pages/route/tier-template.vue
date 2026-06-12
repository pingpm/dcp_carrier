<template>
  <view class="page tier-template-page">
    <view class="form-header">
      <view class="form-header-title">公里阶梯价模板</view>
      <view class="form-header-desc"
        >小板线路可根据运送公里数设置分段阶梯价，便于系统精确报价。</view
      >
    </view>

    <!-- Create template section -->
    <view class="section">
      <view class="section-title">新建价格模板</view>

      <view class="field">
        <text class="label">模板名称 <text class="required">*</text></text>
        <input
          class="input"
          v-model="newTemplateName"
          placeholder="例如: 华东近郊阶梯报价"
          placeholder-style="color:#9ca3af"
        />
      </view>

      <view class="field">
        <view class="row-between align-center" style="margin-bottom: 12rpx">
          <text class="label" style="margin-bottom: 0"
            >分段阶梯规则 <text class="required">*</text></text
          >
          <text class="text-link" @click="addTierItem">+ 新增区间</text>
        </view>

        <!-- Tier rules list -->
        <view v-for="(item, index) in newItems" :key="index" class="tier-rule-row">
          <view class="row align-center">
            <input
              class="input tier-input"
              v-model="item.startKm"
              type="number"
              placeholder="起运(km)"
            />
            <text class="connector-txt">至</text>
            <input
              class="input tier-input"
              v-model="item.endKm"
              type="number"
              placeholder="送达(km)"
            />
            <text class="unit-txt">公里,</text>
            <input
              class="input price-input-mini"
              v-model="item.priceYuan"
              type="digit"
              placeholder="元/km"
            />
            <text class="delete-rule-btn" @click="removeTierItem(index)">×</text>
          </view>
        </view>
      </view>

      <button class="primary-btn animate-btn w-full" :loading="submitting" @click="createTemplate">
        保存并添加价格模板
      </button>
    </view>

    <!-- Existing Templates list -->
    <view class="section" style="margin-top: 30rpx">
      <view class="section-title">已有价格模板 ({{ templates.length }})</view>

      <view class="empty" v-if="templates.length === 0"> 暂无已保存的阶梯价模板 </view>
      <view v-else class="templates-list">
        <view class="template-item-card" v-for="t in templates" :key="t.id">
          <view class="template-name font-bold">{{ t.templateName }}</view>
          <view class="template-rules-summary">
            <view class="rule-summary-row" v-for="(rule, idx) in t.items" :key="idx">
              · {{ rule.startKm }} - {{ rule.endKm || '∞' }} 公里:
              <text class="price-hl font-bold"
                >{{ (rule.pricePerKmCent / 100).toFixed(2) }}元/公里</text
              >
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { api, requireLogin } from '../../utils/api.js';
import { yuanToCent } from '../../utils/format.js';

export default {
  data() {
    return {
      templates: [],
      newTemplateName: '',
      newItems: [
        { startKm: '0', endKm: '50', priceYuan: '5.00' },
        { startKm: '51', endKm: '100', priceYuan: '4.50' },
      ],
      submitting: false,
    };
  },
  onLoad() {
    if (requireLogin()) this.loadTemplates();
  },
  methods: {
    async loadTemplates() {
      try {
        const res = await api.tierTemplates();
        this.templates = res.items || [];
      } catch (err) {}
    },
    addTierItem() {
      // Find end km of last item
      let start = '0';
      if (this.newItems.length > 0) {
        const last = this.newItems[this.newItems.length - 1];
        if (last.endKm) {
          start = String(Number(last.endKm) + 1);
        }
      }
      this.newItems.push({ startKm: start, endKm: '', priceYuan: '' });
    },
    removeTierItem(index) {
      this.newItems.splice(index, 1);
    },
    validate() {
      if (!this.newTemplateName.trim()) {
        uni.showToast({ title: '请输入模板名称', icon: 'none' });
        return false;
      }
      if (this.newItems.length === 0) {
        uni.showToast({ title: '请至少添加一个阶梯区间', icon: 'none' });
        return false;
      }

      // Validate items
      for (let i = 0; i < this.newItems.length; i++) {
        const item = this.newItems[i];
        if (item.startKm === '' || !item.priceYuan) {
          uni.showToast({ title: `第 ${i + 1} 个区间的起始公里与单价必填`, icon: 'none' });
          return false;
        }
      }
      return true;
    },
    async createTemplate() {
      if (!this.validate()) return;
      this.submitting = true;
      try {
        const payload = {
          templateName: this.newTemplateName,
          items: this.newItems.map((item) => ({
            startKm: Number(item.startKm),
            endKm: item.endKm ? Number(item.endKm) : null,
            pricePerKmCent: yuanToCent(item.priceYuan),
          })),
        };
        await api.createTierTemplate(payload);
        uni.showToast({ title: '价格模板新建成功', icon: 'success' });

        // Reset form
        this.newTemplateName = '';
        this.newItems = [
          { startKm: '0', endKm: '50', priceYuan: '5.00' },
          { startKm: '51', endKm: '100', priceYuan: '4.50' },
        ];

        this.loadTemplates();
      } catch (err) {
        console.error(err);
      } finally {
        this.submitting = false;
      }
    },
  },
};
</script>

<style>
.tier-template-page {
  padding: 30rpx;
  padding-bottom: calc(50rpx + env(safe-area-inset-bottom));
}

.form-header {
  margin-bottom: 36rpx;
  padding: 0 10rpx;
}

.form-header-title {
  font-size: 38rpx;
  font-weight: 800;
  color: #111827;
}

.form-header-desc {
  font-size: 24rpx;
  color: #6b7280;
  margin-top: 10rpx;
  line-height: 1.5;
}

.required {
  color: #ef4444;
  margin-left: 6rpx;
  font-weight: bold;
}

.tier-rule-row {
  margin-bottom: 16rpx;
}

.tier-input {
  max-width: 140rpx;
  text-align: center;
  padding: 0 10rpx !important;
}

.price-input-mini {
  max-width: 150rpx;
  text-align: center;
  padding: 0 10rpx !important;
}

.connector-txt {
  font-size: 26rpx;
  color: #6b7280;
  padding: 0 10rpx;
}

.unit-txt {
  font-size: 24rpx;
  color: #9ca3af;
  padding: 0 8rpx;
}

.delete-rule-btn {
  font-size: 40rpx;
  color: #9ca3af;
  padding: 0 20rpx;
  line-height: 1;
}

.delete-rule-btn:active {
  color: #dc2626;
}

.template-item-card {
  padding: 24rpx;
  border-bottom: 1rpx solid #f1f5f9;
}

.template-item-card:last-child {
  border-bottom: 0;
}

.template-name {
  font-size: 28rpx;
  color: #111827;
  margin-bottom: 12rpx;
}

.template-rules-summary {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  padding-left: 12rpx;
}

.rule-summary-row {
  font-size: 24rpx;
  color: #4b5563;
}

.price-hl {
  color: #1677ff;
}
</style>
