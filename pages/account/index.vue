<template>
  <view class="page account-page">
    <!-- Profile Header Card -->
    <view v-if="!isLoggedIn" class="profile-header guest-header" @click="goLogin">
      <view class="avatar-wrap">
        <image
          class="avatar-img"
          src="/static/icons/user.svg"
          mode="aspectFill"
        ></image>
      </view>
      <view class="profile-meta">
        <text class="nickname">未登录承运商</text>
        <text class="phone-text">点击登录/注册账号</text>
      </view>
      <view class="guest-login-btn-wrap">
        <button class="primary-btn guest-btn" @click.stop="goLogin">立即登录</button>
      </view>
    </view>

    <view v-else class="profile-header" @click="goVerification">
      <view class="avatar-wrap">
        <image
          class="avatar-img"
          :src="userInfo.avatarUrl || '/static/icons/user.svg'"
          mode="aspectFill"
        ></image>
      </view>
      <view class="profile-meta">
        <view class="row align-center profile-name-row" style="gap: 12rpx">
          <text class="nickname">{{ displayName }}</text>
          <text class="verify-badge" :class="reviewStatus.toLowerCase()">
            {{ reviewStatusLabel }}
          </text>
        </view>
        <text class="phone-text">{{ userInfo.registeredPhone || '未绑定手机' }}</text>
      </view>
      <image class="header-arrow" src="/static/icons/arrow-right.svg" mode="aspectFit" />
    </view>

    <!-- Wallet Balance Card -->
    <view class="wallet-card" @click="goWallet">
      <view class="wallet-card-bg"></view>
      <view class="wallet-header-row">
        <view class="wallet-title-row">
          <image class="wallet-title-icon" src="/static/icons/credit-card.svg" mode="aspectFit" />
          <text class="wallet-title">资金账户</text>
        </view>
        <view class="wallet-link-row">
          <text class="wallet-link-text">充值管理</text>
          <image class="wallet-link-arrow" src="/static/icons/arrow-right.svg" mode="aspectFit" />
        </view>
      </view>
      <view class="wallet-balance-row">
        <view class="balance-item">
          <text class="balance-label">保证金 (元)</text>
          <text class="balance-value" :class="{ warn: isLoggedIn && isDepositLow }">
            {{ yuanVal(walletData.depositBalanceCent) }}
          </text>
        </view>
        <view class="balance-divider"></view>
        <view class="balance-item">
          <text class="balance-label">信息费 (元)</text>
          <text class="balance-value" :class="{ warn: isLoggedIn && isInfoFeeLow }">
            {{ yuanVal(walletData.infoFeeBalanceCent) }}
          </text>
        </view>
      </view>
      <view class="wallet-status-row" v-if="isLoggedIn && hasWalletRisk">
        <image class="wallet-status-icon" src="/static/icons/alert-triangle.svg" mode="aspectFit" />
        <text class="wallet-status-warn">{{ walletWarnText }}</text>
      </view>
    </view>

    <!-- Certification Banner (only when not approved) -->
    <view v-if="isLoggedIn && reviewStatus !== 'APPROVED'" class="cert-banner" @click="goVerification">
      <image class="cert-icon" src="/static/icons/alert-triangle.svg" mode="aspectFit" />
      <view class="cert-text-wrap">
        <text class="cert-title">资质认证待完善</text>
        <text class="cert-desc">完成认证后方可公开线路并承接运输订单</text>
      </view>
      <image class="cert-arrow" src="/static/icons/arrow-right.svg" mode="aspectFit" />
    </view>

    <!-- Service Menu Group -->
    <view class="menu-group">
      <view class="menu-group-title">服务管理</view>
      <view class="cell-item" @click="goRoutes">
        <image class="cell-icon" src="/static/icons/map.svg" mode="aspectFit" />
        <text class="cell-label">线路管理</text>
        <view class="cell-right">
          <text class="cell-desc" v-if="routeCount > 0">{{ routeCount }}条线路</text>
          <image class="cell-arrow" src="/static/icons/arrow-right.svg" mode="aspectFit" />
        </view>
      </view>
      <view class="cell-item" @click="goWallet">
        <image class="cell-icon" src="/static/icons/credit-card.svg" mode="aspectFit" />
        <text class="cell-label">钱包明细</text>
        <view class="cell-right">
          <image class="cell-arrow" src="/static/icons/arrow-right.svg" mode="aspectFit" />
        </view>
      </view>
      <view class="cell-item" @click="goVerification">
        <image class="cell-icon" src="/static/icons/shield-check.svg" mode="aspectFit" />
        <text class="cell-label">企业资质认证</text>
        <view class="cell-right">
          <text
            class="cell-status"
            :class="{
              'text-success': reviewStatus === 'APPROVED',
              'text-warning': reviewStatus === 'PENDING',
              'text-danger': reviewStatus === 'REJECTED',
            }"
          >
            {{ reviewStatusText[reviewStatus] || '未认证' }}
          </text>
          <image class="cell-arrow" src="/static/icons/arrow-right.svg" mode="aspectFit" />
        </view>
      </view>
      <view class="cell-item last" @click="goCompanyProfile">
        <image class="cell-icon" src="/static/icons/building.svg" mode="aspectFit" />
        <text class="cell-label">企业介绍</text>
        <view class="cell-right">
          <image class="cell-arrow" src="/static/icons/arrow-right.svg" mode="aspectFit" />
        </view>
      </view>
    </view>

    <!-- Settings Menu Group -->
    <view class="menu-group">
      <view class="menu-group-title">设置</view>
      <view class="cell-item last" @click="goSettings">
        <image class="cell-icon" src="/static/icons/settings.svg" mode="aspectFit" />
        <text class="cell-label">系统设置</text>
        <view class="cell-right">
          <image class="cell-arrow" src="/static/icons/arrow-right.svg" mode="aspectFit" />
        </view>
      </view>
    </view>
    <miniapp-login-sheet ref="loginSheet" @success="handleLoginSuccess" />
  </view>
