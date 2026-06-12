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
        <view class="input" style="line-height: 88rpx; background-color: #e2e8f0; color: #475569">
          {{ routeType === 'LARGE_TRUCK' ? '大板线路' : '小板线路' }}
        </view>
      </view>

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

    <!-- Small Truck Price -->
    <view class="section" v-if="routeType === 'SMALL_TRUCK'">
      <view class="section-title">小板起步及公里阶梯报价</view>

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
          mode="selector"
          :range="templates"
          range-key="templateName"
          @change="onTemplateChange"
        >
          <view class="picker-display">
            <text>{{ selectedTemplateName || '点击选择公里阶梯价模板' }}</text>
          </view>
        </picker>
        <view class="template-link subtle" @click="goTemplatePage">
          <image class="template-link-icon" src="/static/icons/receipt.svg" mode="aspectFit" />
          <text>管理我的阶梯价模板</text>
          <image class="arrow-icon" src="/static/icons/arrow-right.svg" mode="aspectFit" />
        </view>
      </view>
    </view>

    <!-- Fixed Footer -->
    <view class="fixed-footer">
      <button class="primary-btn animate-btn" :loading="submitting" @click="submit">
        保存线路配置
      </button>
    </view>
  </view>
</template>

<script>
import { api, requireLogin } from '../../utils/api.js';
import { yuanToCent, yuanText } from '../../utils/format.js';
import RegionSelectField from '../../components/region-select-field/region-select-field.vue';

export default {
  components: {
    RegionSelectField,
  },
  data() {
    return {
      routeId: '',
      routeType: 'LARGE_TRUCK',
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

      // Templates array
      templates: [],
      selectedTemplateName: '',
      verification: { serviceCapabilities: [] },
      submitting: false,
    };
  },
  onLoad(options) {
    if (!requireLogin()) return;
    this.routeType = options.type || 'LARGE_TRUCK';
    this.form.routeType = this.routeType;
    if (options.routeId) {
      this.routeId = options.routeId;
      this.loadDetail();
    }
  },
  onShow() {
    this.loadVerificationStatus();
    if (this.routeType === 'SMALL_TRUCK') {
      this.loadTemplates();
    }
  },
  methods: {
    async loadVerificationStatus() {
      try {
        this.verification = await api.verificationStatus();
        const caps = this.verification.serviceCapabilities || [];
        if (caps.length && !caps.includes(this.routeType)) {
          uni.showModal({
            title: '线路类型不可用',
            content:
              '当前公司类型不支持该线路类型。轿运公司支持大板和小板线路，道路救援公司仅支持小板线路。',
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
          if (route.fixedPriceCent) {
            this.fixedPriceYuan = (route.fixedPriceCent / 100).toFixed(2);
          }
          if (route.startPriceCent) {
            this.startPriceYuan = (route.startPriceCent / 100).toFixed(2);
          }

          // Match template name after templates are loaded
          this.matchTemplateName();
        }
      } catch (err) {
        console.error(err);
      }
    },
    async loadTemplates() {
      try {
        const res = await api.tierTemplates();
        this.templates = res.items || [];
        this.matchTemplateName();
      } catch (err) {}
    },
    matchTemplateName() {
      if (this.form.tierTemplateId && this.templates.length) {
        const t = this.templates.find((x) => String(x.id) === String(this.form.tierTemplateId));
        if (t) {
          this.selectedTemplateName = t.templateName;
        }
      }
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
      const idx = e.detail.value;
      const t = this.templates[idx];
      this.form.tierTemplateId = t.id;
      this.selectedTemplateName = t.templateName;
    },
    setStatus(status) {
      this.form.status = status;
    },
    goTemplatePage() {
      uni.navigateTo({ url: '/pages/route/tier-template' });
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
      } else {
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

        // Find snapshot if tierTemplateId is set
        if (this.routeType === 'SMALL_TRUCK' && this.form.tierTemplateId) {
          const t = this.templates.find((x) => String(x.id) === String(this.form.tierTemplateId));
          if (t) {
            payload.tierSnapshot = t.items || [];
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
</style>
