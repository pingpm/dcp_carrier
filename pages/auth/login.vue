<template>
  <view class="page login-page">
    <view class="login-hero">
      <view class="brand-mark">
        <image class="brand-icon" src="/static/icons/truck.svg" mode="aspectFit" />
      </view>
      <view class="login-title">承运商登录</view>
      <!-- #ifdef MP-WEIXIN -->
      <view class="login-subtitle">微信手机号授权后可直接进入工作台</view>
      <!-- #endif -->
      <!-- #ifndef MP-WEIXIN -->
      <view class="login-subtitle">接收订单、维护线路、处理履约节点</view>
      <!-- #endif -->
    </view>

    <view class="login-form">
      <!-- #ifdef MP-WEIXIN -->
      <button
        class="primary-btn login-btn wechat-login-btn"
        open-type="getPhoneNumber"
        :loading="wechatLoading"
        :disabled="wechatLoading || loading"
        @getphonenumber="wechatPhoneLogin"
      >
        微信手机号快捷登录
      </button>
      <!-- #endif -->

      <!-- #ifndef MP-WEIXIN -->
      <view class="field">
        <text class="label">手机号码</text>
        <view class="input-wrapper">
          <text class="phone-prefix">+86</text>
          <input
            class="input phone-input"
            v-model="phone"
            type="number"
            maxlength="11"
            placeholder="请输入您的手机号"
            placeholder-class="placeholder-style"
          />
        </view>
      </view>

      <view class="field">
        <text class="label">验证码</text>
        <view class="input-wrapper code-wrapper">
          <input
            class="input code-input"
            v-model="verificationCode"
            type="number"
            maxlength="6"
            placeholder="请输入 6 位验证码"
            placeholder-class="placeholder-style"
          />
          <button class="code-btn" :disabled="codeLoading || countdown > 0" @click="sendCode">
            {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
          </button>
        </view>
        <view class="code-tip">验证码 10 分钟内有效，请注意查收短信</view>
      </view>

      <button class="primary-btn login-btn" :loading="loading" @click="login">登录 / 注册</button>
      <!-- #endif -->

      <view class="agreement-wrapper">
        <label class="agreement-checkbox" @click="toggleAgreement">
          <checkbox
            :checked="agreementAccepted"
            color="#1677ff"
            style="transform: scale(0.7)"
            @click.stop="toggleAgreement"
          />
          <text class="agreement-text">
            我已阅读并同意
            <text class="agreement-link" @click.stop="openAgreement('terms')">《注册协议》</text>与
            <text class="agreement-link" @click.stop="openAgreement('privacy')">《隐私协议》</text>
          </text>
        </label>
      </view>
    </view>

    <view class="login-footnote">{{ loginFootnote }}</view>
  </view>
</template>

<script>
import { api, miniappLoginCode, setSession } from '../../utils/api.js';
import { goAfterLogin } from '../../utils/navigation.js';

export default {
  data() {
    return {
      phone: '',
      verificationCode: '',
      loading: false,
      wechatLoading: false,
      codeLoading: false,
      countdown: 0,
      countdownTimer: null,
      agreementAccepted: true,
      // #ifdef MP-WEIXIN
      loginFootnote: '微信手机号授权后自动创建承运商账号',
      // #endif
      // #ifndef MP-WEIXIN
      loginFootnote: '新手机号验证后自动创建承运商账号',
      // #endif
    };
  },
  onUnload() {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
  },
  methods: {
    validatePhone() {
      if (!/^1\d{10}$/.test(this.phone)) {
        uni.showToast({ title: '请输入 11 位有效手机号', icon: 'none' });
        return false;
      }
      return true;
    },
    validateAgreement() {
      if (!this.agreementAccepted) {
        uni.showToast({ title: '请先勾选注册协议和隐私协议', icon: 'none' });
        return false;
      }
      return true;
    },
    toggleAgreement() {
      this.agreementAccepted = !this.agreementAccepted;
    },
    openAgreement(type) {
      uni.navigateTo({ url: `/pages/agreement/detail?type=${type}` });
    },
    async sendCode() {
      if (!this.validatePhone() || this.countdown > 0) return;
      this.codeLoading = true;
      try {
        const data = await api.sendLoginCode(this.phone);
        let title = '验证码短信已发送';
        if (data.isRegistered === false) {
          title += '（新手机号登录将自动注册）';
        }
        uni.showToast({ title, icon: 'none' });
        this.countdown = 60;
        this.countdownTimer = setInterval(() => {
          this.countdown -= 1;
          if (this.countdown <= 0 && this.countdownTimer) {
            clearInterval(this.countdownTimer);
            this.countdownTimer = null;
          }
        }, 1000);
      } finally {
        this.codeLoading = false;
      }
    },
    async login() {
      if (!this.validateAgreement()) {
        return;
      }
      if (!this.validatePhone()) {
        return;
      }
      if (!/^\d{6}$/.test(this.verificationCode)) {
        uni.showToast({ title: '请输入 6 位验证码', icon: 'none' });
        return;
      }
      this.loading = true;
      try {
        const wxCode = await miniappLoginCode();
        const data = wxCode
          ? await api.loginWithWechatCode(this.phone, this.verificationCode, wxCode)
          : await api.login(this.phone, this.verificationCode);
        setSession(data);
        goAfterLogin(data);
      } finally {
        this.loading = false;
      }
    },
    async wechatPhoneLogin(event) {
      if (!this.validateAgreement()) {
        return;
      }
      const detail = event.detail || {};
      if (detail.errMsg && !detail.errMsg.includes('ok')) {
        uni.showToast({ title: '请授权手机号后登录', icon: 'none' });
        return;
      }
      if (!detail.code) {
        uni.showToast({ title: '微信未返回手机号授权凭证', icon: 'none' });
        return;
      }
      this.wechatLoading = true;
      try {
        const wxCode = await miniappLoginCode();
        const data = await api.wechatPhoneLogin(detail.code, wxCode);
        setSession(data);
        goAfterLogin(data);
      } finally {
        this.wechatLoading = false;
      }
    },
  },
};
</script>

<style>
.login-page {
  min-height: 100vh;
  padding: 86rpx 44rpx 40rpx;
  background: #ffffff;
}

.login-hero {
  margin-bottom: 58rpx;
}

.brand-mark {
  width: 88rpx;
  height: 88rpx;
  border-radius: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eff6ff;
  border: 1rpx solid #dbeafe;
  margin-bottom: 28rpx;
}

.brand-icon {
  width: 50rpx;
  height: 50rpx;
}

.login-title {
  color: #111827;
  font-size: 44rpx;
  font-weight: 800;
  line-height: 1.2;
}

.login-subtitle {
  color: #4b5563;
  font-size: 26rpx;
  margin-top: 14rpx;
}

.login-form {
  width: 100%;
}

.wechat-login-btn {
  margin-bottom: 28rpx;
}

.input-wrapper {
  display: flex;
  align-items: center;
  border: 1rpx solid #e5e7eb;
  border-radius: 10rpx;
  background: #ffffff;
  overflow: hidden;
  transition: all 0.2s ease;
}

.input-wrapper:focus-within {
  border-color: #1677ff;
  background: #ffffff;
}

.phone-prefix {
  padding: 0 24rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: #374151;
  border-right: 1rpx solid #e5e7eb;
}

.phone-input {
  flex: 1;
  border: none !important;
  background: transparent !important;
}

.code-wrapper {
  padding-right: 8rpx;
}

.code-input {
  flex: 1;
  border: none !important;
  background: transparent !important;
}

.code-btn {
  flex-shrink: 0;
  min-width: 190rpx;
  height: 72rpx;
  margin: 0;
  padding: 0 18rpx;
  border: 0;
  border-radius: 10rpx;
  background: #e0efff;
  color: #1677ff;
  font-size: 24rpx;
  font-weight: 700;
  line-height: 72rpx;
}

.code-btn[disabled] {
  background: #f3f4f6;
  color: #9ca3af;
}

.code-tip {
  margin-top: 12rpx;
  color: #94a3b8;
  font-size: 22rpx;
}

.placeholder-style {
  color: #9ca3af;
}

.login-btn {
  margin-top: 44rpx;
  width: 100%;
  min-height: 92rpx;
  border-radius: 12rpx;
}

.agreement-wrapper {
  margin-top: 30rpx;
  display: flex;
  justify-content: flex-start;
}

.agreement-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 8rpx;
}

.agreement-text {
  font-size: 22rpx;
  color: #6b7280;
  line-height: 1.5;
  margin-top: 2rpx;
}

.agreement-link {
  color: #1677ff;
  font-weight: bold;
}

.login-footnote {
  position: fixed;
  left: 0;
  right: 0;
  bottom: calc(28rpx + env(safe-area-inset-bottom));
  text-align: center;
  color: #94a3b8;
  font-size: 22rpx;
}
</style>
