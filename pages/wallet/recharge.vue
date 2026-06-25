<template>
  <view class="page wallet-recharge-page">
    <view class="form-header">
      <view class="form-header-title">钱包充值</view>
      <view class="form-header-desc">选择充值账户，按当前可用方式完成入账。</view>
    </view>

    <!-- Account selection -->
    <view class="section">
      <view class="section-title">账户选择 <text class="required">*</text></view>
      <view class="grid-two">
        <view
          class="check-row"
          :class="{ checked: form.walletType === 'DEPOSIT' }"
          @click="setWalletType('DEPOSIT')"
        >
          <text class="radio-icon-box">{{ form.walletType === 'DEPOSIT' ? '●' : '' }}</text>
          <view class="wallet-type-copy">
            <text class="wallet-type-title">保证金账户</text>
            <text class="wallet-type-desc">平台履约保障，账号注销或业务结清后可按规则退还。</text>
          </view>
        </view>
        <view
          class="check-row"
          :class="{ checked: form.walletType === 'INFO_FEE' }"
          @click="setWalletType('INFO_FEE')"
        >
          <text class="radio-icon-box">{{ form.walletType === 'INFO_FEE' ? '●' : '' }}</text>
          <view class="wallet-type-copy">
            <text class="wallet-type-title">信息服务费账户</text>
            <text class="wallet-type-desc">确认接单时扣除信息服务费，每成交一单扣除一次。</text>
          </view>
        </view>
      </view>
    </view>

    <view class="section">
      <view class="section-title">支付方式</view>
      <view class="pay-method-list">
        <view
          v-if="currentMethods.wechatEnabled"
          class="pay-method-item"
          :class="{ selected: payMethod === 'WECHAT' }"
          @click="setPayMethod('WECHAT')"
        >
          <view class="method-left-info">
            <image class="method-icon" src="/static/wxpay_icon.svg" mode="aspectFit" />
            <view class="method-copy">
              <text class="method-lbl">微信支付</text>
              <text class="method-desc">使用微信收银台完成钱包充值</text>
            </view>
          </view>
          <view v-if="payMethod === 'WECHAT'" class="method-selected-badge">
            <text>已选</text>
          </view>
        </view>

        <view
          v-if="currentMethods.offlineEnabled"
          class="pay-method-item offline"
          :class="{ selected: payMethod === 'OFFLINE' }"
          @click="setPayMethod('OFFLINE')"
        >
          <view class="method-left-info">
            <view class="offline-icon">公</view>
            <view class="method-copy">
              <text class="method-lbl">对公转账</text>
              <text class="method-desc">转账后上传凭证，后台审核后入账</text>
            </view>
          </view>
          <view v-if="payMethod === 'OFFLINE'" class="method-selected-badge offline-badge">
            <text>已选</text>
          </view>
        </view>
      </view>
    </view>

    <view v-if="payMethod === 'WECHAT'" class="section">
      <view class="section-title">充值金额 <text class="required">*</text></view>
      <view class="presets-grid">
        <view
          v-for="amt in presets"
          :key="amt"
          class="preset-item font-bold"
          :class="{ active: amountYuan === String(amt) }"
          @click="selectPreset(amt)"
        >
          {{ amt }}元
        </view>
      </view>

      <view class="field" style="margin-top: 30rpx">
        <text class="label">自定义充值金额 (元)</text>
        <input
          class="input"
          v-model="amountYuan"
          type="digit"
          placeholder="请输入充值金额"
          placeholder-style="color:#9ca3af"
        />
      </view>
    </view>

    <view v-if="payMethod === 'OFFLINE'" class="section offline-account-section">
      <view class="section-title">对公转账信息</view>
      <view class="offline-tip">
        <text>请通过企业账户转账至以下对公账户，转账完成后上传凭证。后台财务审核并填写入账金额后，会增加您的{{ walletTypeLabel }}账户余额。</text>
      </view>

      <view class="account-row">
        <text class="account-label">户名</text>
        <text class="account-value" selectable>{{ offlineAccount.accountName || '-' }}</text>
        <button class="copy-btn" @click="copyText(offlineAccount.accountName)">复制</button>
      </view>
      <view class="account-row">
        <text class="account-label">开户行</text>
        <text class="account-value" selectable>{{ offlineAccount.bankName || '-' }}</text>
        <button class="copy-btn" @click="copyText(offlineAccount.bankName)">复制</button>
      </view>
      <view v-if="offlineAccount.bankBranch" class="account-row">
        <text class="account-label">开户支行</text>
        <text class="account-value" selectable>{{ offlineAccount.bankBranch }}</text>
        <button class="copy-btn" @click="copyText(offlineAccount.bankBranch)">复制</button>
      </view>
      <view class="account-row">
        <text class="account-label">账号</text>
        <text class="account-value mono" selectable>{{ offlineAccount.accountNo || '-' }}</text>
        <button class="copy-btn" @click="copyText(offlineAccount.accountNo)">复制</button>
      </view>
      <view class="account-row">
        <text class="account-label">客服</text>
        <text class="account-value" selectable>{{ offlineAccount.contact || '-' }}</text>
        <button class="copy-btn" @click="copyText(offlineAccount.contact)">复制</button>
      </view>

      <view class="remark-box">
        <view class="remark-head-row">
          <text class="remark-label">转账备注信息</text>
          <button class="copy-remark-btn" @click="copyText(transferInfoText)">复制全部</button>
        </view>
        <text v-if="offlineAccount.transferRemark" class="remark-text" selectable>
          {{ offlineAccount.transferRemark }}
        </text>
        <view class="remark-info-list">
          <view class="remark-info-row">
            <text class="remark-info-label">企业名称</text>
            <text class="remark-info-value" selectable>{{ transferCompanyName }}</text>
            <button class="copy-btn compact-copy-btn" @click="copyText(transferCompanyName)">复制</button>
          </view>
          <view class="remark-info-row">
            <text class="remark-info-label">注册手机号</text>
            <text class="remark-info-value mono" selectable>{{ transferRegisteredPhone }}</text>
            <button class="copy-btn compact-copy-btn" @click="copyText(transferRegisteredPhone)">复制</button>
          </view>
          <view class="remark-info-row">
            <text class="remark-info-label">充值类型</text>
            <text class="remark-info-value" selectable>{{ walletTypeLabel }}账户</text>
            <button class="copy-btn compact-copy-btn" @click="copyText(`${walletTypeLabel}账户`)">复制</button>
          </view>
        </view>
      </view>

    </view>

    <view v-if="!currentMethods.wechatEnabled && !currentMethods.offlineEnabled" class="section unavailable-section">
      <text>当前账户暂未开放充值方式，请联系平台客服。</text>
    </view>

    <view v-if="payMethod" class="fixed-footer">
      <button class="primary-btn animate-btn w-full" :loading="submitting" @click="submit">
        {{ payMethod === 'WECHAT' ? '微信支付充值' : '已完成转账？上传凭证' }}
      </button>
    </view>
    <miniapp-login-sheet ref="loginSheet" @success="handleLoginSuccess" />
  </view>