</template>

<script>
import { api, getToken, clearSession, openLoginPrompt } from '../../utils/api.js';
import { reviewStatusText } from '../../utils/format.js';
import MiniappLoginSheet from '../../components/miniapp-login-sheet/miniapp-login-sheet.vue';

export default {
  components: {
    MiniappLoginSheet,
  },
  data() {
    return {
      isLoggedIn: false,
      userInfo: {
        nickname: '',
        registeredPhone: '',
        avatarUrl: '',
      },
      profile: {
        companyName: '',
      },
      reviewStatus: 'UNVERIFIED',
      reviewStatusText,
      walletData: {
        depositBalanceCent: 0,
        depositMinimumCent: 100000,
        infoFeeBalanceCent: 0,
      },
      routeCount: 0,
    };
  },
  computed: {
    displayName() {
      return this.profile.companyName || this.userInfo.nickname || '承运商用户';
    },
    reviewStatusLabel() {
      const map = {
        APPROVED: '已认证',
        PENDING: '审核中',
        REJECTED: '未通过',
      };
      return map[this.reviewStatus] || '未认证';
    },
    isVerificationApproved() {
      return this.reviewStatus === 'APPROVED';
    },
    isDepositLow() {
      return this.isVerificationApproved && Boolean(this.walletData.isDepositBelowMinimum);
    },
    isInfoFeeLow() {
      return this.isVerificationApproved && Boolean(this.walletData.isInfoFeeInsufficient);
    },
    hasWalletRisk() {
      return this.isDepositLow || this.isInfoFeeLow;
    },
    walletWarnText() {
      if (this.isDepositLow && this.isInfoFeeLow) return '保证金不足 · 信息费耗尽';
      if (this.isDepositLow) return '保证金低于最低要求';
      if (this.isInfoFeeLow) return '信息费余额不足';
      if (
        this.walletData.isDepositCheckEnabled === false ||
        this.walletData.isInfoFeeCheckEnabled === false
      ) {
        return '搜索联系限制已关闭';
      }
      return '';
    },
  },
  onShow() {
    this.isLoggedIn = !!getToken();
    if (this.isLoggedIn) {
      this.fetchMe();
      this.fetchWallet();
    } else {
      this.resetData();
    }
  },
  methods: {
    yuanVal(cent) {
      return (Number(cent || 0) / 100).toFixed(2);
    },
    resetData() {
      this.userInfo = {
        nickname: '',
        registeredPhone: '',
        avatarUrl: '',
      };
      this.profile = {
        companyName: '',
      };
      this.reviewStatus = 'UNVERIFIED';
      this.walletData = {
        depositBalanceCent: 0,
        depositMinimumCent: 100000,
        infoFeeBalanceCent: 0,
      };
      this.routeCount = 0;
    },
    ensureLoggedIn(actionText) {
      if (!this.isLoggedIn) {
        // #ifdef MP-WEIXIN
        this.$refs.loginSheet?.open(actionText);
        return false;
        // #endif
        uni.showModal({
          title: '请先登录',
          content: `您当前尚未登录，登录后才可使用${actionText}功能。`,
          confirmText: '去登录',
          cancelText: '暂不登录',
          confirmColor: '#1677ff',
          success: (res) => {
            if (res.confirm) {
              this.goLogin();
            }
          },
        });
        return false;
      }
      return true;
    },
    async fetchMe() {
      try {
        const res = await api.me();
        if (res) {
          this.userInfo = res.user || {};
          this.profile = res.profile || {};
          this.reviewStatus = res.reviewStatus || 'UNVERIFIED';
          if (!this.profile.companyName) {
            const status = await api.verificationStatus({ authRedirect: false });
            this.profile = {
              ...this.profile,
              companyName: status?.companyName || '',
            };
            this.reviewStatus = status?.reviewStatus || this.reviewStatus;
          }
        }
      } catch (error) {
        console.error('获取个人信息失败:', error);
      }
    },
    async fetchWallet() {
      try {
        const res = await api.dashboard();
        if (res && res.wallet) {
          this.walletData = res.wallet;
        }
        if (res && res.routeCounts) {
          this.routeCount = (res.routeCounts.largeTruck || 0) + (res.routeCounts.smallTruck || 0);
        }
      } catch (error) {
        console.error('获取钱包信息失败:', error);
      }
    },
    goVerification() {
      if (!this.ensureLoggedIn('企业资质认证')) return;
      const url =
        this.reviewStatus === 'UNVERIFIED' || this.reviewStatus === 'REJECTED'
          ? '/pages/verification/form'
          : '/pages/verification/status';
      uni.navigateTo({ url });
    },
    goCompanyProfile() {
      if (!this.ensureLoggedIn('企业介绍')) return;
      uni.navigateTo({ url: '/pages/profile/company' });
    },
    goWallet() {
      if (!this.ensureLoggedIn('资金充值与钱包')) return;
      uni.navigateTo({ url: '/pages/wallet/index' });
    },
    goRoutes() {
      if (!this.ensureLoggedIn('线路管理')) return;
      uni.navigateTo({ url: '/pages/route/list' });
    },
    goSettings() {
      if (!this.ensureLoggedIn('系统设置')) return;
      uni.navigateTo({ url: '/pages/account/settings' });
    },
    goLogin() {
      // #ifdef MP-WEIXIN
      this.$refs.loginSheet?.open('登录账号');
      return;
      // #endif
      openLoginPrompt({ actionText: '登录账号' });
    },
    async handleLoginSuccess() {
      this.isLoggedIn = true;
      await Promise.all([this.fetchMe(), this.fetchWallet()]);
    },
  },
};
</script>

