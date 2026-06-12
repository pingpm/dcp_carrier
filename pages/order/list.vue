<template>
  <view class="page order-list-page">
    <!-- Scrolling Tab Bar -->
    <view class="tabs-scroll-container">
      <view class="tabs-wrapper">
        <scroll-view scroll-x class="tabs-scroll" show-scrollbar="false">
          <view class="tabs-inner">
            <view
              v-for="item in tabs"
              :key="item.value"
              class="tab-item"
              :class="{ active: activeStatus === item.value }"
              @click="changeStatus(item.value)"
            >
              <text class="tab-label">{{ item.label }}</text>
              <view class="tab-underline" v-if="activeStatus === item.value"></view>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- Guest Logged Out State -->
    <view v-if="!isLoggedIn" class="section empty-orders-card">
      <image class="empty-icon" src="/static/icons/user.svg" mode="aspectFit" />
      <text class="empty-text">您当前尚未登录</text>
      <text class="empty-subtext">登录后可查看分配给您的托运订单并进行履约操作。</text>
      <button class="primary-btn empty-btn" @click="goLogin">立即登录 / 注册</button>
    </view>

    <!-- Empty State -->
    <view v-else-if="!loading && orders.length === 0" class="section empty-orders-card">
      <image class="empty-icon" src="/static/icons/package.svg" mode="aspectFit" />
      <text class="empty-text">您当前暂无该状态下的订单</text>
      <text class="empty-subtext">当有车商发起托运订单并指派给您时，订单将在此显示。</text>
      <button class="primary-btn empty-btn" @click="goHome">返回工作台</button>
    </view>

    <!-- Order Cards -->
    <block v-else>
      <view
        v-for="order in orders"
        :key="order.id"
        class="section order-list-card"
        @click="goDetail(order.id)"
      >
        <!-- Card Top Bar: Dealer name and status badge -->
        <view class="order-card-header">
          <view class="dealer-name-block">
            <image class="dealer-icon" src="/static/order_dealer_icon.svg" mode="aspectFit" />
            <text class="dealer-company-name font-bold">{{ order.dealerName || '车商客户' }}</text>
          </view>
          <text class="order-status-badge" :class="statusClass(order.orderStatus)">
            {{ orderStatusText[order.orderStatus] }}
          </text>
        </view>

        <!-- Details Meta -->
        <view class="order-meta-details-row">
          <text class="order-no-text font-mono">订单号: {{ order.orderNo }}</text>
          <text class="status-tag status-info mini-tag" v-if="order.transportMode">
            {{ transportModeText[order.transportMode] }}
          </text>
        </view>

        <!-- Card Route details -->
        <view class="order-card-route">
          <view class="route-connector-line"></view>
          <view class="route-point-block">
            <view class="route-point-row">
              <text class="route-bullet origin">起</text>
              <text class="route-city-lbl">{{ order.originCityName }}</text>
              <text class="subtle-addr">({{ order.originProvinceName }})</text>
            </view>
            <view class="route-service-row">
              <text class="service-tag" :class="{ active: order.hasPickupService }">
                {{ order.hasPickupService ? '需提车' : '不提车' }}
              </text>
              <text class="service-address one-line" v-if="order.hasPickupService">
                {{ formatServiceAddress(order, 'origin') }}
              </text>
            </view>
          </view>
          <view class="route-point-block">
            <view class="route-point-row">
              <text class="route-bullet destination">终</text>
              <text class="route-city-lbl">{{ order.destinationCityName }}</text>
              <text class="subtle-addr">({{ order.destinationProvinceName }})</text>
            </view>
            <view class="route-service-row">
              <text class="service-tag" :class="{ active: order.hasDeliveryService }">
                {{ order.hasDeliveryService ? '需送车' : '不送车' }}
              </text>
              <text class="service-address one-line" v-if="order.hasDeliveryService">
                {{ formatServiceAddress(order, 'destination') }}
              </text>
            </view>
          </view>
        </view>

        <!-- Vehicles List summary -->
        <view class="vehicles-summary-row" v-if="order.vehicles && order.vehicles.length">
          <image class="car-icon" src="/static/icons/car-front.svg" mode="aspectFit" />
          <text class="vehicles-text">
            {{ formatVehicles(order.vehicles) }}
          </text>
        </view>

        <!-- Card Bottom details: Time & Amount -->
        <view class="order-card-cost-row">
          <view class="order-time-display"> 创建于: {{ dateText(order.createdAt) }} </view>

          <view class="order-price-display text-right">
            <view class="price-line">
              <text class="price-lbl">运费: </text>
              <text class="price-val font-bold">{{ yuanVal(order.orderAmountCent) }}</text>
            </view>
          </view>
        </view>

        <view v-if="orderTimingTip(order)" class="order-timing-tip">
          {{ orderTimingTip(order) }}
        </view>

        <!-- Interactive buttons row based on status -->
        <view class="order-card-actions" @click.stop="">
          <button class="plain-btn card-action-btn" @click="contactDealer(order)">联系车商</button>

          <!-- Status: PENDING_CONFIRM -->
          <block v-if="order.orderStatus === 'PENDING_CONFIRM'">
            <button class="primary-btn card-action-btn" @click="goDetail(order.id)">
              确认接单
            </button>
          </block>

          <!-- Status: PENDING_CONTRACT -->
          <block v-else-if="order.orderStatus === 'PENDING_CONTRACT'">
            <button class="primary-btn card-action-btn" @click="signContract(order)">
              确认合同
            </button>
          </block>

          <!-- Status: PENDING_PICKUP -->
          <block v-else-if="order.orderStatus === 'PENDING_PICKUP'">
            <button class="secondary-btn card-action-btn" @click="setDriver(order)">
              设置提车司机
            </button>
            <button class="primary-btn card-action-btn" @click="pickupVehicle(order)">
              提车确认
            </button>
          </block>

          <!-- Status: IN_TRANSIT -->
          <block v-else-if="order.orderStatus === 'IN_TRANSIT'">
            <button class="secondary-btn card-action-btn" @click="reportLocation(order)">
              上报在途
            </button>
            <button class="primary-btn card-action-btn" @click="handoverVehicle(order)">
              交车确认
            </button>
          </block>

          <!-- Status: CANCEL_PENDING -->
          <block v-else-if="order.orderStatus === 'CANCEL_PENDING'">
            <button class="primary-btn card-action-btn" @click="handleCancel(order)">
              处理取消
            </button>
          </block>

          <!-- Default: Details -->
          <block v-else>
            <button class="secondary-btn card-action-btn" @click="goDetail(order.id)">
              查看详情
            </button>
          </block>
        </view>
      </view>
    </block>
  </view>
