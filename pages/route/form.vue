<template>
  <view class="page route-form-page">
    <view class="form-header">
      <view class="form-header-title">{{ routeId ? '修改线路报价' : '添加承运线路' }}</view>
      <view class="form-header-desc">请准确填写线路的起止省市，报价和时效可按需填写。</view>
    </view>

    <!-- Basic Route Info -->
    <view class="section">
      <view class="section-title">托运路线</view>

      <view class="field">
        <text class="label">线路类型</text>
        <view v-if="routeId" class="readonly-type-field">
          {{ routeTypeLabel }}
        </view>
        <view v-else class="grid-three route-type-grid">
          <view
            v-for="item in availableRouteTypeOptions"
            :key="item.value"
            class="check-row route-type-option"
            :class="{ checked: routeType === item.value }"
            @click="switchRouteType(item.value)"
          >
            <text class="radio-icon-box">{{ routeType === item.value ? '●' : '' }}</text>
            <text>{{ item.label }}</text>
          </view>
        </view>
      </view>

      <view v-if="routeId" class="readonly-route-grid">
        <view class="field">
          <text class="label">出发城市</text>
          <view class="readonly-route-field">{{ originCityText }}</view>
        </view>
        <view class="field">
          <text class="label">目的城市</text>
          <view class="readonly-route-field">{{ destinationCityText }}</view>
        </view>
      </view>

      <template v-else>
        <region-select-field
          label="出发城市"
          required
          title="选择出发省市"
          placeholder="选择出发省份与城市"
          :province-name="form.originProvinceName"
          :city-name="form.originCityName"
          @select="onOriginRegionSelect"
        />

        <region-select-field
          label="目的城市"
          required
          title="选择目的省市"
          placeholder="选择目的省份与城市"
          :province-name="form.destinationProvinceName"
          :city-name="form.destinationCityName"
          @select="onDestinationRegionSelect"
        />
      </template>

      <view class="field">
        <text class="label">预计运输时效 (选填)</text>
        <input
          class="input"
          v-model="form.durationText"
          placeholder="例如: 2-3天 / 当天送达"
          placeholder-style="color:#9ca3af"
        />
      </view>

      <view class="field" v-if="routeId">
        <text class="label">展示状态 <text class="required">*</text></text>
        <view class="grid-two">
          <view
            class="check-row"
            :class="{ checked: form.status === 'ACTIVE' }"
            @click="setStatus('ACTIVE')"
          >
            <text class="radio-icon-box">{{ form.status === 'ACTIVE' ? '●' : '' }}</text>
            <text>开启展示中</text>
          </view>
          <view
            class="check-row"
            :class="{ checked: form.status === 'CLOSED' }"
            @click="setStatus('CLOSED')"
          >
            <text class="radio-icon-box">{{ form.status === 'CLOSED' ? '●' : '' }}</text>
            <text>暂时关闭</text>
          </view>
        </view>
      </view>
    </view>

    <!-- Large Truck Price -->
    <view class="section" v-if="routeType === 'LARGE_TRUCK'">
      <view class="section-title">大板报价配置</view>
      <view class="field">
        <text class="label">固定参考报价 (元) (选填，空表示电话沟通)</text>
        <input
          class="input"
          v-model="fixedPriceYuan"
          type="digit"
          placeholder="请输入该线路每台车固定参考运费"
          placeholder-style="color:#9ca3af"
        />
      </view>
    </view>

    <!-- Tier Price -->
    <view class="section" v-if="usesTierPrice">
      <view class="section-title">{{ routeType === 'DRIVING' ? '代驾起步及公里阶梯报价' : '小板起步及公里阶梯报价' }}</view>

      <view class="field">
        <text class="label">起步参考价 (元) (选填，空表示电话沟通)</text>
        <input
          class="input"
          v-model="startPriceYuan"
          type="digit"
          placeholder="例如: 350"
          placeholder-style="color:#9ca3af"
        />
      </view>

      <view class="field">
        <text class="label">起步包含公里数 (公里) (选填)</text>
        <input
          class="input"
          v-model="form.startKm"
          type="number"
          placeholder="例如: 10"
          placeholder-style="color:#9ca3af"
        />
      </view>

      <view class="field">
        <text class="label">超出起步后的公里阶梯价模板</text>
        <picker
          v-if="templates.length"
          mode="selector"
          :range="templates"
          range-key="templateName"
          @change="onTemplateChange"
        >
          <view class="picker-display">
            <text>{{ tierTemplateDisplayText }}</text>
          </view>
        </picker>
        <view v-else class="picker-display" @click="showEmptyTemplateTip">
          <text>{{ tierTemplateDisplayText }}</text>
        </view>
        <view class="snapshot-notice" v-if="routeId && hasExternalTierSnapshot">
          当前线路使用平台配置的阶梯价，规则以保存在线路中的快照为准；重新选择我的模板后会覆盖当前快照。
        </view>
        <view class="tier-snapshot-card" v-if="effectiveTierRules.length">
          <view class="tier-snapshot-title">当前生效阶梯规则</view>
          <view class="tier-rule-line" v-for="(rule, index) in effectiveTierRules" :key="index">
            <text class="tier-rule-range">{{ formatTierRange(rule) }}</text>
            <text class="tier-rule-price">{{ formatTierPrice(rule.pricePerKmCent) }}</text>
          </view>
        </view>
        <view class="template-link subtle" @click="goTemplatePage">
          <image class="template-link-icon" src="/static/icons/receipt.svg" mode="aspectFit" />
          <text>管理我的阶梯价模板</text>
          <image class="arrow-icon" src="/static/icons/arrow-right.svg" mode="aspectFit" />
        </view>
      </view>
    </view>

    <!-- Fixed Footer -->
    <view class="fixed-footer route-form-footer">
      <button
        v-if="routeId"
        class="danger-outline-btn animate-btn"
        :disabled="submitting || deleting"
        :loading="deleting"
        @click="deleteRoute"
      >
        删除该线路
      </button>
      <button class="primary-btn animate-btn" :loading="submitting" @click="submit">
        保存线路配置
      </button>
    </view>
    <miniapp-login-sheet ref="loginSheet" @success="handleLoginSuccess" />
  </view>
