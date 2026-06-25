<template>
  <view class="page proof-page">
    <view class="section type-section">
      <view class="section-title">充值类型 <text class="required">*</text></view>
      <view class="type-list">
        <view
          class="type-card"
          :class="{ active: walletType === 'DEPOSIT' }"
          @click="setWalletType('DEPOSIT')"
        >
          <text class="radio-icon-box">{{ walletType === 'DEPOSIT' ? '●' : '' }}</text>
          <view class="type-copy">
            <text class="type-title">保证金账户</text>
            <text class="type-desc">转账审核通过后入账到保证金余额。</text>
          </view>
        </view>
        <view
          class="type-card"
          :class="{ active: walletType === 'INFO_FEE' }"
          @click="setWalletType('INFO_FEE')"
        >
          <text class="radio-icon-box">{{ walletType === 'INFO_FEE' ? '●' : '' }}</text>
          <view class="type-copy">
            <text class="type-title">信息服务费账户</text>
            <text class="type-desc">转账审核通过后入账到信息服务费余额。</text>
          </view>
        </view>
      </view>
    </view>

    <view class="section proof-section">
      <view class="proof-head">
        <text class="proof-title">转账凭证 <text class="required">*</text></text>
        <text class="proof-desc">请上传银行回单或转账截图</text>
      </view>
      <view v-if="offlineProof.fileUrl" class="proof-preview">
        <image class="proof-image" :src="offlineProof.fileUrl" mode="aspectFill" @click="previewProof" />
        <button class="remove-proof-btn" @click="removeProof">移除</button>
      </view>
      <button v-else class="upload-proof-btn" :loading="uploadingProof" @click="chooseProof">
        上传凭证
      </button>

      <view class="field proof-remark-field">
        <text class="label">备注</text>
        <textarea
          class="textarea"
          v-model="offlineRemark"
          placeholder="可填写银行流水号或补充说明"
          placeholder-style="color:#9ca3af"
        />
      </view>
    </view>

    <view class="fixed-footer">
      <button class="primary-btn animate-btn w-full" :loading="submitting" @click="submit">
        提交转账凭证
      </button>
    </view>
    <miniapp-login-sheet ref="loginSheet" @success="handleLoginSuccess" />
  </view>
</template>

<script>
import { miniappLoginPageMixin } from '../../utils/miniapp-login-page.js';
import { api, requireLogin, uploadFile } from '../../utils/api.js';

const defaultRechargeConfig = {
  methods: {
    DEPOSIT: { wechatEnabled: true, offlineEnabled: false },
    INFO_FEE: { wechatEnabled: true, offlineEnabled: false },
  },
};

