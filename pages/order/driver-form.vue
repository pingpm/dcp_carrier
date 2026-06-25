<template>
  <view class="page driver-form-page">
    <view class="form-header">
      <view class="form-header-title">指派司机车辆</view>
      <view class="form-header-desc">请指派本次运输任务的责任司机及车牌号信息。</view>
    </view>

    <view class="section">
      <view class="section-title">司机类型 <text class="required">*</text></view>
      <view class="grid-two">
        <view
          class="check-row"
          :class="{ checked: form.driverType === 'PICKUP' }"
          @click="setDriverType('PICKUP')"
        >
          <text class="radio-icon-box">{{ form.driverType === 'PICKUP' ? '●' : '' }}</text>
          <text>提车司机 (起运提车)</text>
        </view>
        <view
          class="check-row"
          :class="{ checked: form.driverType === 'HANDOVER' }"
          @click="setDriverType('HANDOVER')"
        >
          <text class="radio-icon-box">{{ form.driverType === 'HANDOVER' ? '●' : '' }}</text>
          <text>交车司机 (目的地送达)</text>
        </view>
      </view>
    </view>

    <view class="section">
      <view class="section-title">司机与运输车信息</view>

      <view class="field">
        <text class="label">司机姓名 <text class="required">*</text></text>
        <input
          class="input"
          v-model="form.driverName"
          placeholder="请输入司机真实姓名"
          placeholder-style="color:#9ca3af"
        />
      </view>

      <view class="field">
        <text class="label">联系电话 <text class="required">*</text></text>
        <input
          class="input"
          v-model="form.driverPhone"
          type="number"
          maxlength="11"
          placeholder="请输入司机手机号码"
          placeholder-style="color:#9ca3af"
        />
      </view>

      <view class="field">
        <text class="label">运输车牌号 <text class="required">*</text></text>
        <input
          class="input"
          v-model="form.licensePlate"
          placeholder="请输入托运板车/拖车车牌号 (例: 京A66666)"
          placeholder-style="color:#9ca3af"
        />
      </view>

      <view class="field">
        <text class="label">身份证号 (选填)</text>
        <input
          class="input"
          v-model="form.idNumber"
          placeholder="请输入司机身份证号"
          placeholder-style="color:#9ca3af"
          maxlength="18"
        />
      </view>
    </view>

    <!-- Fixed Footer -->
    <view class="fixed-footer">
      <button class="primary-btn animate-btn" :loading="submitting" @click="submit">
        保存并指派司机
      </button>
    </view>
    <miniapp-login-sheet ref="loginSheet" @success="handleLoginSuccess" />
  </view>
</template>

<script>
import { miniappLoginPageMixin } from '../../utils/miniapp-login-page.js';
import { api, requireLogin } from '../../utils/api.js';

export default {
  mixins: [miniappLoginPageMixin],
  data() {
    return {
      orderId: '',
      form: {
        driverType: 'PICKUP', // PICKUP, HANDOVER
        driverName: '',
        driverPhone: '',
        licensePlate: '',
        idNumber: '',
      },
      submitting: false,
    };
  },
  onLoad(options) {
    if (!requireLogin()) return;
    this.orderId = options.orderId;
    if (['PICKUP', 'HANDOVER'].includes(options.driverType)) {
      this.form.driverType = options.driverType;
    }
    this.loadCurrent();
  },
  methods: {
    async loadCurrent() {
      try {
        const data = await api.orderDetail(this.orderId);
        this.fillDriverForm(data.order, this.form.driverType);
      } catch (err) {
        console.error(err);
      }
    },
    fillDriverForm(order, type) {
      const driver = type === 'HANDOVER' ? order?.deliveryDriverInfo : order?.driverInfo;
      if (!driver) return;
      this.form = {
        driverType: type,
        driverName: driver.driverName || '',
        driverPhone: driver.driverPhone || '',
        licensePlate: driver.licensePlate || '',
        idNumber: driver.idNumber || '',
      };
    },
    setDriverType(type) {
      this.form.driverType = type;
      // When type switches, load corresponding driver info from order details if exists
      this.reloadDriverInfo(type);
    },
    async reloadDriverInfo(type) {
      try {
        const data = await api.orderDetail(this.orderId);
        if (type === 'PICKUP' && data.order?.driverInfo) {
          const d = data.order.driverInfo;
          this.form.driverName = d.driverName || '';
          this.form.driverPhone = d.driverPhone || '';
          this.form.licensePlate = d.licensePlate || '';
          this.form.idNumber = d.idNumber || '';
        } else if (type === 'HANDOVER' && data.order?.deliveryDriverInfo) {
          const d = data.order.deliveryDriverInfo;
          this.form.driverName = d.driverName || '';
          this.form.driverPhone = d.driverPhone || '';
          this.form.licensePlate = d.licensePlate || '';
          this.form.idNumber = d.idNumber || '';
        } else {
          this.form.driverName = '';
          this.form.driverPhone = '';
          this.form.licensePlate = '';
          this.form.idNumber = '';
        }
      } catch (err) {}
    },
    validate() {
      if (!this.form.driverName.trim()) {
        uni.showToast({ title: '请输入司机姓名', icon: 'none' });
        return false;
      }
      if (!/^1\d{10}$/.test(this.form.driverPhone.trim())) {
        uni.showToast({ title: '请输入正确的11位电话号码', icon: 'none' });
        return false;
      }
      if (!this.form.licensePlate.trim()) {
        uni.showToast({ title: '请输入车牌号', icon: 'none' });
        return false;
      }
      if (this.form.idNumber.trim() && this.form.idNumber.trim().length !== 18) {
        uni.showToast({ title: '身份证号码格式不正确', icon: 'none' });
        return false;
      }
      return true;
    },
    async submit() {
      if (!this.validate()) return;
      this.submitting = true;
      try {
        await api.setDrivers(this.orderId, {
          driverType: this.form.driverType,
          driverName: this.form.driverName,
          driverPhone: this.form.driverPhone,
          vehiclePlateNumber: this.form.licensePlate,
          driverIdNumber: this.form.idNumber,
        });
        uni.showToast({ title: '司机设置成功', icon: 'success' });
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
.driver-form-page {
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
</style>