</template>

<script>
import { miniappLoginPageMixin } from '../../utils/miniapp-login-page.js';
import { api, requireLogin } from '../../utils/api.js';
import { yuanToCent, yuanText } from '../../utils/format.js';
import RegionSelectField from '../../components/region-select-field/region-select-field.vue';

export default {
  mixins: [miniappLoginPageMixin],
  components: {
    RegionSelectField,
  },
  data() {
    return {
      routeId: '',
      routeType: 'LARGE_TRUCK',
      initialRouteType: 'LARGE_TRUCK',
      fixedPriceYuan: '',
      startPriceYuan: '',

      form: {
        routeType: 'LARGE_TRUCK',
        originProvinceId: '',
        originProvinceName: '',
        originCityId: '',
        originCityName: '',
        destinationProvinceId: '',
        destinationProvinceName: '',
        destinationCityId: '',
        destinationCityName: '',

        fixedPriceCent: null,
        startPriceCent: null,
        startKm: null,
        tierTemplateId: '',
        durationText: '',
        status: 'ACTIVE',
      },
      currentTierSnapshot: [],
      currentTierSnapshotTemplateName: '',

      // Templates array
      templates: [],
      selectedTemplateName: '',
      verification: { serviceCapabilities: [] },
      submitting: false,
      deleting: false,
    };
  },
  computed: {
    usesTierPrice() {
      return this.routeType === 'SMALL_TRUCK' || this.routeType === 'DRIVING';
    },
    routeTypeLabel() {
      const map = { LARGE_TRUCK: '大板线路', SMALL_TRUCK: '小板线路', DRIVING: '代驾线路' };
      return map[this.routeType] || '承运线路';
    },
    routeTypeOptions() {
      return [
        { label: '大板线路', value: 'LARGE_TRUCK' },
        { label: '小板线路', value: 'SMALL_TRUCK' },
        { label: '代驾线路', value: 'DRIVING' },
      ];
    },
    availableRouteTypeOptions() {
      const caps = this.verification.serviceCapabilities || [];
      const options = caps.length
        ? this.routeTypeOptions.filter((item) => caps.includes(item.value))
        : this.routeTypeOptions;
      return options.length ? options : this.routeTypeOptions;
    },
    originCityText() {
      return this.form.originProvinceName && this.form.originCityName
        ? `${this.form.originProvinceName} · ${this.form.originCityName}`
        : '未配置';
    },
    destinationCityText() {
      return this.form.destinationProvinceName && this.form.destinationCityName
        ? `${this.form.destinationProvinceName} · ${this.form.destinationCityName}`
        : '未配置';
    },
    effectiveTierRules() {
      const selected = this.templates.find(
        (item) => String(item.id) === String(this.form.tierTemplateId),
      );
      if (selected?.items?.length) return selected.items;
      return Array.isArray(this.currentTierSnapshot) ? this.currentTierSnapshot : [];
    },
    hasExternalTierSnapshot() {
      return (
        this.usesTierPrice &&
        this.form.tierTemplateId &&
        !this.selectedTemplateName &&
        this.currentTierSnapshot.length > 0
      );
    },
    tierTemplateDisplayText() {
      if (this.selectedTemplateName) return this.selectedTemplateName;
      if (this.hasExternalTierSnapshot) {
        return this.currentTierSnapshotTemplateName || '平台配置的阶梯价快照';
      }
      return '点击选择公里阶梯价模板';
    },
  },
  onLoad(options) {
    if (!requireLogin()) return;
    this.initialRouteType = options.type || 'LARGE_TRUCK';
    this.routeType = this.initialRouteType;
    this.form.routeType = this.routeType;
    if (options.routeId) {
      this.routeId = options.routeId;
      this.loadDetail();
    }
  },
  onShow() {
    this.loadVerificationStatus();
    if (this.usesTierPrice) {
      this.loadTemplates();
    }
  },
  methods: {
    async loadVerificationStatus() {
      try {
        this.verification = await api.verificationStatus();
        const caps = this.verification.serviceCapabilities || [];
        if (!this.routeId && caps.length && !caps.includes(this.routeType)) {
          const fallbackType = this.availableRouteTypeOptions[0]?.value;
          if (fallbackType) {
            this.switchRouteType(fallbackType, { silent: true });
            uni.showToast({ title: '已切换到可添加的线路类型', icon: 'none' });
            return;
          }
        }
        if (this.routeId && caps.length && !caps.includes(this.routeType)) {
          uni.showModal({
            title: '线路类型不可用',
            content:
              '当前认证资料不支持该线路类型，请先调整服务能力并通过审核。',
            showCancel: false,
            confirmText: '返回',
            success: () => {
              uni.navigateBack();
            },
          });
        }
      } catch (err) {}
    },
    async loadDetail() {
      try {
        const listRes = await api.routes();
        const route = (listRes.items || []).find((r) => String(r.id) === String(this.routeId));
        if (route) {
          this.routeType = route.routeType;
          this.form = {
            routeType: route.routeType,
            originProvinceId: route.originProvinceId,
            originProvinceName: route.originProvinceName,
            originCityId: route.originCityId,
            originCityName: route.originCityName,
            destinationProvinceId: route.destinationProvinceId,
            destinationProvinceName: route.destinationProvinceName,
            destinationCityId: route.destinationCityId,
            destinationCityName: route.destinationCityName,
            fixedPriceCent: route.fixedPriceCent,
            startPriceCent: route.startPriceCent,
            startKm: route.startKm,
            tierTemplateId: route.tierTemplateId || '',
            durationText: route.durationText || '',
            status: route.routeStatus || 'ACTIVE',
          };
          this.setCurrentTierSnapshot(route.tierSnapshot);
          if (route.fixedPriceCent) {
            this.fixedPriceYuan = (route.fixedPriceCent / 100).toFixed(2);
          }
          if (route.startPriceCent) {
            this.startPriceYuan = (route.startPriceCent / 100).toFixed(2);
          }

          if (this.usesTierPrice) {
            await this.loadTemplates();
          } else {
            this.matchTemplateName();
          }
        }
      } catch (err) {
        console.error(err);
      }
    },
    async loadTemplates() {
      try {
        const res = await api.tierTemplates({ routeType: this.routeType });
        this.templates = res.items || [];
        this.matchTemplateName();
      } catch (err) {}
    },
    switchRouteType(routeType, options = {}) {
      if (this.routeId || this.routeType === routeType) return;
      const caps = this.verification.serviceCapabilities || [];
      if (caps.length && !caps.includes(routeType)) {
        if (!options.silent) {
          uni.showToast({ title: '当前认证资料不支持该线路类型', icon: 'none' });
        }
        return;
      }
      this.routeType = routeType;
      this.form.routeType = routeType;
      this.fixedPriceYuan = '';
      this.startPriceYuan = '';
      this.form.fixedPriceCent = null;
      this.form.startPriceCent = null;
      this.form.startKm = null;
      this.form.tierTemplateId = '';
      this.selectedTemplateName = '';
      this.currentTierSnapshot = [];
      this.currentTierSnapshotTemplateName = '';
      this.templates = [];
      if (this.usesTierPrice) {
        this.loadTemplates();
      }
    },
    matchTemplateName() {
      this.selectedTemplateName = '';
      if (this.form.tierTemplateId && this.templates.length) {
        const t = this.templates.find((x) => String(x.id) === String(this.form.tierTemplateId));
        if (t) {
          this.selectedTemplateName = t.templateName;
        }
      }
    },
    setCurrentTierSnapshot(snapshot) {
      if (Array.isArray(snapshot)) {
        this.currentTierSnapshot = snapshot;
        this.currentTierSnapshotTemplateName = '';
        return;
      }
      if (snapshot && typeof snapshot === 'object') {
        this.currentTierSnapshot = Array.isArray(snapshot.items) ? snapshot.items : [];
        this.currentTierSnapshotTemplateName = snapshot.templateName || '';
        return;
      }
      this.currentTierSnapshot = [];
      this.currentTierSnapshotTemplateName = '';
    },
    onOriginRegionSelect(region) {
      this.form.originProvinceId = region.provinceId;
      this.form.originProvinceName = region.provinceName;
      this.form.originCityId = region.cityId;
      this.form.originCityName = region.cityName;
    },
    onDestinationRegionSelect(region) {
      this.form.destinationProvinceId = region.provinceId;
      this.form.destinationProvinceName = region.provinceName;
      this.form.destinationCityId = region.cityId;
      this.form.destinationCityName = region.cityName;
    },
    onTemplateChange(e) {
      const idx = Number(e.detail.value);
      const t = this.templates[idx];
      if (!t) {
        this.showEmptyTemplateTip();
        return;
      }
      this.form.tierTemplateId = t.id;
      this.selectedTemplateName = t.templateName;
      this.currentTierSnapshot = t.items || [];
      this.currentTierSnapshotTemplateName = t.templateName || '';
    },
    showEmptyTemplateTip() {
      uni.showToast({ title: '当前暂无可用阶梯模板，请先创建模板后再选择', icon: 'none' });
    },
    formatTierRange(rule) {
      const startKm =
        rule.startKm === undefined || rule.startKm === null || rule.startKm === ''
          ? '起始公里数'
          : rule.startKm;
      if (rule.endKm === undefined || rule.endKm === null || rule.endKm === '') {
        return `大于等于 ${startKm} 公里，无上限`;
      }
      return `大于等于 ${startKm} 公里，小于 ${rule.endKm} 公里`;
    },
    formatTierPrice(pricePerKmCent) {
      const cent = Number(pricePerKmCent || 0);
      return `${(cent / 100).toFixed(2)} 元/KM`;
    },
    setStatus(status) {
      this.form.status = status;
    },
    goTemplatePage() {
      uni.navigateTo({ url: `/pages/route/tier-template?routeType=${this.routeType}` });
    },
    validate() {
      const caps = this.verification.serviceCapabilities || [];
      if (caps.length && !caps.includes(this.routeType)) {
        uni.showToast({ title: '当前公司类型不支持该线路类型', icon: 'none' });
        return false;
      }
      if (!this.form.originCityId) {
        uni.showToast({ title: '请选择出发城市', icon: 'none' });
        return false;
      }
      if (!this.form.destinationCityId) {
        uni.showToast({ title: '请选择目的城市', icon: 'none' });
        return false;
      }
      // Conversions
      if (this.routeType === 'LARGE_TRUCK') {
        this.form.fixedPriceCent = this.fixedPriceYuan ? yuanToCent(this.fixedPriceYuan) : null;
        this.form.startPriceCent = null;
        this.form.startKm = null;
        this.form.tierTemplateId = '';
        this.currentTierSnapshot = [];
        this.currentTierSnapshotTemplateName = '';
      } else {
        this.form.fixedPriceCent = null;
        this.form.startPriceCent = this.startPriceYuan ? yuanToCent(this.startPriceYuan) : null;
        this.form.startKm = this.form.startKm ? Number(this.form.startKm) : null;
      }

      return true;
    },
    async submit() {
      if (!this.validate()) return;
      this.submitting = true;
      try {
        const payload = {
          ...this.form,
          routeStatus: this.form.status,
          tierTemplateId: this.form.tierTemplateId || null,
        };
        delete payload.status;

        payload.tierSnapshot = null;
        if (this.usesTierPrice) {
          const t = this.templates.find((x) => String(x.id) === String(this.form.tierTemplateId));
          if (t) {
            payload.tierSnapshot = this.buildTierSnapshot(t);
          } else if (this.currentTierSnapshot.length) {
            payload.tierSnapshot = this.buildTierSnapshot({
              id: this.form.tierTemplateId || null,
              templateName: this.currentTierSnapshotTemplateName || '',
              items: this.currentTierSnapshot,
            });
          }
        }

        if (this.routeId) {
          await api.updateRoute(this.routeId, payload);
          uni.showToast({ title: '修改线路成功', icon: 'success' });
        } else {
          await api.createRoute(payload);
          uni.showToast({ title: '添加线路成功', icon: 'success' });
        }
        setTimeout(() => {
          uni.navigateBack();
        }, 800);
      } catch (err) {
        console.error(err);
      } finally {
        this.submitting = false;
      }
    },
    deleteRoute() {
      if (!this.routeId || this.deleting) return;
      uni.showModal({
        title: '删除线路确认',
        content:
          '删除后该线路将不再在承运商端展示，也不会参与车商搜索。历史订单不受影响。',
        confirmText: '删除',
        confirmColor: '#dc2626',
        success: async (res) => {
          if (!res.confirm) return;
          this.deleting = true;
          try {
            await api.closeRoute(this.routeId, { closedReason: '承运商删除线路' });
            uni.showToast({ title: '线路已删除', icon: 'success' });
            setTimeout(() => {
              uni.navigateBack();
            }, 800);
          } catch (err) {
            console.error(err);
          } finally {
            this.deleting = false;
          }
        },
      });
    },
    buildTierSnapshot(template) {
      if (!template) return null;
      return {
        templateId: template.id || null,
        templateName: template.templateName || '',
        items: (template.items || []).map((item, index) => ({
          startKm: Number(item.startKm),
          endKm:
            item.endKm === null || item.endKm === undefined || item.endKm === ''
              ? null
              : Number(item.endKm),
          pricePerKmCent: Number(item.pricePerKmCent || 0),
          sortOrder: item.sortOrder === undefined ? index : Number(item.sortOrder),
        })),
      };
    },
  },
};
</script>