</template>

<script>
import { miniappLoginPageMixin } from '../../utils/miniapp-login-page.js';
import { api, requestWechatPayment, requireLogin } from '../../utils/api.js';
import { yuanToCent } from '../../utils/format.js';

const defaultRechargeConfig = {
  methods: {
    DEPOSIT: { wechatEnabled: true, offlineEnabled: false },
    INFO_FEE: { wechatEnabled: true, offlineEnabled: false },
  },
  offlineAccount: {
    accountName: '',
    bankName: '',
    bankBranch: '',
    accountNo: '',
    transferRemark: '',
    contact: '',
  },
};

export default {
  mixins: [miniappLoginPageMixin],
  data() {
    return {
      presets: [100, 500, 1000, 2000, 5000],
      amountYuan: '1000',
      form: {
        walletType: 'DEPOSIT',
        amountCent: 0,
      },
      payMethod: 'WECHAT',
      rechargeConfig: defaultRechargeConfig,
      transferProfile: {
        companyName: '',
        registeredPhone: '',
      },
      submitting: false,
    };
  },
  computed: {
    currentMethods() {
      return this.rechargeConfig.methods[this.form.walletType] || {
        wechatEnabled: false,
        offlineEnabled: false,
      };
    },
    offlineAccount() {
      return this.rechargeConfig.offlineAccount || defaultRechargeConfig.offlineAccount;
    },
    walletTypeLabel() {
      return this.form.walletType === 'DEPOSIT' ? '保证金' : '信息服务费';
    },
    transferCompanyName() {
      return this.transferProfile.companyName || '未获取到企业名称';
    },
    transferRegisteredPhone() {
      return this.transferProfile.registeredPhone || '未获取到注册手机号';
    },
    transferInfoText() {
      return [
        `企业名称：${this.transferCompanyName}`,
        ` 注册手机号：${this.transferRegisteredPhone}`,
        ` 充值类型：${this.walletTypeLabel}账户`,
      ].join('');
    },
  },
  async onLoad(options) {
    if (!requireLogin()) return;
    if (options.type) {
      this.form.walletType = options.type;
    }
    await Promise.all([this.loadRechargeConfig(), this.loadTransferProfile()]);
  },
  methods: {
    async loadTransferProfile() {
      try {
        const res = await api.me({ authRedirect: false, silent: true });
        let companyName = res?.profile?.companyName || res?.user?.nickname || '';
        let registeredPhone = res?.profile?.registeredPhone || res?.user?.registeredPhone || '';
        if (!companyName || !registeredPhone) {
          try {
            const status = await api.verificationStatus({ authRedirect: false, silent: true });
            companyName = companyName || status?.companyName || '';
            registeredPhone = registeredPhone || status?.registeredPhone || '';
          } catch (err) {}
        }
        this.transferProfile = {
          companyName,
          registeredPhone,
        };
      } catch (err) {
        this.transferProfile = { companyName: '', registeredPhone: '' };
      }
    },
    async loadRechargeConfig() {
      try {
        const wallet = await api.walletIndex();
        this.rechargeConfig = wallet.rechargeConfig || defaultRechargeConfig;
        this.ensurePayMethod();
      } catch (err) {
        console.error(err);
        this.ensurePayMethod();
      }
    },
    ensurePayMethod() {
      if (this.payMethod === 'WECHAT' && this.currentMethods.wechatEnabled) return;
      if (this.payMethod === 'OFFLINE' && this.currentMethods.offlineEnabled) return;
      if (this.currentMethods.wechatEnabled) {
        this.payMethod = 'WECHAT';
      } else if (this.currentMethods.offlineEnabled) {
        this.payMethod = 'OFFLINE';
      } else {
        this.payMethod = '';
      }
    },
    setWalletType(type) {
      this.form.walletType = type;
      this.ensurePayMethod();
    },
    setPayMethod(method) {
      this.payMethod = method;
    },
    selectPreset(amt) {
      this.amountYuan = String(amt);
    },
    copyText(text) {
      const content = String(text || '').trim();
      if (!content) {
        uni.showToast({ title: '暂无可复制内容', icon: 'none' });
        return;
      }
      uni.setClipboardData({
        data: content,
        success: () => {
          uni.showToast({ title: '已复制', icon: 'none' });
        },
        fail: (err) => {
          console.error('copy clipboard failed', err);
          uni.showToast({ title: '复制失败，请长按文字复制', icon: 'none' });
        },
      });
    },
    validate() {
      if (this.payMethod !== 'WECHAT') return false;
      const cent = yuanToCent(this.amountYuan);
      if (!cent || cent <= 0) {
        uni.showToast({ title: '请输入有效的充值金额', icon: 'none' });
        return false;
      }
      this.form.amountCent = cent;
      return true;
    },
    goOfflineProof() {
      if (!this.currentMethods.offlineEnabled) {
        uni.showToast({ title: '当前账户未开启对公转账', icon: 'none' });
        return;
      }
      uni.navigateTo({ url: `/pages/wallet/offline-recharge-proof?type=${this.form.walletType}` });
    },
    async submit() {
      if (this.payMethod === 'OFFLINE') {
        this.goOfflineProof();
        return;
      }
      if (!this.currentMethods.wechatEnabled) {
        uni.showToast({ title: '当前账户未开启微信支付', icon: 'none' });
        return;
      }
      if (!this.validate()) return;
      this.submitting = true;
      try {
        const res = await api.recharge(this.form);
        try {
          await requestWechatPayment(res.paymentParams);
        } catch (err) {
          uni.showToast({ title: '充值单已创建，待支付', icon: 'none' });
          return;
        }

        try {
          await api.syncWechatPayment(res.paymentId);
        } catch (err) {
          uni.showToast({ title: '支付已完成，正在等待确认', icon: 'none' });
          return;
        }
        uni.showModal({
          title: '支付充值成功',
          content: `已成功向您的【${this.form.walletType === 'DEPOSIT' ? '保证金' : '信息服务费'}】账户充值 ${this.amountYuan} 元。`,
          showCancel: false,
          success: () => {
            uni.navigateBack();
          },
        });
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
.wallet-recharge-page {
  padding: 30rpx;
  padding-bottom: calc(150rpx + env(safe-area-inset-bottom));
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

.wallet-recharge-page .check-row {
  align-items: flex-start;
  padding: 22rpx 24rpx;
}

.wallet-recharge-page .grid-two {
  grid-template-columns: 1fr;
  gap: 16rpx;
}

.wallet-recharge-page .radio-icon-box {
  margin-top: 4rpx;
}

.wallet-type-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.wallet-type-title {
  color: #111827;
  font-size: 28rpx;
  font-weight: 800;
  line-height: 1.25;
}

.checked .wallet-type-title {
  color: #1677ff;
}

.wallet-type-desc {
  color: #64748b;
  font-size: 22rpx;
  font-weight: 500;
  line-height: 1.4;
}

/* Presets */
.presets-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}

.preset-item {
  text-align: center;
  padding: 24rpx 0;
  border-radius: var(--radius-md);
  border: 1rpx solid var(--border-color);
  background: #f9fafb;
  color: #4b5563;
  font-size: 28rpx;
  transition: all 0.2s ease;
}

.preset-item.active {
  background: var(--primary-light);
  border-color: #93c5fd;
  color: var(--primary-color);
}

.pay-method-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.pay-method-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  padding: 24rpx;
  border: 1rpx solid #d7f4dc;
  border-radius: 16rpx;
  background: #f6fff7;
}

.pay-method-item.offline {
  border-color: #dbeafe;
  background: #f8fbff;
}

.pay-method-item.selected {
  box-shadow: 0 10rpx 26rpx rgba(9, 187, 7, 0.08);
}

.pay-method-item.offline.selected {
  box-shadow: 0 10rpx 26rpx rgba(37, 99, 235, 0.08);
}

.method-left-info {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 18rpx;
}

.method-icon {
  width: 56rpx;
  height: 56rpx;
  flex-shrink: 0;
}

.offline-icon {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: #2563eb;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
  font-weight: 800;
  flex-shrink: 0;
}

.method-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.method-lbl {
  font-size: 28rpx;
  color: #111827;
  font-weight: 700;
  line-height: 1.3;
}

.method-desc {
  font-size: 22rpx;
  line-height: 1.35;
  color: #6b7280;
}

.method-selected-badge {
  flex-shrink: 0;
  min-width: 72rpx;
  height: 40rpx;
  padding: 0 14rpx;
  border-radius: 999rpx;
  background: #09bb07;
  color: #ffffff;
  font-size: 20rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.offline-badge {
  background: #2563eb;
}

.offline-account-section {
  padding-bottom: 32rpx;
}

.offline-tip {
  padding: 22rpx;
  border-radius: var(--radius-md);
  background: #f8fafc;
  color: #475569;
  font-size: 24rpx;
  line-height: 1.55;
  margin-bottom: 18rpx;
}

.account-row {
  min-height: 88rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  border-bottom: 1rpx solid #eef2f7;
}

.account-label {
  width: 140rpx;
  flex-shrink: 0;
  color: #64748b;
  font-size: 24rpx;
}

.account-value {
  flex: 1;
  min-width: 0;
  color: #111827;
  font-size: 26rpx;
  line-height: 1.35;
  word-break: break-all;
}

.account-value.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.copy-btn,
.copy-remark-btn {
  flex-shrink: 0;
  min-width: 88rpx;
  height: 48rpx;
  line-height: 48rpx;
  padding: 0 14rpx;
  border-radius: 8rpx;
  background: #f1f5f9;
  color: #2563eb;
  font-size: 22rpx;
}

.copy-btn::after,
.copy-remark-btn::after {
  border: none;
}

.remark-box {
  margin-top: 24rpx;
  padding: 22rpx;
  border-radius: var(--radius-md);
  background: #fff7ed;
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.remark-head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  width: 100%;
}

.remark-label {
  flex: 1;
  color: #9a3412;
  font-size: 24rpx;
  font-weight: 700;
}

.remark-text {
  color: #7c2d12;
  font-size: 24rpx;
  line-height: 1.5;
}

.remark-info-list {
  overflow: hidden;
  border-radius: 12rpx;
  background: rgba(255, 255, 255, 0.72);
  border: 1rpx solid #fed7aa;
}

.remark-info-row {
  min-height: 76rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 0 18rpx;
  border-bottom: 1rpx solid #ffedd5;
}

.remark-info-row:last-child {
  border-bottom: 0;
}

.remark-info-label {
  width: 136rpx;
  flex-shrink: 0;
  color: #9a3412;
  font-size: 23rpx;
}

.remark-info-value {
  flex: 1;
  min-width: 0;
  color: #111827;
  font-size: 24rpx;
  font-weight: 700;
  line-height: 1.35;
  word-break: break-all;
}

.compact-copy-btn {
  min-width: 72rpx !important;
  height: 42rpx !important;
  line-height: 42rpx !important;
  font-size: 20rpx !important;
  background: #ffedd5 !important;
  color: #9a3412 !important;
}

.copy-remark-btn {
  margin-left: auto;
  margin-right: 0;
  min-width: 88rpx;
  height: 44rpx;
  line-height: 44rpx;
  padding: 0 16rpx;
  border-radius: 8rpx;
  color: #9a3412;
  background: #ffedd5;
  font-size: 20rpx;
  flex-shrink: 0;
}

.unavailable-section {
  color: #dc2626;
  font-size: 26rpx;
  line-height: 1.5;
}
</style>
