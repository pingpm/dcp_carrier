<template>
  <view class="page tier-template-page">
    <view class="form-header">
      <view class="form-header-title">公里阶梯价模板</view>
      <view class="form-header-desc"
        >小板和代驾线路可根据运送公里数设置分段阶梯价，便于系统精确报价。</view
      >
    </view>

    <!-- Create template section -->
    <view class="section">
      <view class="section-title">新建价格模板</view>

      <view class="field">
        <text class="label">适用线路类型 <text class="required">*</text></text>
        <view class="grid-two">
          <view
            class="check-row"
            :class="{ checked: routeType === 'SMALL_TRUCK' }"
            @click="switchRouteType('SMALL_TRUCK')"
          >
            <text class="radio-icon-box">{{ routeType === 'SMALL_TRUCK' ? '●' : '' }}</text>
            <text>小板线路</text>
          </view>
          <view
            class="check-row"
            :class="{ checked: routeType === 'DRIVING' }"
            @click="switchRouteType('DRIVING')"
          >
            <text class="radio-icon-box">{{ routeType === 'DRIVING' ? '●' : '' }}</text>
            <text>代驾线路</text>
          </view>
        </view>
      </view>

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
          <button class="add-tier-btn" size="mini" @click="addTierItem">+ 新增区间</button>
        </view>

        <view v-for="(item, index) in newItems" :key="index" class="tier-rule-row">
          <view class="tier-rule-head">
            <text class="tier-rule-title">段 {{ index + 1 }}</text>
            <button class="tier-delete-btn" size="mini" @click="removeTierItem(index)">删除</button>
          </view>

          <view class="tier-range-line">
            <view class="tier-input-box">
              <input
                class="input tier-input"
                v-model="item.startKm"
                type="number"
                placeholder="起始"
                @input="onTierInput(index, 'startKm', $event.detail.value)"
              />
              <text class="tier-unit">KM</text>
            </view>
            <text class="tier-connector">至</text>
            <view class="tier-input-box">
              <text class="tier-prefix wide">小于</text>
              <input
                class="input tier-input"
                v-model="item.endKm"
                type="number"
                :placeholder="index === newItems.length - 1 ? '无上限' : '结束'"
                @input="onTierInput(index, 'endKm', $event.detail.value)"
              />
              <text class="tier-unit">KM</text>
            </view>
          </view>

          <view class="tier-price-line">
            <text class="tier-price-label">单价</text>
            <input
              class="input price-input-mini"
              v-model="item.priceYuan"
              type="digit"
              placeholder="请输入每公里价格"
            />
            <text class="unit-txt">元/KM</text>
          </view>

          <view class="tier-rule-hint">{{ formatRangeText(item.startKm, item.endKm) }}</view>
        </view>
      </view>

      <view class="template-form-footer">
        <button class="primary-btn animate-btn w-full" :loading="submitting" @click="createTemplate">
          保存并添加价格模板
        </button>
      </view>
    </view>

    <!-- Existing Templates list -->
    <view class="section" style="margin-top: 30rpx">
      <view class="section-title">已有价格模板 ({{ templates.length }})</view>

      <view class="empty" v-if="templates.length === 0"> 暂无已保存的阶梯价模板 </view>
      <view v-else class="templates-list">
        <view class="template-item-card" v-for="t in templates" :key="t.id">
          <view class="template-head">
            <view>
              <view class="template-name font-bold">{{ t.templateName }}</view>
              <view class="template-type">
                {{ t.routeType === 'DRIVING' ? '代驾线路' : '小板线路' }}
              </view>
            </view>
            <button
              class="delete-template-btn"
              size="mini"
              :loading="deletingTemplateId === t.id"
              @click="deleteTemplate(t)"
            >
              删除
            </button>
          </view>
          <view class="template-rules-summary">
            <view class="rule-summary-row" v-if="!t.items || t.items.length === 0">
              暂无计费规则
            </view>
            <view class="rule-summary-row" v-for="(rule, idx) in t.items || []" :key="idx">
              {{ formatRangeText(rule.startKm, rule.endKm) }}：
              <text class="price-hl font-bold"
                >{{ (rule.pricePerKmCent / 100).toFixed(2) }}元/公里</text
              >
            </view>
          </view>
        </view>
      </view>
    </view>
    <miniapp-login-sheet ref="loginSheet" @success="handleLoginSuccess" />
  </view>
</template>

<script>
import { miniappLoginPageMixin } from '../../utils/miniapp-login-page.js';
import { api, requireLogin } from '../../utils/api.js';
import { yuanToCent } from '../../utils/format.js';