export default {
  mixins: [miniappLoginPageMixin],
  data() {
    return {
      walletType: 'DEPOSIT',
      rechargeConfig: defaultRechargeConfig,
      offlineProof: {
        fileId: '',
        fileUrl: '',
      },
      offlineRemark: '',
      uploadingProof: false,
      submitting: false,
    };
  },
  computed: {
    currentMethods() {
      return this.rechargeConfig.methods[this.walletType] || {
        wechatEnabled: false,
        offlineEnabled: false,
      };
    },
    walletTypeLabel() {
      return this.walletType === 'DEPOSIT' ? '保证金' : '信息服务费';
    },
  },
  async onLoad(options) {
    if (!requireLogin()) return;
    if (options.type) this.walletType = options.type;
    await this.loadRechargeConfig();
  },
  methods: {
    setWalletType(type) {
      this.walletType = type;
    },
    async loadRechargeConfig() {
      try {
        const wallet = await api.walletIndex();
        this.rechargeConfig = wallet.rechargeConfig || defaultRechargeConfig;
        if (!this.currentMethods.offlineEnabled) {
          uni.showToast({ title: '当前账户未开启对公转账', icon: 'none' });
        }
      } catch (err) {
        console.error(err);
      }
    },
    chooseProof() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed', 'original'],
        sourceType: ['album', 'camera'],
        success: async (res) => {
          const filePath = res.tempFilePaths && res.tempFilePaths[0];
          if (!filePath) return;
          this.uploadingProof = true;
          try {
            const file = await uploadFile(filePath, 'IMAGE', 'OFFLINE_RECHARGE_PROOF');
            this.offlineProof = {
              fileId: file.fileId || file.id,
              fileUrl: file.fileUrl,
            };
          } catch (err) {
            console.error(err);
          } finally {
            this.uploadingProof = false;
          }
        },
      });
    },
    previewProof() {
      if (!this.offlineProof.fileUrl) return;
      uni.previewImage({ urls: [this.offlineProof.fileUrl] });
    },
    removeProof() {
      this.offlineProof = { fileId: '', fileUrl: '' };
    },
    async submit() {
      if (!this.currentMethods.offlineEnabled) {
        uni.showToast({ title: '当前账户未开启对公转账', icon: 'none' });
        return;
      }
      if (!this.offlineProof.fileId) {
        uni.showToast({ title: '请上传转账凭证', icon: 'none' });
        return;
      }
      this.submitting = true;
      try {
        await api.offlineRecharge({
          walletType: this.walletType,
          proofFileId: this.offlineProof.fileId,
          remark: this.offlineRemark,
        });
        uni.showModal({
          title: '凭证已提交',
          content: '平台财务将在核实到账后填写入账金额并完成审核，您可在充值记录中查看进度。',
          showCancel: false,
          success: () => {
            uni.redirectTo({ url: '/pages/wallet/recharge-records?mode=offline' });
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
.proof-page {
  padding: 24rpx;
  padding-bottom: calc(150rpx + env(safe-area-inset-bottom));
}

.type-section,
.proof-section {
  padding: 24rpx;
}

.upload-proof-btn::after,
.remove-proof-btn::after {
  border: none;
}

.type-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.type-card {
  min-height: 116rpx;
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 22rpx;
  box-sizing: border-box;
  border: 1rpx solid #e5e7eb;
  border-radius: 12rpx;
  background: #ffffff;
}

.type-card.active {
  border-color: #2563eb;
  background: #eff6ff;
}

.radio-icon-box {
  width: 34rpx;
  height: 34rpx;
  line-height: 30rpx;
  text-align: center;
  border: 2rpx solid #cbd5e1;
  border-radius: 999rpx;
  color: #2563eb;
  font-size: 22rpx;
  flex-shrink: 0;
}

.type-card.active .radio-icon-box {
  border-color: #2563eb;
}

.type-copy {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  min-width: 0;
}

.type-title {
  color: #111827;
  font-size: 28rpx;
  font-weight: 800;
}

.type-desc {
  color: #64748b;
  font-size: 24rpx;
  line-height: 1.4;
}

.proof-section {
  border: 1rpx solid #dbeafe;
  background: #f8fbff;
}

.proof-head {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-bottom: 18rpx;
}

.proof-title {
  color: #111827;
  font-size: 28rpx;
  font-weight: 800;
}

.proof-desc {
  color: #64748b;
  font-size: 24rpx;
}

.upload-proof-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 12rpx;
  background: #eff6ff;
  color: #2563eb;
  font-size: 26rpx;
  font-weight: 700;
}

.proof-preview {
  display: flex;
  align-items: center;
  gap: 18rpx;
}

.proof-image {
  width: 160rpx;
  height: 160rpx;
  border-radius: 12rpx;
  background: #e5e7eb;
  flex-shrink: 0;
}

.remove-proof-btn {
  min-width: 108rpx;
  height: 56rpx;
  line-height: 56rpx;
  border-radius: 10rpx;
  background: #fee2e2;
  color: #dc2626;
  font-size: 24rpx;
}

.proof-remark-field {
  margin-top: 24rpx;
}

.textarea {
  min-height: 220rpx;
  width: 100%;
  box-sizing: border-box;
  padding: 18rpx;
  border-radius: 12rpx;
  border: 1rpx solid #e5e7eb;
  background: #ffffff;
  color: #111827;
  font-size: 26rpx;
  line-height: 1.45;
}

.required {
  color: #ef4444;
  margin-left: 6rpx;
  font-weight: bold;
}
</style>