<style>
.account-page {
  padding: 0;
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, #1a6fef 0%, #1a6fef 280rpx, #f5f7fa 280rpx);
}

/* ---- Profile Header ---- */
.profile-header {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 60rpx 32rpx 36rpx;
}

.avatar-wrap {
  width: 108rpx;
  height: 108rpx;
  border-radius: 50%;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.2);
  border: 4rpx solid rgba(255, 255, 255, 0.5);
  flex-shrink: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
}

.profile-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.profile-name-row {
  min-width: 0;
}

.nickname {
  font-size: 36rpx;
  font-weight: 800;
  color: #ffffff;
  line-height: 1.2;
  min-width: 0;
  max-width: 360rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.verify-badge {
  display: inline-flex;
  align-items: center;
  height: 36rpx;
  padding: 0 14rpx;
  border-radius: 18rpx;
  font-size: 20rpx;
  font-weight: 700;
  flex-shrink: 0;
}

.verify-badge.approved {
  background: rgba(22, 163, 74, 0.2);
  color: #bbf7d0;
}

.verify-badge.pending {
  background: rgba(217, 119, 6, 0.2);
  color: #fde68a;
}

.verify-badge.rejected {
  background: rgba(220, 38, 38, 0.2);
  color: #fca5a5;
}

.verify-badge.unverified {
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.7);
}

.phone-text {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
}

.header-arrow {
  width: 30rpx;
  height: 30rpx;
  opacity: 0.75;
  flex-shrink: 0;
}