export default {
  mixins: [miniappLoginPageMixin],
  data() {
    return {
      templates: [],
      routeType: 'SMALL_TRUCK',
      newTemplateName: '',
      newItems: [
        { startKm: '0', endKm: '50', priceYuan: '5.00' },
        { startKm: '50', endKm: '100', priceYuan: '4.50' },
        { startKm: '100', endKm: '', priceYuan: '4.00' },
      ],
      submitting: false,
      deletingTemplateId: '',
    };
  },
  onLoad(options = {}) {
    if (options.routeType === 'DRIVING' || options.routeType === 'SMALL_TRUCK') {
      this.routeType = options.routeType;
    }
    if (requireLogin()) this.loadTemplates();
  },
  methods: {
    switchRouteType(routeType) {
      if (this.routeType === routeType) return;
      this.routeType = routeType;
      this.loadTemplates();
    },
    async loadTemplates() {
      try {
        const res = await api.tierTemplates({ routeType: this.routeType });
        this.templates = res.items || [];
      } catch (err) {}
    },
    addTierItem() {
      let start = '0';
      if (this.newItems.length > 0) {
        const last = this.newItems[this.newItems.length - 1];
        if (last.endKm) {
          start = String(Number(last.endKm));
        } else {
          start = '';
        }
      }
      this.newItems.push({ startKm: start, endKm: '', priceYuan: '' });
    },
    removeTierItem(index) {
      if (this.newItems.length === 1) {
        uni.showToast({ title: '至少保留一个阶梯区间', icon: 'none' });
        return;
      }
      this.newItems.splice(index, 1);
      this.syncAdjacentTier(index);
    },
    onTierInput(index, field, value) {
      this.newItems[index][field] = value;
      if (field === 'startKm' && index > 0) {
        this.newItems[index - 1].endKm = value;
      }
      if (field === 'endKm' && index < this.newItems.length - 1) {
        this.newItems[index + 1].startKm = value;
      }
    },
    syncAdjacentTier(index) {
      if (index > 0 && index < this.newItems.length) {
        this.newItems[index - 1].endKm = this.newItems[index].startKm;
      }
      const last = this.newItems[this.newItems.length - 1];
      if (last) last.endKm = '';
    },
    formatRangeText(startKm, endKm) {
      const startText =
        startKm === '' || startKm === null || startKm === undefined ? '起始公里数' : `${startKm}`;
      if (endKm === '' || endKm === null || endKm === undefined) {
        return `大于等于 ${startText} 公里，无上限`;
      }
      return `大于等于 ${startText} 公里，小于 ${endKm} 公里`;
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

      for (let i = 0; i < this.newItems.length; i++) {
        const item = this.newItems[i];
        const start = Number(item.startKm);
        const end = item.endKm === '' ? null : Number(item.endKm);
        const price = Number(item.priceYuan);
        if (item.startKm === '' || Number.isNaN(start) || start < 0) {
          uni.showToast({ title: `第 ${i + 1} 个区间的起始公里无效`, icon: 'none' });
          return false;
        }
        if (!item.priceYuan || Number.isNaN(price) || price <= 0) {
          uni.showToast({ title: `第 ${i + 1} 个区间的单价必须大于 0`, icon: 'none' });
          return false;
        }
        if (i < this.newItems.length - 1 && item.endKm === '') {
          uni.showToast({ title: `第 ${i + 1} 个区间必须设置结束公里`, icon: 'none' });
          return false;
        }
        if (end !== null && (Number.isNaN(end) || end <= start)) {
          uni.showToast({ title: `第 ${i + 1} 个区间的结束公里必须大于起始公里`, icon: 'none' });
          return false;
        }
        if (i > 0 && Number(this.newItems[i - 1].endKm) !== start) {
          uni.showToast({
            title: `第 ${i + 1} 个区间起始公里需等于上一段结束公里`,
            icon: 'none',
          });
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
          routeType: this.routeType,
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
          { startKm: '50', endKm: '100', priceYuan: '4.50' },
          { startKm: '100', endKm: '', priceYuan: '4.00' },
        ];

        this.loadTemplates();
      } catch (err) {
        console.error(err);
      } finally {
        this.submitting = false;
      }
    },
    deleteTemplate(template) {
      if (!template?.id || this.deletingTemplateId) return;
      uni.showModal({
        title: '删除价格模板',
        content: `确定删除“${template.templateName}”吗？已保存在线路中的阶梯价快照不受影响。`,
        confirmText: '删除',
        confirmColor: '#dc2626',
        success: async (res) => {
          if (!res.confirm) return;
          this.deletingTemplateId = template.id;
          try {
            await api.deleteTierTemplate(template.id);
            uni.showToast({ title: '模板已删除', icon: 'success' });
            await this.loadTemplates();
          } catch (err) {
            console.error(err);
          } finally {
            this.deletingTemplateId = '';
          }
        },
      });
    },
  },
};
</script>

