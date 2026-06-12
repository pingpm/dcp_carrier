<template>
  <view class="page company-profile-page">
    <view class="section header-card">
      <view class="company-avatar">
        <image class="company-avatar-icon" src="/static/icons/building.svg" mode="aspectFit" />
      </view>
      <view class="company-meta">
        <text class="company-name font-bold">{{ profile.companyName || '企业名称未完善' }}</text>
        <view class="status-badge-container">
          <text class="status-tag status-success" v-if="profile.reviewStatus === 'APPROVED'"
            >已认证</text
          >
          <text class="status-tag status-warning" v-else-if="profile.reviewStatus === 'PENDING'"
            >审核中</text
          >
          <text class="status-tag status-danger" v-else-if="profile.reviewStatus === 'REJECTED'"
            >认证驳回</text
          >
          <text class="status-tag" v-else>未认证</text>
        </view>
      </view>
    </view>

    <!-- Basic Info (Read Only) -->
    <view class="section info-section">
      <view class="section-title">工商备案信息</view>

      <view class="info-item">
        <text class="info-label">统一社会信用代码</text>
        <view class="info-val-row">
          <text class="info-value">{{ profile.creditCode || '暂无' }}</text>
          <text class="lock-icon"></text>
        </view>
      </view>

      <view class="info-item">
        <text class="info-label">法定代表人</text>
        <view class="info-val-row">
          <text class="info-value">{{ profile.legalRepresentativeName || '暂无' }}</text>
          <text class="lock-icon"></text>
        </view>
      </view>

      <view class="info-item">
        <text class="info-label">注册手机号</text>
        <view class="info-val-row">
          <text class="info-value">{{ profile.registeredPhone || '暂无' }}</text>
          <text class="lock-icon"></text>
        </view>
      </view>

      <view class="info-item" style="border-bottom: none; padding-bottom: 0; margin-bottom: 0">
        <text class="info-label">联系电话</text>
        <view class="info-val-row">
          <text class="info-value">{{ profile.contactPhone || '暂无' }}</text>
          <text class="lock-icon"></text>
        </view>
      </view>
    </view>

    <!-- Company Description (Editable) -->
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

    <!-- Action Button -->
    <view class="fixed-footer">
      <button class="primary-btn" :loading="saving" @click="saveProfile">保存企业介绍</button>
    </view>
  </view>
</template>

<script>
import { api, requireLogin } from '../../utils/api.js';

export default {
  data() {
    return {
      profile: {
        companyName: '',
        creditCode: '',
        legalRepresentativeName: '',
        registeredPhone: '',
        contactPhone: '',
        reviewStatus: '',
        introduction: '',
      },
      introduction: '',
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
      } catch (error) {
        console.error('获取企业介绍失败:', error);
      } finally {
        uni.hideLoading();
      }
    },
    onInput(e) {
      this.introduction = e.detail.value;
    },
    async saveProfile() {
      try {
        this.saving = true;
        uni.showLoading({ title: '保存中...' });
        await api.saveCompanyProfile({ introduction: this.introduction });
        uni.showToast({ title: '保存成功', icon: 'success' });
        setTimeout(() => {
          uni.navigateBack();
        }, 1500);
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

<script setup></script>

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
}

.company-name {
  font-size: 34rpx;
  color: var(--text-main);
  line-height: 1.2;
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
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f3f4f6;
}

.info-label {
  font-size: 26rpx;
  color: var(--text-muted);
}

.info-val-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.info-value {
  font-size: 26rpx;
  color: var(--text-main);
  font-weight: 500;
}

.lock-icon {
  position: relative;
  width: 22rpx;
  height: 18rpx;
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
</style>
