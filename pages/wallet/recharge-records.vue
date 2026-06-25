<template>
  <view class="page recharge-records-page">
    <view class="mode-tabs section">
      <view class="mode-tab" :class="{ active: recordMode === 'online' }" @click="switchMode('online')">
        在线充值
      </view>
      <view class="mode-tab" :class="{ active: recordMode === 'offline' }" @click="switchMode('offline')">
        对公转账
      </view>
    </view>

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
      <view v-if="recordMode === 'online'" class="section record-card" v-for="item in records" :key="item.id">
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

      <view v-if="recordMode === 'offline'" class="section record-card" v-for="item in records" :key="item.id">
        <view class="row-between card-header">
          <view class="row align-center">
            <text class="record-type-badge" :class="item.walletType.toLowerCase()">
              {{ walletTypeText[item.walletType] }}
            </text>
            <text class="order-no-font">记录号: {{ item.recordNo }}</text>
          </view>
          <text class="status-tag" :class="offlineStatusClass(item.reviewStatus)">
            {{ offlineRechargeStatusText[item.reviewStatus] || item.reviewStatus }}
          </text>
        </view>

        <view class="record-meta-row row-between align-center">
          <text class="record-time">提交时间: {{ dateText(item.submittedAt) }}</text>
          <text v-if="item.approvedAmountCent" class="record-amt font-bold">
            + {{ yuanText(item.approvedAmountCent) }}
          </text>
        </view>
        <view class="offline-proof-row" v-if="item.proofFile && item.proofFile.fileUrl">
          <image class="proof-thumb" :src="item.proofFile.fileUrl" mode="aspectFill" @click="previewProof(item)" />
          <view class="offline-proof-copy">
            <text>转账凭证</text>
            <text v-if="item.reviewedAt">审核时间: {{ dateText(item.reviewedAt) }}</text>
            <text v-if="item.transferSerialNo">转账流水号: {{ item.transferSerialNo }}</text>
            <text v-if="item.reviewRemark">审核备注: {{ item.reviewRemark }}</text>
            <text v-if="item.rejectReason" class="reject-reason">驳回原因: {{ item.rejectReason }}</text>
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
import {
  dateText,
  offlineRechargeStatusText,
  paymentStatusText,
  walletTypeText,
  yuanText,
  statusClass,
} from '../../utils/format.js';

export default {
  mixins: [miniappLoginPageMixin],
  data() {
    return {
      activeType: '', // '', DEPOSIT, INFO_FEE
      recordMode: 'online',
      records: [],
      offlineRechargeStatusText,
      paymentStatusText,
      walletTypeText,
    };
  },
  onLoad(options) {
    if (options.mode === 'offline') this.recordMode = 'offline';
  },
  onShow() {
    if (requireLogin()) this.load();
  },
  methods: {
    dateText,
    yuanText,
    statusClass,
    offlineStatusClass(status) {
      if (status === 'APPROVED') return 'status-success';
      if (status === 'REJECTED') return 'status-danger';
      return 'status-warning';
    },
    async load() {
      try {
        const params = {};
        if (this.activeType) params.walletType = this.activeType;
        const res =
          this.recordMode === 'offline'
            ? await api.offlineRechargeRecords(params)
            : await api.rechargeRecords(params);
        this.records = res.records || res.items || [];
      } catch (err) {
        console.error(err);
      }
    },
    switchType(type) {
      this.activeType = type;
      this.load();
    },
    switchMode(mode) {
      this.recordMode = mode;
      this.records = [];
      this.load();
    },
    previewProof(item) {
      const url = item?.proofFile?.fileUrl;
      if (url) uni.previewImage({ urls: [url] });
    },
  },
};
</script>

<style>
.recharge-records-page {
  padding: 24rpx;
}

.mode-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12rpx;
  padding: 10rpx !important;
  margin-bottom: 20rpx;
  background: #eef6ff !important;
}

.mode-tab {
  text-align: center;
  height: 68rpx;
  line-height: 68rpx;
  border-radius: 10rpx;
  color: #475569;
  font-size: 26rpx;
  font-weight: 700;
}

.mode-tab.active {
  background: #ffffff;
  color: #1677ff;
  box-shadow: 0 4rpx 12rpx rgba(17, 24, 39, 0.05);
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

.offline-proof-row {
  display: flex;
  gap: 18rpx;
  padding-top: 18rpx;
  border-top: 1rpx dashed #f3f4f6;
}

.proof-thumb {
  width: 132rpx;
  height: 132rpx;
  border-radius: 12rpx;
  background: #e5e7eb;
  flex-shrink: 0;
}

.offline-proof-copy {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  color: #64748b;
  font-size: 22rpx;
  line-height: 1.4;
}

.reject-reason {
  color: #dc2626;
}
</style>
