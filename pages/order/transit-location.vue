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

      <view class="field">
        <text class="label">详细在途位置/路段 <text class="required">*</text></text>
        <view
          class="picker-display transit-address-display"
          :class="{ disabled: !cityId }"
          @click="openAddressPicker"
        >
          <view v-if="addressDetail" class="address-summary">
            <text class="address-summary-name">{{ addressName || addressDetail }}</text>
            <text v-if="addressDetail" class="address-summary-detail">{{ addressDetail }}</text>
          </view>
          <text v-else style="color: #9ca3af">在地图上搜索或选择当前位置</text>
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
  </view>
</template>

<script>
import { api, requireLogin } from '../../utils/api.js';
import AddressMapPicker from '../../components/address-map-picker/address-map-picker.vue';
import RegionSelectField from '../../components/region-select-field/region-select-field.vue';

export default {
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
      if (!this.addressDetail.trim()) {
        uni.showToast({ title: '请选择详细在途位置', icon: 'none' });
        return false;
      }
      if (!this.latitude || !this.longitude) {
        uni.showToast({ title: '请在地图上确认在途位置', icon: 'none' });
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
          addressDetail: this.addressDetail,
          latitude: Number(this.latitude),
          longitude: Number(this.longitude),
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

.transit-address-display {
  min-height: 92rpx;
  align-items: flex-start;
  padding-top: 18rpx;
  padding-bottom: 18rpx;
}

.transit-address-display.disabled {
  background: #f3f4f6;
  color: #9ca3af;
}

.address-summary {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  width: 100%;
}

.address-summary-name {
  color: #111827;
  font-size: 26rpx;
  font-weight: 700;
  line-height: 1.35;
}

.address-summary-detail {
  color: #6b7280;
  font-size: 23rpx;
  line-height: 1.45;
}

.dev-location-btn {
  margin-top: 20rpx;
  width: 100%;
}
</style>
