<template>
  <view class="page home-page">
    <!-- Not Logged In Banner -->
    <view
      v-if="!isLoggedIn"
      class="notice-bar guest-bar"
      @click="goLogin"
    >
      <image class="notice-icon-img" src="/static/icons/user.svg" mode="aspectFit" />
      <text class="notice-text">您当前尚未登录，无法查看工作台数据</text>
      <text class="notice-action">去登录</text>
      <image class="arrow-icon" src="/static/icons/arrow-right.svg" mode="aspectFit" />
    </view>

    <!-- Verification Alert Banner -->
    <view
      v-else-if="dashboard.reviewStatus !== 'APPROVED'"
      class="notice-bar warning"
      @click="goVerification"
    >
      <image class="notice-icon-img" src="/static/icons/alert-triangle.svg" mode="aspectFit" />
      <text class="notice-text">您尚未完成资质认证，线路无法公开且无法接单</text>
      <text class="notice-action">去认证</text>
      <image class="arrow-icon" src="/static/icons/arrow-right.svg" mode="aspectFit" />
    </view>

    <!-- Wallet Balance Risk Warning Banner -->
    <view v-if="isLoggedIn && hasWalletRisk" class="notice-bar danger" @click="goWallet">
      <image class="notice-icon-img" src="/static/icons/alert-triangle.svg" mode="aspectFit" />
      <text class="notice-text">{{ walletRiskText }}</text>
      <text class="notice-action">去充值</text>
      <image class="arrow-icon" src="/static/icons/arrow-right.svg" mode="aspectFit" />
    </view>

    <!-- Overview Statistics -->
    <view class="section metrics-section">
      <view class="section-title">订单中心</view>
      <view class="todo-grid">
        <view class="todo-item" @click="goOrders('PENDING_CONFIRM')">
          <view class="todo-val font-bold" :class="{ highlight: todoCounts.pendingConfirm > 0 }">
            {{ todoCounts.pendingConfirm || 0 }}
          </view>
          <text class="todo-label">待确认</text>
        </view>
        <view class="todo-item" @click="goOrders('PENDING_CONTRACT')">
          <view class="todo-val font-bold" :class="{ highlight: todoCounts.pendingContract > 0 }">
            {{ todoCounts.pendingContract || 0 }}
          </view>
          <text class="todo-label">待签合同</text>
        </view>
        <view class="todo-item" @click="goOrders('PENDING_PICKUP')">
          <view class="todo-val font-bold" :class="{ highlight: todoCounts.pendingPickup > 0 }">
            {{ todoCounts.pendingPickup || 0 }}
          </view>
          <text class="todo-label">待提车</text>
        </view>
        <view class="todo-item" @click="goOrders('IN_TRANSIT')">
          <view class="todo-val font-bold">
            {{ todoCounts.inTransit || 0 }}
          </view>
          <text class="todo-label">运输中</text>
        </view>
        <view class="todo-item" @click="goOrders('CANCEL_PENDING')">
          <view class="todo-val font-bold" :class="{ danger: todoCounts.cancelPending > 0 }">
            {{ todoCounts.cancelPending || 0 }}
          </view>
          <text class="todo-label">取消中</text>
        </view>
      </view>
    </view>

    <!-- Wallet Summary Section -->
    <view class="section wallet-summary-card" @click="goWallet">
      <view class="row-between summary-header">
        <text class="section-title" style="margin-bottom: 0">资金账户</text>
        <view class="text-link-row">
          <text class="text-link">去充值</text>
          <image class="arrow-icon" src="/static/icons/arrow-right.svg" mode="aspectFit" />
        </view>
      </view>
      <view class="wallet-values-row">
        <view class="wallet-val-block">
          <text class="wallet-lbl">保证金余额</text>
          <text class="wallet-amt font-bold" :class="{ danger: isDepositBelowMinimum }">
            {{ yuanText(wallet.depositBalanceCent) }}
          </text>
          <text class="wallet-tip">{{ depositStatusText }}</text>
        </view>
        <view class="divider"></view>
        <view class="wallet-val-block">
          <text class="wallet-lbl">信息费余额</text>
          <text class="wallet-amt font-bold" :class="{ danger: isInfoFeeInsufficient }">
            {{ yuanText(wallet.infoFeeBalanceCent) }}
          </text>
          <text class="wallet-tip">{{ infoFeeStatusText }}</text>
        </view>
      </view>
    </view>

    <!-- Route Summary Section -->
    <view class="section route-summary-card" @click="goRoutes">
      <view class="row-between summary-header">
        <text class="section-title" style="margin-bottom: 0">承运线路</text>
        <view class="text-link-row">
          <text class="text-link">管理线路</text>
          <image class="arrow-icon" src="/static/icons/arrow-right.svg" mode="aspectFit" />
        </view>
      </view>
      <view class="route-counts-row">
        <view class="route-cnt-item">
          <text class="route-cnt-val font-bold">{{ routeCounts.largeTruck || 0 }}</text>
          <text class="route-cnt-lbl">大板线路</text>
        </view>
        <view class="route-cnt-item">
          <text class="route-cnt-val font-bold">{{ routeCounts.smallTruck || 0 }}</text>
          <text class="route-cnt-lbl">小板线路</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { api, getToken } from '../../utils/api.js';
