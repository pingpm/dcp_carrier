<template>
  <view class="page company-profile-page">
    <view class="section header-card">
      <view class="company-avatar">
        <image class="company-avatar-icon" src="/static/icons/building.svg" mode="aspectFit" />
      </view>
      <view class="company-meta">
        <text class="company-name font-bold">{{ profile.companyName || '企业名称未完善' }}</text>
        <view class="status-badge-container">
          <text class="status-tag status-success" v-if="profile.reviewStatus === 'APPROVED'">
            已认证
          </text>
          <text class="status-tag status-warning" v-else-if="profile.reviewStatus === 'PENDING'">
            审核中
          </text>
          <text class="status-tag status-danger" v-else-if="profile.reviewStatus === 'REJECTED'">
            认证驳回
          </text>
          <text class="status-tag" v-else>未认证</text>
        </view>
      </view>
    </view>

    <view class="section info-section">
      <view class="section-title">工商备案信息</view>
      <view class="info-item">
        <text class="info-label">企业名称</text>
        <view class="info-val-row">
          <text class="info-value">{{ profile.companyName || '暂无' }}</text>
          <text class="lock-icon"></text>
        </view>
      </view>
      <view class="info-item">
        <text class="info-label">统一社会信用代码</text>
        <view class="info-val-row">
          <text class="info-value">{{ profile.creditCode || '暂无' }}</text>
          <text class="lock-icon"></text>
        </view>
      </view>
      <view class="info-item last">
        <text class="info-label">注册手机号</text>
        <view class="info-val-row">
          <text class="info-value">{{ profile.registeredPhone || '暂无' }}</text>
          <text class="lock-icon"></text>
        </view>
      </view>
    </view>

    <view class="section edit-section">
      <view class="section-title">企业介绍</view>
      <view class="field">
        <text class="label">企业简介描述</text>
        <textarea
          class="textarea"
          v-model="introduction"
          placeholder="请简要介绍您的车队规模、运力优势、常跑线路等，有助于提升车商的合作意向..."
          maxlength="500"
          @input="onInput"
        />
        <text class="word-count">{{ introductionLength }} / 500</text>
      </view>
    </view>

    <view class="section address-section">
      <view class="address-section-head">
        <view>
          <view class="section-title no-margin">联系地址</view>
          <text class="section-subtitle">可添加总部、办事处或停车场等公开联系点</text>
        </view>
        <button class="add-address-btn" @tap="openAddressDrawer()">添加</button>
      </view>

      <view v-if="contactAddresses.length === 0" class="address-empty">
        <text class="address-empty-title">暂未添加联系地址</text>
        <text class="address-empty-desc">保存后车商可在承运商介绍中查看办事处位置。</text>
      </view>

      <view
        v-for="(address, index) in contactAddresses"
        :key="address.localId"
        class="contact-address-card"
      >
        <view class="address-card-main" @tap="openAddressDrawer(index)">
          <view class="address-name-row">
            <text class="address-name">{{ addressTitle(address, index) }}</text>
            <text class="address-city">{{ address.cityName || '未选城市' }}</text>
          </view>
          <text class="address-detail">{{ address.addressDetail || '未选择详细地址' }}</text>
          <text class="address-phone">联系电话：{{ address.contactPhone || '未填写' }}</text>
        </view>
        <view class="address-card-actions">
          <button class="address-text-btn" @tap="openAddressDrawer(index)">编辑</button>
          <button class="address-text-btn danger" @tap="removeAddress(index)">删除</button>
        </view>
      </view>
    </view>

    <view v-if="addressDrawerVisible" class="company-address-mask" @tap="closeAddressDrawer">
      <view class="company-address-drawer" @tap.stop>
        <view class="drawer-handle"></view>
        <view class="drawer-header">
          <text class="drawer-title">{{ editingAddressIndex === -1 ? '添加联系地址' : '编辑联系地址' }}</text>
          <text class="drawer-close" @tap="closeAddressDrawer">×</text>
        </view>

        <scroll-view scroll-y class="drawer-body">
          <view class="field">
            <text class="label">联系地址名称</text>
            <input
              class="input"
              v-model="addressForm.addressName"
              maxlength="30"
              placeholder="例如总部、上海办事处（选填）"
              placeholder-style="color:#9ca3af"
            />
          </view>
          <view class="field">
            <text class="label">联系电话 <text class="required">*</text></text>
            <input
              class="input"
              v-model="addressForm.contactPhone"
              type="number"
              maxlength="11"
              placeholder="请输入办事处联系电话"
              placeholder-style="color:#9ca3af"
            />
          </view>
          <region-select-field
            label="所在省市"
            required
            :province-name="addressForm.provinceName"
            :city-name="addressForm.cityName"
            @select="selectAddressRegion"
          />
          <view class="field">
            <text class="label">联系地址 <text class="required">*</text></text>
            <view class="address-picker-display" @tap="openMapPicker">
              <view v-if="addressForm.addressPoiName" class="address-summary">
                <text class="address-summary-name">{{ addressForm.addressPoiName }}</text>
                <text class="address-summary-detail">{{ addressForm.addressDetail }}</text>
              </view>
              <text v-else class="address-placeholder">在地图上选择详细地址</text>
            </view>
          </view>
        </scroll-view>

        <view class="drawer-footer">
          <button class="secondary-btn drawer-action" @tap="closeAddressDrawer">取消</button>
          <button class="primary-btn drawer-action" @tap="confirmAddressForm">保存地址</button>
        </view>
      </view>
    </view>

    <address-map-picker ref="addressMapPicker" @select="selectMapAddress" />

    <view class="fixed-footer">
      <button class="primary-btn" :loading="saving" @click="saveProfile">保存企业介绍</button>
    </view>
    <miniapp-login-sheet ref="loginSheet" @success="handleLoginSuccess" />
  </view>
