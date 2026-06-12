<template>
  <view class="page wallet-index-page">
    <!-- Risk warnings -->
    <view v-if="isDepositBelowMinimum" class="notice-bar warning" @click="goRecharge('DEPOSIT')">
      <image class="notice-icon-img" src="/static/icons/alert-triangle.svg" mode="aspectFit" />
      <text class="notice-text">保证金低于最低要求，线路已对车商隐藏</text>
      <text class="notice-action">去充值</text>
      <image class="arrow-icon" src="/static/icons/arrow-right.svg" mode="aspectFit" />
    </view>

    <view v-if="isInfoFeeInsufficient" class="notice-bar danger" @click="goRecharge('INFO_FEE')">
      <image class="notice-icon-img" src="/static/icons/alert-triangle.svg" mode="aspectFit" />
      <text class="notice-text">信息服务费已耗尽，无法确认接单或联系客户</text>
      <text class="notice-action">去充值</text>
      <image class="arrow-icon" src="/static/icons/arrow-right.svg" mode="aspectFit" />
    </view>

    <!-- Deposit balance card -->
    <view class="section balance-card deposit">
      <view class="row-between align-center">
        <view class="balance-meta">
          <text class="balance-label">货运保证金 (元)</text>
          <text class="balance-value font-bold">{{ yuanVal(wallet.depositBalanceCent) }}</text>
        </view>
        <button class="primary-btn recharge-btn-mini" @click="goRecharge('DEPOSIT')">充值</button>
      </view>
      <view class="balance-footer">
        <text>最低限额标准: {{ yuanText(wallet.depositMinimumCent) }}</text>
        <text
          class="status-tag mini-tag"
          :class="isDepositBelowMinimum ? 'status-danger' : 'status-success'"
        >
          {{ depositStatusLabel }}
        </text>
      </view>
    </view>

    <!-- Info fee balance card -->
    <view class="section balance-card info-fee">
      <view class="row-between align-center">
        <view class="balance-meta">
          <text class="balance-label">信息服务费 (元)</text>
          <text class="balance-value font-bold">{{ yuanVal(wallet.infoFeeBalanceCent) }}</text>
        </view>
        <button class="primary-btn recharge-btn-mini" @click="goRecharge('INFO_FEE')">充值</button>
      </view>
      <view class="balance-footer">
        <text>按单按次确认扣费, 多充不限</text>
        <text
          class="status-tag mini-tag"
          :class="isInfoFeeInsufficient ? 'status-danger' : 'status-success'"
        >
          {{ infoFeeStatusLabel }}
        </text>
      </view>
    </view>

    <!-- History records navigation links -->
    <view class="section links-section-card">
      <view class="section-title">资金与消费记录</view>
      <view class="links-list">
        <view class="link-item" @click="goLink('/pages/wallet/recharge-records')">
          <view class="row align-center">
            <image class="link-icon" src="/static/icons/credit-card.svg" mode="aspectFit" />
            <text class="link-label">在线充值记录</text>
          </view>
          <image class="link-arrow" src="/static/icons/arrow-right.svg" mode="aspectFit" />
        </view>
        <view class="link-item" @click="goLink('/pages/wallet/info-fee-deductions')">
          <view class="row align-center">
            <image class="link-icon" src="/static/icons/trending-down.svg" mode="aspectFit" />
            <text class="link-label">订单信息费扣费清单</text>
          </view>
          <image class="link-arrow" src="/static/icons/arrow-right.svg" mode="aspectFit" />
        </view>
        <view class="link-item" @click="goLink('/pages/wallet/transactions')">
          <view class="row align-center">
            <image class="link-icon" src="/static/icons/receipt.svg" mode="aspectFit" />
            <text class="link-label">钱包变更账单总流水</text>
          </view>
          <image class="link-arrow" src="/static/icons/arrow-right.svg" mode="aspectFit" />
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { api, requireLogin } from '../../utils/api.js';
import { yuanText } from '../../utils/format.js';

export default {
  data() {
    return {
      wallet: {
        depositBalanceCent: 0,
        depositMinimumCent: 100000, // Default 1000元
        isDepositCheckEnabled: true,
        isDepositBelowMinimum: false,
        infoFeeBalanceCent: 0,
        isInfoFeeCheckEnabled: true,
        isInfoFeeInsufficient: false,
      },
    };
  },
  computed: {
    isDepositBelowMinimum() {
      return Boolean(this.wallet.isDepositBelowMinimum);
    },
    isInfoFeeInsufficient() {
      return Boolean(this.wallet.isInfoFeeInsufficient);
    },
    depositStatusLabel() {
      if (this.wallet.isDepositCheckEnabled === false) return '限制关闭';
      return this.isDepositBelowMinimum ? '余额不足' : '正常展示';
    },
    infoFeeStatusLabel() {
      if (this.wallet.isInfoFeeCheckEnabled === false) return '限制关闭';
      return this.isInfoFeeInsufficient ? '余额不足' : '正常接单';
    },
  },
  onShow() {
    if (requireLogin()) this.load();
  },
  methods: {
    yuanText,
    yuanVal(cent) {
      return (Number(cent || 0) / 100).toFixed(2);
    },
    async load() {
      try {
        const res = await api.walletIndex({ silent: true, authRedirect: false });
        this.wallet = res;
      } catch (err) {}
    },
    goRecharge(type) {
      uni.navigateTo({ url: `/pages/wallet/recharge?type=${type}` });
    },
    goLink(url) {
      uni.navigateTo({ url });
    },
  },
};
</script>

<style>
.wallet-index-page {
  padding: 30rpx;
  padding-bottom: calc(50rpx + env(safe-area-inset-bottom));
}



/* Balance Cards */
.balance-card {
  padding: 40rpx;
  border-radius: var(--radius-lg);
  color: #ffffff;
  position: relative;
  overflow: hidden;
  box-shadow: 0 12rpx 28rpx rgba(17, 24, 39, 0.04);
}

.balance-card.deposit {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
}

.balance-card.info-fee {
  background: linear-gradient(135deg, #10b981, #047857);
}

.balance-meta {
  display: flex;
  flex-direction: column;
}

.balance-label {
  font-size: 24rpx;
  opacity: 0.85;
  margin-bottom: 8rpx;
}

.balance-value {
  font-size: 54rpx;
}

.recharge-btn-mini {
  background: #ffffff !important;
  color: #1d4ed8 !important;
  min-height: 70rpx !important;
  font-size: 26rpx !important;
  padding: 0 36rpx !important;
  border-radius: 35rpx !important;
  box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.08) !important;
}

.info-fee .recharge-btn-mini {
  color: #047857 !important;
}

.balance-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 30rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.15);
  font-size: 20rpx;
  opacity: 0.9;
}

.mini-tag {
  min-height: 38rpx !important;
  font-size: 18rpx !important;
  padding: 0 16rpx !important;
}

/* Links lists */
.links-list {
  display: flex;
  flex-direction: column;
}

.link-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28rpx 0;
  border-bottom: 1rpx solid #f1f5f9;
}

.link-item:last-child {
  border-bottom: 0;
}

.link-icon {
  width: 38rpx;
  height: 38rpx;
  margin-right: 18rpx;
  flex-shrink: 0;
}

.link-label {
  font-size: 28rpx;
  color: #111827;
  font-weight: 500;
}

.link-arrow {
  width: 28rpx;
  height: 28rpx;
}
</style>
