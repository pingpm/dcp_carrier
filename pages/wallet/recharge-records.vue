<template>
  <view class="page recharge-records-page">
    <!-- Filter tabs -->
    <view class="segmented-control section" style="margin-bottom: 20rpx">
      <view class="segment-item" :class="{ active: activeType === '' }" @click="switchType('')">
        全部充值
      </view>
      <view
        class="segment-item"
        :class="{ active: activeType === 'DEPOSIT' }"
        @click="switchType('DEPOSIT')"
      >
        仅保证金
      </view>
      <view
        class="segment-item"
        :class="{ active: activeType === 'INFO_FEE' }"
        @click="switchType('INFO_FEE')"
      >
        仅信息费
      </view>
    </view>

    <!-- List View -->
    <view class="empty" v-if="records.length === 0"> 暂无符合条件的充值记录 </view>
    <view v-else class="records-list">
      <view class="section record-card" v-for="item in records" :key="item.id">
        <view class="row-between card-header">
          <view class="row align-center">
            <text class="record-type-badge" :class="item.walletType.toLowerCase()">
              {{ walletTypeText[item.walletType] }}
            </text>
            <text class="order-no-font">商户单号: {{ item.merchantOrderNo }}</text>
          </view>
          <text class="status-tag" :class="statusClass(item.paymentStatus)">
            {{ paymentStatusText[item.paymentStatus] }}
          </text>
        </view>

        <view class="record-meta-row row-between align-center">
          <text class="record-time">{{ dateText(item.createdAt) }}</text>
          <text class="record-amt font-bold">+ {{ yuanText(item.amountCent) }}</text>
        </view>
        <view class="record-paytime" v-if="item.paidAt">
          支付时间: {{ dateText(item.paidAt) }}
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { api, requireLogin } from '../../utils/api.js';
import {
  dateText,
  paymentStatusText,
  walletTypeText,
  yuanText,
  statusClass,
} from '../../utils/format.js';

export default {
  data() {
    return {
      activeType: '', // '', DEPOSIT, INFO_FEE
      records: [],
      paymentStatusText,
      walletTypeText,
    };
  },
  onShow() {
    if (requireLogin()) this.load();
  },
  methods: {
    dateText,
    yuanText,
    statusClass,
    async load() {
      try {
        const params = {};
        if (this.activeType) params.walletType = this.activeType;
        const res = await api.rechargeRecords(params);
        this.records = res.records || res.items || [];
      } catch (err) {
        console.error(err);
      }
    },
    switchType(type) {
      this.activeType = type;
      this.load();
    },
  },
};
</script>

<style>
.recharge-records-page {
  padding: 24rpx;
}

/* Segmented Control */
.segmented-control {
  display: flex;
  padding: 8rpx !important;
  background-color: #f1f5f9 !important;
  border-radius: var(--radius-lg);
}

.segment-item {
  flex: 1;
  text-align: center;
  font-size: 26rpx;
  color: #4b5563;
  font-weight: 600;
  padding: 16rpx 0;
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}

.segment-item.active {
  background-color: #ffffff;
  color: #1677ff;
  box-shadow: 0 4rpx 12rpx rgba(17, 24, 39, 0.05);
}

/* Cards */
.record-card {
  padding: 28rpx;
  margin-bottom: 20rpx;
  border: 1rpx solid rgba(229, 231, 235, 0.5);
}

.card-header {
  border-bottom: 1rpx solid #f1f5f9;
  padding-bottom: 16rpx;
  margin-bottom: 20rpx;
}

.record-type-badge {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
  font-weight: bold;
  margin-right: 12rpx;
}

.record-type-badge.deposit {
  background-color: #eff6ff;
  color: #1677ff;
}

.record-type-badge.info_fee {
  background-color: #e6f4ea;
  color: #137333;
}

.order-no-font {
  font-size: 22rpx;
  color: #9ca3af;
  font-family: monospace;
}

.record-meta-row {
  margin-bottom: 8rpx;
}

.record-time {
  font-size: 24rpx;
  color: #9ca3af;
}

.record-amt {
  font-size: 34rpx;
  color: #10b981;
}

.record-paytime {
  font-size: 20rpx;
  color: #9ca3af;
  margin-top: 10rpx;
  border-top: 1rpx dashed #f3f4f6;
  padding-top: 10rpx;
}
</style>