</template>

<script>
import { miniappLoginPageMixin } from '../../utils/miniapp-login-page.js';
import { api, requireLogin } from '../../utils/api.js';
import AddressMapPicker from '../../components/address-map-picker/address-map-picker.vue';
import RegionSelectField from '../../components/region-select-field/region-select-field.vue';

function emptyAddressForm(defaultPhone = '') {
  return {
    localId: `addr-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    addressName: '',
    provinceId: '',
    provinceName: '',
    cityId: '',
    cityName: '',
    districtId: '',
    districtName: '',
    addressPoiName: '',
    addressDetail: '',
    longitude: '',
    latitude: '',
    contactPhone: defaultPhone || '',
  };
}

export default {
  components: {
    AddressMapPicker,
    RegionSelectField,
  },
  mixins: [miniappLoginPageMixin],
  data() {
    return {
      profile: {
        companyName: '',
        creditCode: '',
        registeredPhone: '',
        reviewStatus: '',
        introduction: '',
        contactAddresses: [],
      },
      introduction: '',
      contactAddresses: [],
      addressDrawerVisible: false,
      editingAddressIndex: -1,
      addressForm: emptyAddressForm(),
      saving: false,
    };
  },
  computed: {
    introductionLength() {
      return (this.introduction || '').length;
    },
  },
  onShow() {
    if (requireLogin()) {
      this.fetchProfile();
    }
  },
  methods: {
    async fetchProfile() {
      try {
        uni.showLoading({ title: '加载中...' });
        const res = await api.companyProfile();
        this.profile = res || {};
        this.introduction = res.introduction || '';
        this.contactAddresses = (res.contactAddresses || []).map((item, index) =>
          this.normalizeAddressForEdit(item, index),
        );
      } catch (error) {
        console.error('获取企业介绍失败:', error);
      } finally {
        uni.hideLoading();
      }
    },
    normalizeAddressForEdit(item, index = 0) {
      return {
        ...emptyAddressForm(this.profile.registeredPhone),
        ...item,
        localId: item.id || `addr-${Date.now()}-${index}`,
        provinceId: item.provinceId || '',
        cityId: item.cityId || '',
        districtId: item.districtId || '',
        longitude: item.longitude || '',
        latitude: item.latitude || '',
      };
    },
    onInput(e) {
      this.introduction = e.detail.value;
    },
    addressTitle(address, index) {
      return address.addressName || address.addressPoiName || `联系地址 ${index + 1}`;
    },
    openAddressDrawer(index = -1) {
      this.editingAddressIndex = index;
      const source =
        index >= 0 ? this.contactAddresses[index] : emptyAddressForm(this.profile.registeredPhone);
      this.addressForm = { ...source };
      this.addressDrawerVisible = true;
    },
    closeAddressDrawer() {
      this.addressDrawerVisible = false;
      this.editingAddressIndex = -1;
      this.addressForm = emptyAddressForm(this.profile.registeredPhone);
    },
    selectAddressRegion(region) {
      this.addressForm = {
        ...this.addressForm,
        provinceId: region.provinceId || '',
        provinceName: region.provinceName || '',
        cityId: region.cityId || '',
        cityName: region.cityName || '',
        addressPoiName: '',
        addressDetail: '',
        longitude: region.cityLongitude || '',
        latitude: region.cityLatitude || '',
      };
    },
    openMapPicker() {
      if (!this.addressForm.provinceName || !this.addressForm.cityName) {
        uni.showToast({ title: '请先选择省市', icon: 'none' });
        return;
      }
      this.$refs.addressMapPicker.open({
        provinceName: this.addressForm.provinceName,
        cityName: this.addressForm.cityName,
        districtName: this.addressForm.districtName,
        districtId: this.addressForm.districtId,
        name: this.addressForm.addressPoiName,
        address: this.addressForm.addressDetail,
        lng: this.addressForm.longitude,
        lat: this.addressForm.latitude,
      });
    },
    selectMapAddress(address) {
      this.addressForm = {
        ...this.addressForm,
        districtId: address.districtId || this.addressForm.districtId || '',
        districtName: address.districtName || this.addressForm.districtName || '',
        addressPoiName: address.name || '',
        addressDetail: address.address || address.name || '',
        longitude: address.lng || '',
        latitude: address.lat || '',
      };
    },
    confirmAddressForm() {
      const phone = String(this.addressForm.contactPhone || '').trim();
      if (!/^1\d{10}$/.test(phone)) {
        uni.showToast({ title: '请输入 11 位联系电话', icon: 'none' });
        return;
      }
      if (!this.addressForm.provinceName || !this.addressForm.cityName) {
        uni.showToast({ title: '请选择省市', icon: 'none' });
        return;
      }
      if (!this.addressForm.addressPoiName || !this.addressForm.addressDetail) {
        uni.showToast({ title: '请选择联系地址', icon: 'none' });
        return;
      }
      if (!this.addressForm.longitude || !this.addressForm.latitude) {
        uni.showToast({ title: '联系地址缺少经纬度', icon: 'none' });
        return;
      }

      const next = {
        ...this.addressForm,
        contactPhone: phone,
        addressName: String(this.addressForm.addressName || '').trim(),
      };
      if (this.editingAddressIndex >= 0) {
        this.contactAddresses.splice(this.editingAddressIndex, 1, next);
      } else {
        if (this.contactAddresses.length >= 10) {
          uni.showToast({ title: '最多添加 10 个联系地址', icon: 'none' });
          return;
        }
        this.contactAddresses.push(next);
      }
      this.closeAddressDrawer();
    },
    removeAddress(index) {
      uni.showModal({
        title: '删除联系地址',
        content: '删除后车商将无法在企业介绍中查看该地址。',
        confirmColor: '#ef4444',
        confirmText: '删除',
        success: (res) => {
          if (res.confirm) {
            this.contactAddresses.splice(index, 1);
          }
        },
      });
    },
    buildAddressPayload() {
      return this.contactAddresses.map((item) => ({
        addressName: item.addressName || '',
        provinceId: item.provinceId || '',
        provinceName: item.provinceName || '',
        cityId: item.cityId || '',
        cityName: item.cityName || '',
        districtId: item.districtId || '',
        districtName: item.districtName || '',
        addressPoiName: item.addressPoiName || '',
        addressDetail: item.addressDetail || '',
        longitude: item.longitude,
        latitude: item.latitude,
        contactPhone: item.contactPhone || '',
      }));
    },
    async saveProfile() {
      try {
        this.saving = true;
        uni.showLoading({ title: '保存中...' });
        const updated = await api.saveCompanyProfile({
          introduction: this.introduction,
          contactAddresses: this.buildAddressPayload(),
        });
        this.profile = updated || this.profile;
        this.contactAddresses = (updated.contactAddresses || []).map((item, index) =>
          this.normalizeAddressForEdit(item, index),
        );
        uni.showToast({ title: '保存成功', icon: 'success' });
      } catch (error) {
        console.error('保存企业介绍失败:', error);
      } finally {
        this.saving = false;
        uni.hideLoading();
      }
    },
  },
};
</script>

<style>
.company-profile-page {
  padding: 24rpx;
  padding-bottom: calc(160rpx + env(safe-area-inset-bottom));
}

.header-card {
  display: flex;
  align-items: center;
  gap: 30rpx;
  background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);
}

.company-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: #ffffff;
  border: 4rpx solid #bfdbfe;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(22, 119, 255, 0.08);
}

.company-avatar-icon {
  width: 54rpx;
  height: 54rpx;
}

.company-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  min-width: 0;
}

.company-name {
  font-size: 34rpx;
  color: var(--text-main);
  line-height: 1.25;
}

.status-badge-container {
  display: flex;
}

.info-section {
  padding: 30rpx;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24rpx;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f3f4f6;
}

.info-item.last {
  border-bottom: none;
  padding-bottom: 0;
  margin-bottom: 0;
}

.info-label {
  flex-shrink: 0;
  font-size: 26rpx;
  color: var(--text-muted);
}

.info-val-row {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 12rpx;
  min-width: 0;
}

.info-value {
  font-size: 26rpx;
  color: var(--text-main);
  font-weight: 500;
  text-align: right;
  word-break: break-all;
}

.lock-icon {
  position: relative;
  width: 22rpx;
  height: 18rpx;
  margin-top: 5rpx;
  border: 2rpx solid #94a3b8;
  border-radius: 4rpx;
  opacity: 0.7;
  flex-shrink: 0;
}

.lock-icon::before {
  content: '';
  position: absolute;
  left: 4rpx;
  top: -11rpx;
  width: 10rpx;
  height: 10rpx;
  border: 2rpx solid #94a3b8;
  border-bottom: 0;
  border-radius: 10rpx 10rpx 0 0;
}

.edit-section {
  position: relative;
}

.word-count {
  position: absolute;
  right: 48rpx;
  bottom: 48rpx;
  font-size: 22rpx;
  color: var(--text-weak);
}

.address-section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
  margin-bottom: 24rpx;
}

.section-title.no-margin {
  margin-bottom: 0;
}

.section-subtitle {
  display: block;
  margin-top: 8rpx;
  color: #64748b;
  font-size: 24rpx;
  line-height: 1.5;
}

.add-address-btn {
  flex-shrink: 0;
  min-width: 124rpx;
  height: 60rpx;
  padding: 0 22rpx;
  border: none;
  border-radius: 999rpx;
  background: #1677ff;
  color: #ffffff;
  font-size: 24rpx;
  line-height: 60rpx;
}

.address-empty {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  padding: 30rpx;
  border: 1rpx dashed #cbd5e1;
  border-radius: 12rpx;
  background: #f8fafc;
}

.address-empty-title {
  color: #334155;
  font-size: 27rpx;
  font-weight: 700;
}

.address-empty-desc {
  color: #64748b;
  font-size: 24rpx;
  line-height: 1.5;
}

.contact-address-card {
  padding: 24rpx;
  border: 1rpx solid #eef2f7;
  border-radius: 12rpx;
  background: #ffffff;
  box-shadow: 0 4rpx 14rpx rgba(15, 23, 42, 0.04);
}

.contact-address-card + .contact-address-card {
  margin-top: 18rpx;
}

.address-card-main {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.address-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.address-name {
  color: #111827;
  font-size: 29rpx;
  font-weight: 800;
}

.address-city {
  flex-shrink: 0;
  color: #1677ff;
  font-size: 23rpx;
}

.address-detail,
.address-phone {
  color: #64748b;
  font-size: 25rpx;
  line-height: 1.5;
}

.address-card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12rpx;
  margin-top: 18rpx;
}

.address-text-btn {
  width: auto;
  height: 52rpx;
  margin: 0;
  padding: 0 22rpx;
  border: 1rpx solid #dbeafe;
  border-radius: 999rpx;
  background: #eff6ff;
  color: #1677ff;
  font-size: 23rpx;
  line-height: 52rpx;
}

.address-text-btn.danger {
  border-color: #fee2e2;
  background: #fef2f2;
  color: #ef4444;
}

.company-address-mask {
  position: fixed;
  inset: 0;
  z-index: 1100;
  background: rgba(15, 23, 42, 0.42);
  opacity: 1;
  pointer-events: auto;
}

.company-address-drawer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  height: 62vh;
  max-height: 62vh;
  padding: 14rpx 28rpx calc(24rpx + env(safe-area-inset-bottom));
  border-radius: 28rpx 28rpx 0 0;
  background: #ffffff;
  box-sizing: border-box;
}

.drawer-handle {
  align-self: center;
  width: 72rpx;
  height: 8rpx;
  margin: 4rpx 0 18rpx;
  border-radius: 999rpx;
  background: #d1d5db;
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.drawer-title {
  color: #111827;
  font-size: 32rpx;
  font-weight: 800;
}

.drawer-close {
  width: 58rpx;
  height: 58rpx;
  border-radius: 50%;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 42rpx;
  line-height: 54rpx;
  text-align: center;
}

.drawer-body {
  flex: 1;
  min-height: 0;
}

.address-picker-display {
  min-height: 96rpx;
  padding: 22rpx 24rpx;
  border: 1rpx solid #e5e7eb;
  border-radius: 12rpx;
  background: #f9fafb;
  box-sizing: border-box;
}

.address-placeholder {
  color: #9ca3af;
  font-size: 26rpx;
}

.address-summary {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.address-summary-name {
  color: #111827;
  font-size: 27rpx;
  font-weight: 700;
}

.address-summary-detail {
  color: #64748b;
  font-size: 24rpx;
  line-height: 1.5;
}

.drawer-footer {
  display: flex;
  gap: 18rpx;
  padding-top: 18rpx;
}

.drawer-action {
  flex: 1;
}
</style>
