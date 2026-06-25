<template>
  <view class="page transit-location-page">
    <view class="form-header">
      <view class="form-header-title">上报在途运输位置</view>
      <view class="form-header-desc"
        >请上传托运车辆当前的地理位置，车商客户可实时查看最新轨迹。</view
      >
    </view>

    <view class="section">
      <view class="section-title">定位信息</view>

      <region-select-field
        label="当前省市"
        required
        title="选择当前省市"
        placeholder="选择当前运输省份与城市"
        :province-name="provinceName"
        :city-name="cityName"
        @select="onRegionSelect"
      />

      <view class="field transit-address-field">
        <view class="field-label-row">
          <text class="label">详细在途位置/路段</text>
          <text class="optional-tag">选填</text>
        </view>
        <view
          class="picker-display transit-address-display"
          :class="{ disabled: !cityId, selected: addressDetail }"
          @click="openAddressPicker"
        >
          <view class="address-icon-wrap">
            <image class="address-icon" src="/static/icons/map-pin.svg" mode="aspectFit" />
          </view>
          <view v-if="addressDetail" class="address-summary">
            <text class="address-summary-name">{{ addressName || addressDetail }}</text>
            <text
              v-if="addressDetail && addressDetail !== addressName"
              class="address-summary-detail"
            >
              {{ addressDetail }}
            </text>
          </view>
          <view v-else class="address-placeholder-wrap">
            <text class="address-placeholder">
              {{ cityId ? '可在地图上搜索或选择当前位置' : '请先选择当前省市' }}
            </text>
            <text class="address-placeholder-tip">
              未选择时将使用{{ cityName || '当前城市' }}中心点上报
            </text>
          </view>
          <text class="picker-chevron">⌄</text>
        </view>
      </view>

      <view class="field">
        <text class="label">备注说明</text>
        <textarea
          class="textarea"
          v-model="remark"
          placeholder="可在此备注当前天气、交通堵塞等特殊在途情况"
          placeholder-style="color:#9ca3af"
        />
      </view>
      <!-- #ifdef H5 -->
      <button class="secondary-btn dev-location-btn" @click="useDevTransitLocation">
        使用测试在途位置
      </button>
      <!-- #endif -->
    </view>

    <address-map-picker
      ref="addressMapPicker"
      title="选择详细在途位置"
      placeholder="搜索高速路段、服务区、分拨点"
      @select="onAddressSelect"
    />

    <!-- Fixed Footer -->
    <view class="fixed-footer">
      <button class="primary-btn animate-btn" :loading="submitting" @click="submit">
        上报当前最新位置
      </button>
    </view>
    <miniapp-login-sheet ref="loginSheet" @success="handleLoginSuccess" />
  </view>
</template>

<script>
import { miniappLoginPageMixin } from '../../utils/miniapp-login-page.js';
import { api, requireLogin } from '../../utils/api.js';
import AddressMapPicker from '../../components/address-map-picker/address-map-picker.vue';
import RegionSelectField from '../../components/region-select-field/region-select-field.vue';