<style>
.tier-template-page {
  padding: 28rpx;
  padding-bottom: calc(150rpx + env(safe-area-inset-bottom));
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

.add-tier-btn {
  height: 52rpx;
  line-height: 52rpx;
  margin: 0;
  padding: 0 18rpx;
  border-radius: 8rpx;
  border: 1rpx solid #bfdbfe;
  background: #eff6ff;
  color: #1677ff;
  font-size: 24rpx;
  font-weight: 700;
}

.add-tier-btn::after {
  border: 0;
}

.tier-rule-row {
  padding: 22rpx;
  margin-bottom: 16rpx;
  background: #fbfdff;
  border: 1rpx solid #dbe6f3;
  border-radius: 12rpx;
}

.tier-rule-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.tier-rule-title {
  font-size: 24rpx;
  color: #475569;
  font-weight: 700;
}

.tier-delete-btn {
  flex: 0 0 auto;
  height: 48rpx;
  line-height: 48rpx;
  min-width: 88rpx;
  margin: 0;
  padding: 0 18rpx;
  border-radius: 8rpx;
  border: 1rpx solid #fecaca;
  background: #fff;
  color: #dc2626;
  font-size: 22rpx;
}

.tier-delete-btn::after {
  border: 0;
}

.tier-range-line {
  display: flex;
  align-items: center;
  gap: 10rpx;
  min-width: 0;
}

.tier-input-box {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  height: 72rpx;
  background: #fff;
  border: 1rpx solid #dde5ef;
  border-radius: 8rpx;
  padding: 0 14rpx;
}

.tier-prefix.wide {
  flex: 0 0 auto;
  min-width: 56rpx;
  font-size: 22rpx;
  color: #475569;
  font-weight: 600;
}

.tier-connector {
  flex: 0 0 auto;
  color: #64748b;
  font-size: 24rpx;
}

.tier-unit {
  flex: 0 0 auto;
  color: #94a3b8;
  font-size: 21rpx;
  margin-left: 6rpx;
}

.tier-input {
  flex: 1;
  min-width: 0;
  height: 70rpx;
  padding: 0 !important;
  background: transparent !important;
  border: 0 !important;
  font-size: 26rpx;
}

.tier-price-line {
  display: flex;
  align-items: center;
  height: 74rpx;
  margin-top: 12rpx;
  padding: 0 16rpx;
  background: #fff;
  border: 1rpx solid #dde5ef;
  border-radius: 8rpx;
}

.tier-price-label {
  flex: 0 0 auto;
  min-width: 72rpx;
  color: #64748b;
  font-size: 24rpx;
  font-weight: 600;
}

.price-input-mini {
  flex: 1;
  min-width: 0;
  height: 70rpx;
  padding: 0 !important;
  background: transparent !important;
  border: 0 !important;
  font-size: 26rpx;
}

.unit-txt {
  flex: 0 0 auto;
  font-size: 24rpx;
  color: #64748b;
  padding-left: 12rpx;
}

.tier-rule-hint {
  margin-top: 12rpx;
  padding: 12rpx 14rpx;
  font-size: 23rpx;
  color: #64748b;
  background: #f1f7ff;
  border-radius: 8rpx;
  line-height: 1.4;
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
  margin-bottom: 8rpx;
}

.template-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 14rpx;
}

.template-type {
  font-size: 23rpx;
  color: #64748b;
}

.delete-template-btn {
  flex: 0 0 auto;
  min-width: 96rpx;
  height: 56rpx;
  line-height: 56rpx;
  margin: 0;
  padding: 0 18rpx;
  border-radius: 8rpx;
  border: 1rpx solid #fecaca;
  background: #fff;
  color: #dc2626;
  font-size: 24rpx;
}

.delete-template-btn::after {
  border: 0;
}

.template-rules-summary {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  padding: 16rpx;
  background: #f8fbff;
  border: 1rpx solid #e5edf7;
  border-radius: 8rpx;
}

.rule-summary-row {
  font-size: 24rpx;
  color: #4b5563;
  line-height: 1.45;
}

.price-hl {
  color: #1677ff;
}

.template-form-footer {
  position: sticky;
  bottom: calc(20rpx + env(safe-area-inset-bottom));
  z-index: 5;
  margin-top: 24rpx;
  padding-top: 10rpx;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0), #fff 22rpx);
}
</style>