</template>

<script>
import { api, getToken } from '../../utils/api.js';
import {
  dateText,
  orderStatusText,
  statusClass,
  transportModeText,
  yuanText,
} from '../../utils/format.js';

export default {
  data() {
    return {
      isLoggedIn: false,
      activeStatus: '',
      loading: false,
      orders: [],
      orderStatusText,
      transportModeText,
      tabs: [
        { label: '全部', value: '' },
        { label: '待确认', value: 'PENDING_CONFIRM' },
        { label: '待合同', value: 'PENDING_CONTRACT' },
        { label: '待提车', value: 'PENDING_PICKUP' },
        { label: '运输中', value: 'IN_TRANSIT' },
        { label: '待收车', value: 'PENDING_RECEIPT' },
        { label: '取消中', value: 'CANCEL_PENDING' },
        { label: '已完成', value: 'COMPLETED' },
      ],
    };
  },
  onLoad(options) {
    if (options.status) {
      this.activeStatus = options.status;
    }
  },
  onShow() {
    this.isLoggedIn = !!getToken();
    const filterStatus = uni.getStorageSync('order_list_filter_status');
    if (filterStatus !== undefined && filterStatus !== null && filterStatus !== 'undefined') {
      this.activeStatus = filterStatus;
      uni.removeStorageSync('order_list_filter_status');
    }
    if (this.isLoggedIn) {
      this.load();
    } else {
      this.orders = [];
    }
  },
  methods: {
    dateText,
    yuanText,
    statusClass,
    yuanVal(cent) {
      return (Number(cent || 0) / 100).toFixed(2) + ' 元';
    },
    orderTimingTip(order) {
      if (order.orderStatus === 'PENDING_CONFIRM' && order.carrierConfirmDeadlineAt) {
        return `请在 ${this.dateText(order.carrierConfirmDeadlineAt)} 前确认接单`;
      }
      if (order.orderStatus === 'PENDING_RECEIPT' && order.autoReceiptAt) {
        return `车商未确认时，系统将在 ${this.dateText(order.autoReceiptAt)} 自动确认收车`;
      }
      return '';
    },
    formatVehicles(vehicles) {
      if (!vehicles || !vehicles.length) return '';
      return vehicles.map((v) => `${v.brandName} ${v.modelName || ''}`).join('，');
    },
    formatServiceAddress(order, type) {
      const prefix = type === 'origin' ? 'origin' : 'destination';
      return [
        order[`${prefix}ProvinceName`],
        order[`${prefix}CityName`],
        order[`${prefix}DistrictName`],
        order[`${prefix}AddressDetail`],
      ]
        .filter(Boolean)
        .join('');
    },
    async load() {
      if (!this.isLoggedIn) {
        this.orders = [];
        return;
      }
      this.loading = true;
      try {
        const data = await api.orders(
          { orderStatus: this.activeStatus },
          { silent: true, authRedirect: false },
        );
        this.orders = data.orders || data.items || [];
      } catch (err) {
        this.orders = [];
      } finally {
        this.loading = false;
      }
    },
    changeStatus(status) {
      this.activeStatus = status;
      this.load();
    },
    goDetail(orderId) {
      uni.navigateTo({ url: `/pages/order/detail?orderId=${orderId}` });
    },
    goHome() {
      uni.switchTab({ url: '/pages/home/index' });
    },
    goLogin() {
      uni.navigateTo({ url: '/pages/auth/login' });
    },
    async contactDealer(order) {
      try {
        const res = await api.getContactPhone(order.id);
        uni.showModal({
          title: '联系车商客户',
          content: `车商姓名: ${res.contactName || '未填'}\n手机号码: ${res.phone}`,
          confirmText: '拨打电话',
          confirmColor: '#1677ff',
          success: (mRes) => {
            if (mRes.confirm) {
              uni.makePhoneCall({ phoneNumber: res.phone });
            }
          },
        });
      } catch (err) {
        // error toasts already handled
      }
    },
    signContract(order) {
      uni.navigateTo({ url: `/pages/order/contract?orderId=${order.id}` });
    },
    setDriver(order) {
      uni.navigateTo({ url: `/pages/order/driver-form?orderId=${order.id}&driverType=PICKUP` });
    },
    promptSetPickupDriver(order) {
      uni.showModal({
        title: '请先设置提车司机',
        content: '确认提车前必须先设置提车司机。您可以立即设置，也可以稍后再操作。',
        confirmText: '去设置',
        cancelText: '稍后',
        confirmColor: '#1677ff',
        success: (res) => {
          if (res.confirm) {
            this.setDriver(order);
          }
        },
      });
    },
    async pickupVehicle(order) {
      try {
        const data = await api.orderDetail(order.id);
        const pickupDriver = data.order?.driverInfo;
        if (!pickupDriver?.driverName || !pickupDriver?.driverPhone) {
          this.promptSetPickupDriver(order);
          return;
        }
      } catch (err) {
        console.error(err);
        return;
      }
      uni.navigateTo({ url: `/pages/order/pickup?orderId=${order.id}` });
    },
    reportLocation(order) {
      uni.navigateTo({ url: `/pages/order/transit-location?orderId=${order.id}` });
    },
    handoverVehicle(order) {
      uni.navigateTo({ url: `/pages/order/handover?orderId=${order.id}` });
    },
    handleCancel(order) {
      uni.navigateTo({ url: `/pages/order/cancel-handle?orderId=${order.id}` });
    },
  },
};
</script>

