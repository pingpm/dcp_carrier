<template>
  <view class="page compensation-page">
    <view class="section detail-section-card" v-if="claim.id">
      <view class="section-title">赔付申请</view>
      <view class="detail-grid-info">
        <view class="detail-row">
          <text class="detail-label">订单编号</text>
          <text class="detail-value">{{ claim.orderNo }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">车商</text>
          <text class="detail-value">{{ claim.dealerName }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">约定送达</text>
          <text class="detail-value">{{ dateText(claim.agreedDeliveryTime) }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">交车时间</text>
          <text class="detail-value">{{ dateText(claim.carrierHandoverTime) }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">申请金额</text>
          <text class="detail-value price-highlight">{{ yuanText(claim.requestedCompensationCent) }}</text>
        </view>
      </view>
      <view class="claim-text">{{ claim.dealerClaimText }}</view>
    </view>

    <view class="section detail-section-card">
      <view class="section-title">处理结果</view>
      <view class="segmented">
        <text :class="{ active: handleResult === 'APPROVED' }" @click="handleResult = 'APPROVED'">同意</text>
        <text :class="{ active: handleResult === 'REJECTED' }" @click="handleResult = 'REJECTED'">拒绝</text>
      </view>
      <textarea
        class="textarea"
        v-model="remark"
        maxlength="500"
        :placeholder="handleResult === 'APPROVED' ? '填写赔付说明' : '填写拒绝理由'"
      />
    </view>

    <view class="section detail-section-card" v-if="handleResult === 'APPROVED'">
      <view class="section-title">赔付凭证</view>
      <view class="upload-grid">
        <view class="upload-preview" v-for="(file, index) in proofFiles" :key="file.fileId">
          <image :src="file.fileUrl" class="upload-img" mode="aspectFill" />
          <text class="remove-img" @click="removeProof(index)">×</text>
        </view>
        <view v-if="proofFiles.length < 9" class="upload-add" @click="chooseProof">
          <text class="upload-plus">+</text>
          <text class="upload-add-text">上传</text>
        </view>
      </view>
    </view>

    <view class="fixed-footer">
      <button class="primary-btn w-full" :loading="submitting" @click="submit">提交处理结果</button>
    </view>
    <miniapp-login-sheet ref="loginSheet" @success="handleLoginSuccess" />
  </view>
</template>

<script>
import { miniappLoginPageMixin } from '../../utils/miniapp-login-page.js';
import { api, requireLogin, uploadFile } from '../../utils/api.js';
import { dateText, yuanText } from '../../utils/format.js';

export default {
  mixins: [miniappLoginPageMixin],
  data() {
    return {
      claimId: '',
      claim: {},
      handleResult: 'APPROVED',
      remark: '',
      proofFiles: [],
      submitting: false,
    };
  },
  onLoad(options) {
    if (!requireLogin()) return;
    this.claimId = options.claimId;
    this.load();
  },
  methods: {
    dateText,
    yuanText,
    async load() {
      const data = await api.compensationClaim(this.claimId);
      this.claim = data.claim || {};
    },
    chooseProof() {
      uni.chooseImage({
        count: 9 - this.proofFiles.length,
        sizeType: ['compressed'],
        success: async (res) => {
          for (const path of res.tempFilePaths || []) {
            const file = await uploadFile(path, 'IMAGE', 'COMPENSATION_PROOF');
            this.proofFiles.push(file);
          }
        },
      });
    },
    removeProof(index) {
      this.proofFiles.splice(index, 1);
    },
    async submit() {
      if (!this.remark.trim()) {
        uni.showToast({ title: this.handleResult === 'APPROVED' ? '请填写赔付说明' : '请填写拒绝理由', icon: 'none' });
        return;
      }
      if (this.handleResult === 'APPROVED' && this.proofFiles.length === 0) {
        uni.showToast({ title: '请上传赔付凭证', icon: 'none' });
        return;
      }
      this.submitting = true;
      try {
        await api.handleCompensationClaim(this.claimId, {
          handleResult: this.handleResult,
          carrierHandleText: this.handleResult === 'APPROVED' ? this.remark : undefined,
          rejectReason: this.handleResult === 'REJECTED' ? this.remark : undefined,
          proofFileIds: this.proofFiles.map((file) => file.fileId || file.id),
        });
        uni.showToast({ title: '已处理赔付申请', icon: 'success' });
        setTimeout(() => uni.navigateBack(), 600);
      } finally {
        this.submitting = false;
      }
    },
  },
};
</script>

<style scoped>
.compensation-page {
  padding-bottom: 180rpx;
}
.claim-text {
  margin-top: 20rpx;
  color: #475569;
  line-height: 1.6;
}
.segmented {
  display: flex;
  padding: 6rpx;
  border-radius: 8rpx;
  background: #eef2ff;
  margin-bottom: 20rpx;
}
.segmented text {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  border-radius: 6rpx;
  color: #475569;
}
.segmented .active {
  background: #1677ff;
  color: #fff;
}
.textarea {
  min-height: 200rpx;
  width: 100%;
  box-sizing: border-box;
  padding: 20rpx;
  border-radius: 8rpx;
  background: #f8fafc;
}
.remove-img {
  position: absolute;
  right: -8rpx;
  top: -8rpx;
  width: 36rpx;
  height: 36rpx;
  border-radius: 18rpx;
  background: #ef4444;
  color: #fff;
  text-align: center;
  line-height: 36rpx;
}
</style>