<style>
.route-form-page {
  padding: 30rpx 30rpx calc(150rpx + env(safe-area-inset-bottom));
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

.radio-icon-box {
  width: 32rpx;
  height: 32rpx;
  border: 2rpx solid #d1d5db;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16rpx;
  color: transparent;
}

.checked .radio-icon-box {
  border-color: #1677ff;
  color: #1677ff;
}

.grid-three {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14rpx;
}

.route-type-grid {
  width: 100%;
}

.route-type-option {
  min-height: 78rpx;
  justify-content: center;
  padding: 14rpx 10rpx;
  font-size: 24rpx;
  white-space: nowrap;
}

.readonly-type-field {
  min-height: 88rpx;
  padding: 0 28rpx;
  border-radius: 12rpx;
  background-color: #eef2f7;
  color: #475569;
  font-size: 28rpx;
  line-height: 88rpx;
}

.template-link {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 16rpx;
  color: #1677ff;
  font-weight: 700;
}

.template-link-icon {
  width: 30rpx;
  height: 30rpx;
}

.snapshot-notice {
  margin-top: 14rpx;
  padding: 16rpx 18rpx;
  border-radius: 10rpx;
  background: #eff6ff;
  color: #475569;
  font-size: 23rpx;
  line-height: 1.45;
}

.tier-snapshot-card {
  margin-top: 16rpx;
  padding: 18rpx;
  border: 1rpx solid #dbeafe;
  border-radius: 12rpx;
  background: #f8fbff;
}

.tier-snapshot-title {
  margin-bottom: 12rpx;
  color: #334155;
  font-size: 24rpx;
  font-weight: 800;
}

.tier-rule-line {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
  padding: 12rpx 0;
  border-top: 1rpx solid #e5edf7;
}

.tier-rule-line:first-of-type {
  border-top: 0;
}

.tier-rule-range {
  flex: 1;
  min-width: 0;
  color: #64748b;
  font-size: 23rpx;
  line-height: 1.4;
}

.tier-rule-price {
  flex: 0 0 auto;
  color: #1677ff;
  font-size: 24rpx;
  font-weight: 800;
  line-height: 1.4;
}

.readonly-route-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6rpx;
}

.readonly-route-field {
  min-height: 88rpx;
  padding: 0 28rpx;
  border-radius: 12rpx;
  background-color: #eef2f7;
  color: #475569;
  font-size: 28rpx;
  line-height: 88rpx;
}

.route-form-footer {
  display: flex;
  gap: 16rpx;
}

.route-form-footer .primary-btn,
.route-form-footer .danger-outline-btn {
  flex: 1;
}

.danger-outline-btn {
  height: 88rpx;
  border: 2rpx solid #fecaca;
  border-radius: 14rpx;
  background-color: #fff;
  color: #dc2626;
  font-size: 28rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}

.danger-outline-btn::after {
  border: 0;
}
</style>