/* ---- Wallet Card ---- */
.wallet-card {
  position: relative;
  margin: 0 24rpx 24rpx;
  padding: 28rpx 32rpx;
  border-radius: 20rpx;
  background: #ffffff;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.wallet-card-bg {
  position: absolute;
  top: -40rpx;
  right: -40rpx;
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
  background: rgba(22, 119, 255, 0.04);
}

.wallet-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.wallet-title-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.wallet-title-icon {
  width: 34rpx;
  height: 34rpx;
}

.wallet-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #111827;
}

.wallet-link-row {
  display: flex;
  align-items: center;
  gap: 6rpx;
}

.wallet-link-text {
  font-size: 24rpx;
  color: #1677ff;
  font-weight: 600;
}

.wallet-link-arrow {
  width: 24rpx;
  height: 24rpx;
}

.wallet-balance-row {
  display: flex;
  align-items: center;
}

.balance-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.balance-label {
  font-size: 22rpx;
  color: #9ca3af;
}

.balance-value {
  font-size: 44rpx;
  font-weight: 800;
  color: #111827;
  font-family:
    'DIN Alternate',
    -apple-system,
    sans-serif;
}

.balance-value.warn {
  color: #dc2626;
}

.balance-divider {
  width: 1rpx;
  height: 60rpx;
  background: #e5e7eb;
  flex-shrink: 0;
}

.wallet-status-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-top: 20rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #f3f4f6;
}

.wallet-status-icon {
  width: 28rpx;
  height: 28rpx;
  flex-shrink: 0;
}

.wallet-status-warn {
  font-size: 22rpx;
  color: #dc2626;
  font-weight: 600;
}

/* ---- Certification Banner ---- */
.cert-banner {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin: 0 24rpx 24rpx;
  padding: 24rpx 28rpx;
  background: #fffbeb;
  border-radius: 16rpx;
  border: 1rpx solid #fde68a;
}

.cert-icon {
  width: 38rpx;
  height: 38rpx;
  flex-shrink: 0;
}

.cert-text-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.cert-title {
  font-size: 26rpx;
  font-weight: 700;
  color: #92400e;
}

.cert-desc {
  font-size: 22rpx;
  color: #a16207;
}

.cert-arrow {
  width: 28rpx;
  height: 28rpx;
  flex-shrink: 0;
}

/* ---- Menu Groups (Cell List) ---- */
.menu-group {
  margin: 0 24rpx 24rpx;
  background: #ffffff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.03);
}

.menu-group-title {
  padding: 20rpx 28rpx 0;
  font-size: 22rpx;
  color: #9ca3af;
  font-weight: 600;
}

.cell-item {
  display: flex;
  align-items: center;
  padding: 28rpx 28rpx;
  border-bottom: 1rpx solid #f5f5f5;
  position: relative;
}

.cell-item:active {
  background: #f9fafb;
}

.cell-item.last {
  border-bottom: none;
}

.cell-icon {
  width: 38rpx;
  height: 38rpx;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.cell-label {
  flex: 1;
  font-size: 28rpx;
  color: #111827;
  font-weight: 500;
}

.cell-right {
  display: flex;
  align-items: center;
  gap: 8rpx;
  flex-shrink: 0;
}

.cell-desc {
  font-size: 24rpx;
  color: #9ca3af;
}

.cell-status {
  font-size: 24rpx;
  font-weight: 600;
}

.text-success {
  color: #16a34a;
}

.text-warning {
  color: #d97706;
}

.text-danger {
  color: #dc2626;
}

.cell-arrow {
  width: 28rpx;
  height: 28rpx;
}

/* ---- Logout ---- */
.logout-wrap {
  margin: 40rpx 24rpx 0;
}

.logout-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  font-size: 28rpx;
  font-weight: 600;
  color: #dc2626;
  background: #ffffff;
  border-radius: 16rpx;
  border: none;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.03);
}

.logout-btn:active {
  background: #fef2f2;
}

.guest-login-btn-wrap {
  flex-shrink: 0;
}

.guest-btn {
  min-height: 54rpx !important;
  height: 54rpx !important;
  padding: 0 24rpx !important;
  font-size: 24rpx !important;
  border-radius: 27rpx !important;
  background: #ffffff !important;
  color: #1a6fef !important;
  box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.1) !important;
  font-weight: 800 !important;
}

.guest-btn:active {
  opacity: 0.9;
}
</style>