import { yuanText, reviewStatusText } from '../../utils/format.js';

export default {
  data() {
    return {
      isLoggedIn: false,
      dashboard: {
        reviewStatus: 'UNVERIFIED',
        orderTodoCounts: {
          pendingConfirm: 0,
          pendingContract: 0,
          pendingPickup: 0,
          inTransit: 0,
          cancelPending: 0,
        },
        wallet: {
          depositBalanceCent: 0,
          depositMinimumCent: 0,
          isDepositBelowMinimum: false,
          infoFeeBalanceCent: 0,
          isInfoFeeInsufficient: false,
        },
        routeCounts: {
          largeTruck: 0,
          smallTruck: 0,
        },
      },
      reviewStatusText,
    };
  },
  computed: {
    todoCounts() {
      return this.dashboard.orderTodoCounts || {};
    },
    wallet() {
      return this.dashboard.wallet || {};
    },
    routeCounts() {
      return this.dashboard.routeCounts || {};
    },
    isVerificationApproved() {
      return this.dashboard.reviewStatus === 'APPROVED';
    },
    isDepositBelowMinimum() {
      return this.isVerificationApproved && Boolean(this.wallet.isDepositBelowMinimum);
    },
    isInfoFeeInsufficient() {
      return this.isVerificationApproved && Boolean(this.wallet.isInfoFeeInsufficient);
    },
    hasWalletRisk() {
      return this.isDepositBelowMinimum || this.isInfoFeeInsufficient;
    },
    depositStatusText() {
      if (!this.isVerificationApproved) {
        return '认证通过后校验保证金标准';
      }
      if (this.wallet.isDepositCheckEnabled === false) {
        return '当前状态: 搜索联系限制已关闭';
      }
      return `最低标准: ${this.yuanText(this.wallet.depositMinimumCent)}`;
    },
    infoFeeStatusText() {
      if (!this.isVerificationApproved) {
        return '当前状态: 认证通过后校验';
      }
      if (this.wallet.isInfoFeeCheckEnabled === false) {
        return '当前状态: 搜索联系限制已关闭';
      }
      return `当前状态: ${this.isInfoFeeInsufficient ? '不足' : '充足'}`;
    },
    walletRiskText() {
      if (this.isDepositBelowMinimum && this.isInfoFeeInsufficient) {
        return '保证金及信息费不足，线路已隐藏且无法接单';
      }
      if (this.isDepositBelowMinimum) {
        return '保证金低于最低额度，运输线路已隐藏';
      }
      if (this.isInfoFeeInsufficient) {
        return '信息服务费不足，您将无法确认接单';
      }
      return '';
    },
  },
  onShow() {
    this.isLoggedIn = !!getToken();
    if (this.isLoggedIn) {
      this.loadData();
    } else {
      this.resetData();
    }
  },
  methods: {
    yuanText,
    resetData() {
      this.dashboard = {
        reviewStatus: 'UNVERIFIED',
        orderTodoCounts: {
          pendingConfirm: 0,
          pendingContract: 0,
          pendingPickup: 0,
          inTransit: 0,
          cancelPending: 0,
        },
        wallet: {
          depositBalanceCent: 0,
          depositMinimumCent: 0,
          isDepositBelowMinimum: false,
          infoFeeBalanceCent: 0,
          isInfoFeeInsufficient: false,
        },
        routeCounts: {
          largeTruck: 0,
          smallTruck: 0,
        },
      };
    },
    async loadData() {
      try {
        const res = await api.dashboard({ silent: true, authRedirect: false });
        this.dashboard = res;
        this.showVerificationPromptIfNeeded(res.reviewStatus);
      } catch (error) {
        this.resetData();
      }
    },
    showVerificationPromptIfNeeded(reviewStatus) {
      const shouldPrompt = uni.getStorageSync('carrier_need_verification_prompt') === '1';
      if (!shouldPrompt || reviewStatus === 'APPROVED') {
        return;
      }
      uni.removeStorageSync('carrier_need_verification_prompt');
      uni.showModal({
        title: '还未完成认证',
        content: '完成承运商认证后，您维护的线路才可对外展示，并可确认接单。',
        confirmText: '立即认证',
        cancelText: '稍后认证',
        success: (res) => {
          if (res.confirm) {
            this.goVerification();
          }
        },
      });
    },
    goVerification() {
      if (!this.isLoggedIn) {
        this.goLogin();
        return;
      }
      const url =
        this.dashboard.reviewStatus === 'PENDING'
          ? '/pages/verification/status'
          : '/pages/verification/form';
      uni.navigateTo({ url });
    },
    goOrders(status) {
      if (!this.isLoggedIn) {
        this.goLogin();
        return;
      }
      uni.setStorageSync('order_list_filter_status', status);
      uni.switchTab({ url: '/pages/order/list' });
    },
    goWallet() {
      if (!this.isLoggedIn) {
        this.goLogin();
        return;
      }
      uni.navigateTo({ url: '/pages/wallet/index' });
    },
    goRoutes() {
      if (!this.isLoggedIn) {
        this.goLogin();
        return;
      }
      uni.navigateTo({ url: '/pages/route/list' });
    },
    goLogin() {
      uni.navigateTo({ url: '/pages/auth/login' });
    },
  },
};
</script>