<style>
.order-list-page {
  padding: 0rpx;
  background-color: #f8fafc;
}

.tabs-scroll-container {
  background: #ffffff;
  border-bottom: 1rpx solid #e5e7eb;
  position: sticky;
  top: var(--window-top);
  z-index: 100;
}

.tabs-wrapper {
  height: 90rpx;
}

.tabs-scroll {
  width: 100%;
  white-space: nowrap;
}

.tabs-inner {
  display: flex;
  padding: 0 20rpx;
}

.tab-item {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 90rpx;
  padding: 0 30rpx;
  position: relative;
  flex-shrink: 0;
}

.tab-label {
  font-size: 26rpx;
  color: #9ca3af;
  font-weight: 600;
  transition: all 0.2s ease;
}

.tab-underline {
  position: absolute;
  bottom: 0;
  width: 40rpx;
  height: 6rpx;
  background-color: #1677ff;
  border-radius: 4rpx;
}

.tab-item.active .tab-label {
  color: #111827;
  font-size: 28rpx;
  font-weight: 800;
}

/* Empty State */
.empty-orders-card {
  padding: 140rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.empty-icon {
  width: 104rpx;
  height: 104rpx;
  margin-bottom: 24rpx;
  opacity: 0.7;
}

.empty-text {
  font-size: 28rpx;
  font-weight: bold;
  color: #9ca3af;
}

.empty-subtext {
  font-size: 22rpx;
  color: #d1d5db;
  margin-top: 10rpx;
  margin-bottom: 40rpx;
  line-height: 1.4;
}

.empty-btn {
  background: #1677ff;
  box-shadow: none;
  min-width: 240rpx;
  height: 80rpx;
}

/* Order List Card Layout */
.order-list-card {
  padding: 28rpx;
  margin: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.02);
  border: 1rpx solid rgba(229, 231, 235, 0.5);
  position: relative;
}