export default {
  mixins: [miniappLoginPageMixin],
  components: {
    AddressMapPicker,
    RegionSelectField,
  },
  data() {
    return {
      orderId: '',
      provinceId: '',
      provinceName: '',
      cityId: '',
      cityName: '',
      addressName: '',
      addressDetail: '',
      latitude: '',
      longitude: '',
      cityLatitude: '',
      cityLongitude: '',
      remark: '',
      submitting: false,
    };
  },
  onLoad(options) {
    if (!requireLogin()) return;
    this.orderId = options.orderId;
  },
  methods: {
    onRegionSelect(region) {
      const cityChanged = String(this.cityId) !== String(region.cityId);
      this.provinceId = region.provinceId;
      this.provinceName = region.provinceName;
      this.cityId = region.cityId;
      this.cityName = region.cityName;
      this.cityLongitude = region.cityLongitude || '';
      this.cityLatitude = region.cityLatitude || '';
      if (cityChanged) {
        this.addressName = '';
        this.addressDetail = '';
        this.latitude = '';
        this.longitude = '';
      }
    },
    openAddressPicker() {
      if (!this.cityId) {
        uni.showToast({ title: '请先选择当前运输省市', icon: 'none' });
        return;
      }
      this.$refs.addressMapPicker.open({
        name: this.addressName || '',
        address: this.addressDetail || '',
        provinceName: this.provinceName || '',
        cityName: this.cityName || '',
        lng: this.longitude || '',
        lat: this.latitude || '',
      });
    },
    onAddressSelect(address) {
      this.addressName = address.name || '';
      this.addressDetail = address.address || address.name || '';
      this.longitude = address.lng || '';
      this.latitude = address.lat || '';
    },
    useDevTransitLocation() {
      this.provinceId = '310000';
      this.provinceName = '上海市';
      this.cityId = '310100';
      this.cityName = '上海市';
      this.cityLongitude = '121.433300';
      this.cityLatitude = '31.246707';
      this.addressName = 'G2高速上海方向服务区';
      this.addressDetail = 'G2高速上海方向服务区，距离目的地约35公里';
      this.latitude = '31.246707';
      this.longitude = '121.433300';
      this.remark = '页面测试在途上报，预计今日到达';
    },
    validate() {
      if (!this.provinceName || !this.cityName) {
        uni.showToast({ title: '请选择当前运输省市', icon: 'none' });
        return false;
      }
      if ((!this.latitude || !this.longitude) && (!this.cityLatitude || !this.cityLongitude)) {
        uni.showToast({ title: '当前城市暂无坐标，请选择详细位置', icon: 'none' });
        return false;
      }
      return true;
    },
    async submit() {
      if (!this.validate()) return;
      this.submitting = true;
      try {
        const payload = {
          provinceId: this.provinceId,
          provinceName: this.provinceName,
          cityId: this.cityId,
          cityName: this.cityName,
          addressDetail: this.addressDetail || this.cityName,
          latitude: Number(this.latitude || this.cityLatitude),
          longitude: Number(this.longitude || this.cityLongitude),
          remark: this.remark,
        };
        await api.reportTransitLocation(this.orderId, payload);
        uni.showToast({ title: '位置上报成功', icon: 'success' });
        setTimeout(() => {
          uni.redirectTo({ url: `/pages/order/detail?orderId=${this.orderId}` });
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
.transit-location-page {
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

.transit-address-field {
  margin-top: 26rpx;
}

.field-label-row {
  display: flex;
  align-items: center;
  gap: 6rpx;
  margin-bottom: 14rpx;
}

.optional-tag {
  padding: 2rpx 10rpx;
  border-radius: 999rpx;
  background: #eef6ff;
  color: #1677ff;
  font-size: 20rpx;
  font-weight: 700;
  line-height: 1.4;
}

.transit-address-display {
  min-height: 104rpx;
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 20rpx 18rpx;
  border-radius: 14rpx;
  border: 1rpx solid #dbeafe;
  background: #f8fbff;
  box-sizing: border-box;
}

.transit-address-display.disabled {
  border-color: #e5e7eb;
  background: #f9fafb;
}

.transit-address-display.selected {
  border-color: #93c5fd;
  background: #ffffff;
  box-shadow: 0 8rpx 22rpx rgba(22, 119, 255, 0.08);
}

.transit-address-display::after {
  display: none;
}

.address-icon-wrap {
  flex-shrink: 0;
  width: 54rpx;
  height: 54rpx;
  border-radius: 16rpx;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.transit-address-display.disabled .address-icon-wrap {
  background: #f1f5f9;
}

.address-icon {
  width: 30rpx;
  height: 30rpx;
}

.address-summary {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  flex: 1;
  min-width: 0;
}

.address-summary-name {
  color: #111827;
  font-size: 27rpx;
  font-weight: 700;
  line-height: 1.35;
}

.address-summary-detail {
  color: #6b7280;
  font-size: 23rpx;
  line-height: 1.45;
}

.address-placeholder-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.address-placeholder {
  color: #94a3b8;
  font-size: 26rpx;
  font-weight: 600;
  line-height: 1.35;
}

.address-placeholder-tip {
  color: #cbd5e1;
  font-size: 21rpx;
  line-height: 1.3;
}

.transit-address-display.disabled .address-placeholder,
.transit-address-display.disabled .address-placeholder-tip {
  color: #cbd5e1;
}

.picker-chevron {
  flex-shrink: 0;
  color: #94a3b8;
  font-size: 34rpx;
  line-height: 1;
}

.transit-address-display.selected .picker-chevron {
  color: #1677ff;
}

.dev-location-btn {
  margin-top: 20rpx;
  width: 100%;
}
</style>
