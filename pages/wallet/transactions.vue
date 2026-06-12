<template>
  <view class="page wallet-transactions-page">
    <!-- Filters -->
    <view class="section filters-card">
      <view class="segmented-control" style="margin-bottom: 20rpx">
        <view
          class="segment-item"
          :class="{ active: filterWalletType === '' }"
          @click="switchWalletType('')"
        >
          全部账户
        </view>
        <view
          class="segment-item"
          :class="{ active: filterWalletType === 'DEPOSIT' }"
          @click="switchWalletType('DEPOSIT')"
        >
          保证金
        </view>
        <view
          class="segment-item"
          :class="{ active: filterWalletType === 'INFO_FEE' }"
          @click="switchWalletType('INFO_FEE')"
        >
          信息费
        </view>
      </view>
    </view>

    <!-- Ledger List -->
    <view class="empty" v-if="transactions.length === 0"> 暂无交易变更流水 </view>
    <view v-else class="transactions-list">
      <view class="section tx-card" v-for="item in transactions" :key="item.id">
        <view class="row-between card-header">
          <view class="row align-center">
            <text class="tx-badge" :class="item.walletType.toLowerCase()">
              {{ walletTypeText[item.walletType] }}
            </text>
            <text class="tx-type-lbl font-bold">
              {{ walletTransactionTypeText[item.changeType] || item.changeType }}
            </text>
          </view>

          <text
            class="tx-amount font-bold"
            :class="
              item.amountCent < 0 ||
              item.changeType === 'ORDER_INFO_FEE_DEDUCT' ||
              item.changeType === 'ADMIN_DECREASE'
                ? 'decrease'
                : 'increase'
            "
          >
            {{ item.amountCent < 0 ? '-' : '+' }}{{ yuanText(Math.abs(item.amountCent)) }}
          </text>
        </view>

        <view class="detail-grid-info">
          <view class="detail-row">
            <text class="detail-label">流水单号</text>
            <text class="detail-value font-mono">{{ item.transactionNo }}</text>
          </view>
          <view class="detail-row" v-if="item.relatedOrderId">
            <text class="detail-label">关联订单ID</text>
            <text class="detail-value font-mono text-link" @click="goOrder(item.relatedOrderId)">
              {{ item.relatedOrderId }}
            </text>
          </view>
          <view class="detail-row">
            <text class="detail-label">账户变动额度</text>
            <text class="detail-value">
              {{ yuanText(item.beforeBalanceCent) }} → {{ yuanText(item.afterBalanceCent) }}
            </text>
          </view>
          <view class="detail-row">
            <text class="detail-label">记账时间</text>
            <text class="detail-value">{{ dateText(item.createdAt) }}</text>
          </view>
          <view class="detail-row" v-if="item.remark">
            <text class="detail-label">记账备注</text>
            <text class="detail-value">{{ item.remark }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { api, requireLogin } from '../../utils/api.js';
import {
  dateText,
  walletTransactionTypeText,
  walletTypeText,
  yuanText,
} from '../../utils/format.js';

export default {
  data() {
    return {
      filterWalletType: '', // '', DEPOSIT, INFO_FEE
      transactions: [],
      walletTransactionTypeText,
      walletTypeText,
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
        const params = {};
        if (this.filterWalletType) params.walletType = this.filterWalletType;
        const res = await api.walletTransactions(params);
        this.transactions = res.records || res.items || [];
      } catch (err) {
        console.error(err);
      }
    },
    switchWalletType(type) {
      this.filterWalletType = type;
      this.load();
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
.wallet-transactions-page {
  padding: 24rpx;
}

.filters-card {
  padding: 20rpx !important;
  margin-bottom: 24rpx;
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
.tx-card {
  padding: 28rpx;
  margin-bottom: 20rpx;
  border: 1rpx solid rgba(229, 231, 235, 0.5);
}

.card-header {
  border-bottom: 1rpx solid #f1f5f9;
  padding-bottom: 16rpx;
  margin-bottom: 20rpx;
}

.tx-badge {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
  font-weight: bold;
  margin-right: 12rpx;
}

.tx-badge.deposit {
  background-color: #eff6ff;
  color: #1677ff;
}

.tx-badge.info_fee {
  background-color: #e6f4ea;
  color: #137333;
}

.tx-type-lbl {
  font-size: 26rpx;
  color: #111827;
}

.tx-amount {
  font-size: 32rpx;
}

.tx-amount.increase {
  color: #10b981;
}

.tx-amount.decrease {
  color: #ef4444;
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

.text-link {
  color: #1677ff;
  font-weight: bold;
}
</style>
