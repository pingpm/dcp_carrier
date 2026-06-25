<template>
  <view class="page info-fee-deductions-page">
    <view class="empty" v-if="deductions.length === 0"> 暂无信息费扣除记录 </view>
    <view v-else class="deductions-list">
      <view
        class="section deduction-card"
        v-for="item in deductions"
        :key="item.id"
        @click="goOrder(item.relatedOrderId)"
      >
        <view class="row-between card-header">
          <text class="order-no-font">关联订单号: {{ item.relatedOrderNo || '-' }}</text>
          <text class="status-tag status-danger font-bold">- {{ yuanText(item.amountCent) }}</text>
        </view>
        <view class="detail-grid-info">
          <view class="detail-row">
            <text class="detail-label">扣除前余额</text>
            <text class="detail-value">{{ yuanText(item.beforeBalanceCent) }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">扣除后余额</text>
            <text class="detail-value font-bold">{{ yuanText(item.afterBalanceCent) }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">扣减时间</text>
            <text class="detail-value">{{ dateText(item.createdAt) }}</text>
          </view>
          <view class="detail-row" v-if="item.remark">
            <text class="detail-label">备注说明</text>
            <text class="detail-value">{{ item.remark }}</text>
          </view>
        </view>
      </view>
    </view>
    <miniapp-login-sheet ref="loginSheet" @success="handleLoginSuccess" />
  </view>
</template>

<script>
import { miniappLoginPageMixin } from '../../utils/miniapp-login-page.js';
import { api, requireLogin } from '../../utils/api.js';
import { dateText, yuanText } from '../../utils/format.js';

export default {
  mixins: [miniappLoginPageMixin],
  data() {
    return {
      deductions: [],
    };
  },
  onShow() {
    if (requireLogin()) this.load();
  },
  methods: {
    dateText,
    yuanText,
    async load() {
      try {
        const res = await api.infoFeeDeductions();
        this.deductions = res.records || res.items || [];
      } catch (err) {
        console.error(err);
      }
    },
    goOrder(orderId) {
      if (orderId) {
        uni.navigateTo({ url: `/pages/order/detail?orderId=${orderId}` });
      }
    },
  },
};
</script>

<style>
.info-fee-deductions-page {
  padding: 24rpx;
}

.deduction-card {
  padding: 28rpx;
  margin-bottom: 20rpx;
  border: 1rpx solid rgba(229, 231, 235, 0.5);
  transition: all 0.2s ease;
}

.deduction-card:active {
  background-color: #f9fafb;
}

.card-header {
  border-bottom: 1rpx solid #f1f5f9;
  padding-bottom: 16rpx;
  margin-bottom: 20rpx;
}

.order-no-font {
  font-size: 24rpx;
  color: #111827;
  font-weight: bold;
}

.detail-grid-info {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  font-size: 24rpx;
}

.detail-label {
  color: #9ca3af;
}

.detail-value {
  color: #4b5563;
}
</style>