<style>
.home-page {
  padding: 30rpx;
  padding-bottom: calc(50rpx + env(safe-area-inset-bottom));
}

.notice-bar.guest-bar {
  background-color: #eff6ff;
  color: #1677ff;
  border: 1rpx solid #bfdbfe;
}

.todo-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10rpx;
  margin-top: 10rpx;
}

.todo-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.todo-val {
  font-size: 40rpx;
  color: #374151;
  margin-bottom: 8rpx;
}

.todo-val.highlight {
  color: #1677ff;
}

.todo-val.danger {
  color: #dc2626;
}

.todo-label {
  font-size: 22rpx;
  color: #6b7280;
}

.summary-header {
  border-bottom: 1rpx solid #f1f5f9;
  padding-bottom: 20rpx;
  margin-bottom: 24rpx;
}

.text-link {
  font-size: 24rpx;
  color: #1677ff;
  font-weight: bold;
}

.text-link-row {
  display: flex;
  align-items: center;
  gap: 4rpx;
}

.wallet-values-row {
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.wallet-val-block {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.wallet-lbl {
  font-size: 24rpx;
  color: #6b7280;
  margin-bottom: 8rpx;
}

.wallet-amt {
  font-size: 34rpx;
  color: #111827;
}

.wallet-amt.danger {
  color: #dc2626;
}

.wallet-tip {
  font-size: 20rpx;
  color: #9ca3af;
  margin-top: 6rpx;
}

.divider {
  width: 1rpx;
  height: 80rpx;
  background-color: #e5e7eb;
}

.route-counts-row {
  display: flex;
  justify-content: space-around;
  padding: 10rpx 0;
}

.route-cnt-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.route-cnt-val {
  font-size: 38rpx;
  color: #111827;
  margin-bottom: 8rpx;
}

.route-cnt-lbl {
  font-size: 24rpx;
  color: #6b7280;
}
</style>