.order-list-card:active {
  background-color: #f9fafb;
}

.order-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dealer-name-block {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.dealer-icon {
  width: 32rpx;
  height: 32rpx;
  flex-shrink: 0;
}

.dealer-company-name {
  font-size: 28rpx;
  color: #111827;
}

.order-status-badge {
  font-size: 24rpx;
  font-weight: bold;
}

.order-meta-details-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 12rpx;
  border-bottom: 1rpx solid #f3f4f6;
  padding-bottom: 16rpx;
}

.order-no-text {
  font-size: 20rpx;
  color: #9ca3af;
}

.mini-tag {
  min-height: 34rpx !important;
  font-size: 16rpx !important;
  padding: 0 8rpx !important;
  border-radius: 4rpx !important;
  line-height: 1.4;
}

/* Route details */
.order-card-route {
  padding: 24rpx 0;
  display: flex;
  flex-direction: column;
  position: relative;
}

.route-point-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.route-point-block {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.route-point-block + .route-point-block {
  margin-top: 28rpx;
}

.route-bullet {
  width: 36rpx;
  height: 36rpx;
  border-radius: 8rpx;
  color: #ffffff;
  font-size: 20rpx;
  font-weight: 800;
  line-height: 36rpx;
  text-align: center;
  flex-shrink: 0;
  position: relative;
  z-index: 2;
}

.route-bullet.origin {
  background: linear-gradient(135deg, #38bdf8, #1677ff);
}

.route-bullet.destination {
  background: linear-gradient(135deg, #fb7185, #ef4444);
}

.route-city-lbl {
  font-size: 28rpx;
  font-weight: bold;
  color: #111827;
}

.subtle-addr {
  font-size: 24rpx;
  color: #9ca3af;
}

.route-connector-line {
  width: 2rpx;
  position: absolute;
  left: 17rpx;
  top: 60rpx;
  height: 78rpx;
  background: #cbd5e1;
  border-radius: 2rpx;
  z-index: 1;
}

.route-service-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  min-width: 0;
  padding-left: 40rpx;
}

.service-tag {
  flex-shrink: 0;
  min-width: 86rpx;
  padding: 4rpx 10rpx;
  border-radius: 6rpx;
  background: #f3f4f6;
  color: #9ca3af;
  font-size: 20rpx;
  font-weight: 700;
  text-align: center;
}

.service-tag.active {
  background: #eff6ff;
  color: #1677ff;
}

.service-address {
  flex: 1;
  min-width: 0;
  color: #4b5563;
  font-size: 22rpx;
}

.one-line {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vehicles-summary-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  background-color: #f9fafb;
  padding: 16rpx 20rpx;
  border-radius: 8rpx;
  border: 1rpx solid #f1f5f9;
  margin-bottom: 20rpx;
}

.car-icon {
  width: 28rpx;
  height: 28rpx;
  flex-shrink: 0;
}

.vehicles-text {
  font-size: 24rpx;
  color: #4b5563;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Cost & details bottom row */
.order-card-cost-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  border-top: 1rpx solid #f3f4f6;
  padding: 24rpx 0;
}

.order-time-display {
  font-size: 22rpx;
  color: #9ca3af;
}

.price-line {
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
}

.price-lbl {
  font-size: 22rpx;
  color: #4b5563;
  margin-right: 6rpx;
}

.price-val {
  font-size: 30rpx;
  color: #111827;
}

.order-timing-tip {
  margin: 0 0 22rpx;
  padding: 14rpx 18rpx;
  border-radius: 8rpx;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 22rpx;
  line-height: 1.45;
  word-break: break-all;
}

/* Card Actions button block */
.order-card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16rpx;
  border-top: 1rpx dashed #f3f4f6;
  padding-top: 24rpx;
}

.card-action-btn {
  min-height: 64rpx !important;
  font-size: 24rpx !important;
  padding: 0 28rpx !important;
  border-radius: 32rpx !important;
  font-weight: bold !important;
  margin: 0 !important;
  box-shadow: none !important;
  border-width: 1rpx !important;
}
</style>
