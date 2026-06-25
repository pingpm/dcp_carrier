<template>
  <view class="page order-detail-page" v-if="order.id">
    <!-- Top Hero Status Card -->
    <view class="order-hero-card" :class="heroStatusClass">
      <view class="hero-status-row">
        <image class="hero-status-icon" :src="statusIconPath" mode="aspectFit" />
        <view class="hero-status-meta">
          <view class="hero-status-title">{{ orderStatusText[order.orderStatus] || '-' }}</view>
          <view class="hero-order-no">订单号：{{ order.orderNo }}</view>
        </view>
      </view>
      <view v-if="order.orderStatus === 'PENDING_RECEIPT'" class="hero-tip-bar">
        {{ pendingReceiptTip }}
      </view>
      <view v-else-if="order.orderStatus === 'PENDING_CONFIRM'" class="hero-tip-bar">
        {{ pendingConfirmTip }}
      </view>
    </view>

    <!-- Dealer Info Card -->
    <view class="section dealer-summary-card">
      <view class="dealer-summary-main">
        <image class="dealer-summary-icon" src="/static/order_dealer_icon.svg" mode="aspectFit" />
        <text class="dealer-summary-name">{{ order.dealerName || '车商客户' }}</text>
      </view>
      <button class="dealer-contact-btn" @click="contactDealerDirect">电话联系</button>
    </view>

    <!-- Route Details Card -->
    <view class="section detail-section-card">
      <view class="section-title">运输线路</view>

      <!-- Flow Visualizer -->
      <view class="detail-route-flow">
        <view class="flow-node">
          <text class="flow-city">{{ order.originCityName }}</text>
          <text class="flow-role-lbl">起运地 ({{ order.originProvinceName }})</text>
        </view>
        <view class="flow-connector">
          <image class="flow-icon" src="/static/icons/truck.svg" mode="aspectFit" />
          <view class="flow-bar"></view>
          <text class="flow-mode-tag">{{ transportModeText[order.transportMode] }}</text>
        </view>
        <view class="flow-node text-right">
          <text class="flow-city">{{ order.destinationCityName }}</text>
          <text class="flow-role-lbl">目的地 ({{ order.destinationProvinceName }})</text>
        </view>
      </view>

      <!-- Details List -->
      <view class="detail-grid-info">
        <view class="detail-row">
          <text class="detail-label">约定托运运费</text>
          <text class="detail-value price-highlight">{{ yuanText(order.orderAmountCent) }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">约定最迟送达</text>
          <text class="detail-value">{{ dateText(order.agreedDeliveryTime) }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">发票开具</text>
          <text class="detail-value">{{
            order.hasInvoice ? '需要发票（线下交付）' : '不需要发票'
          }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">保险</text>
          <text class="detail-value">
            {{
              order.hasInsurance
                ? `含保险，最高保额${yuanText(order.insuranceMaxAmountCent)}`
                : '不含保险'
            }}
          </text>
        </view>
        <view class="detail-row" v-if="order.hasInsurance && order.insuranceRemark">
          <text class="detail-label">保险备注</text>
          <text class="detail-value">{{ order.insuranceRemark }}</text>
        </view>
      </view>
    </view>

    <!-- Pickup / Delivery Service Card -->
    <view class="section detail-section-card">
      <view class="section-title">提送车服务</view>
      <view class="service-info-list">
        <view class="service-info-item">
          <view class="service-info-head">
            <text class="service-info-title">提车服务</text>
            <text
              class="status-tag mini-tag-v2"
              :class="order.hasPickupService ? 'status-success' : 'status-warning'"
            >
              {{ order.hasPickupService ? '需要提车' : '不需要提车' }}
            </text>
          </view>
          <view class="detail-row service-address-row">
            <text class="detail-label">提车位置</text>
            <text class="detail-value service-address">{{ formatOrderAddress('origin') }}</text>
          </view>
        </view>

        <view class="service-info-item">
          <view class="service-info-head">
            <text class="service-info-title">送车服务</text>
            <text
              class="status-tag mini-tag-v2"
              :class="order.hasDeliveryService ? 'status-success' : 'status-warning'"
            >
              {{ order.hasDeliveryService ? '需要送车' : '不需要送车' }}
            </text>
          </view>
          <view class="detail-row service-address-row">
            <text class="detail-label">送车位置</text>
            <text class="detail-value service-address">{{
              formatOrderAddress('destination')
            }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- Dealer / Customer Card -->
    <view class="section detail-section-card">
      <view class="section-title">发车与收车联系人</view>
      <view class="detail-grid-info">
        <view class="detail-row border-bottom-mini pt-2">
          <view class="contact-lbl-block">
            <text class="bullet-tag orange">●</text>
            <text class="contact-role-name">发车人</text>
          </view>
          <text class="detail-value">{{ contactText(order.senderName, order.senderPhone) }}</text>
        </view>
        <view class="detail-row border-bottom-mini pt-2">
          <view class="contact-lbl-block">
            <text class="bullet-tag blue">●</text>
            <text class="contact-role-name">收车人</text>
          </view>
          <text class="detail-value">{{
            contactText(order.receiverName, order.receiverPhone)
          }}</text>
        </view>
      </view>
    </view>

    <!-- Vehicles List Card -->
    <view class="section detail-section-card">
      <view class="section-title">承运车辆 ({{ vehicles.length }}辆)</view>

      <view v-for="vehicle in vehicles" :key="vehicle.id" class="detail-vehicle-item">
        <view class="vehicle-head">
          <image class="vehicle-icon" src="/static/icons/car-front.svg" mode="aspectFit" />
          <text class="vehicle-title font-bold"
            >{{ vehicle.brandName }} {{ vehicle.seriesName || '' }}
            {{ vehicle.modelName || '' }}</text
          >
        </view>
        <view class="vehicle-details">
          <view class="vehicle-col">
            <text class="veh-lbl">车架号 (VIN)</text>
            <text class="veh-val font-mono">{{ vehicle.vin || '未录入' }}</text>
          </view>
          <view class="vehicle-col text-right">
            <text class="veh-lbl">车辆状况</text>
            <text class="status-tag status-success mini-tag-v2">{{
              vehicle.vehicleConditionType === 'NEW' ? '新车' : '二手车'
            }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- Driver Info Card -->
    <view class="section detail-section-card" v-if="order.driverInfo || order.deliveryDriverInfo">
      <view class="section-title">承运司机信息</view>

      <!-- Pickup Driver -->
      <view class="driver-block" v-if="order.driverInfo">
        <view class="driver-role-title">提车司机</view>
        <view class="detail-grid-info">
          <view class="detail-row">
            <text class="detail-label">姓名电话</text>
            <text class="detail-value"
              >{{ order.driverInfo.driverName }} ({{ order.driverInfo.driverPhone }})</text
            >
          </view>
          <view class="detail-row">
            <text class="detail-label">车牌/身份证</text>
            <text class="detail-value font-mono"
              >{{ order.driverInfo.licensePlate }} / {{ order.driverInfo.idNumber || '-' }}</text
            >
          </view>
        </view>
      </view>

      <!-- Delivery Driver -->
      <view class="driver-block separator" v-if="order.deliveryDriverInfo">
        <view class="driver-role-title">交车司机</view>
        <view class="detail-grid-info">
          <view class="detail-row">
            <text class="detail-label">姓名电话</text>
            <text class="detail-value"
              >{{ order.deliveryDriverInfo.driverName }} ({{
                order.deliveryDriverInfo.driverPhone
              }})</text
            >
          </view>
          <view class="detail-row">
            <text class="detail-label">车牌/身份证</text>
            <text class="detail-value font-mono"
              >{{ order.deliveryDriverInfo.licensePlate }} /
              {{ order.deliveryDriverInfo.idNumber || '-' }}</text
            >
          </view>
        </view>
      </view>
    </view>

    <!-- Fulfillment detail: Pickup verification -->
    <view class="section detail-section-card" v-if="order.pickupDetails">
      <view class="section-title">提车验车记录</view>
      <view class="detail-grid-info" style="margin-bottom: 20rpx">
        <view class="detail-row">
          <text class="detail-label">提车节点时间</text>
          <text class="detail-value">{{ dateText(order.pickupDetails.pickupTime) }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">提车备注</text>
          <text class="detail-value">{{ order.pickupDetails.remark || '-' }}</text>
        </view>
      </view>
      <text class="label">验车媒体照片/视频</text>
      <view class="upload-grid" v-if="pickupUrls.length">
        <view class="upload-preview" v-for="(url, index) in pickupUrls" :key="index">
          <image :src="url" mode="aspectFill" class="upload-img" @click="previewImg(url)" />
        </view>
      </view>
      <view v-else class="empty-media-text">暂无验车媒体</view>
    </view>

    <!-- Fulfillment detail: Handover details -->
    <view class="section detail-section-card" v-if="order.handoverDetails">
      <view class="section-title">交车凭证记录</view>
      <view class="detail-grid-info" style="margin-bottom: 20rpx">
        <view class="detail-row">
          <text class="detail-label">交车节点时间</text>
          <text class="detail-value">{{ dateText(order.handoverDetails.handoverTime) }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">交车备注</text>
          <text class="detail-value">{{ order.handoverDetails.remark || '-' }}</text>
        </view>
      </view>
      <text class="label">交车凭证照片</text>
      <view class="upload-grid" v-if="handoverUrls.length">
        <view class="upload-preview" v-for="(url, index) in handoverUrls" :key="index">
          <image :src="url" mode="aspectFill" class="upload-img" @click="previewImg(url)" />
        </view>
      </view>
      <view v-else class="empty-media-text">暂无交车凭证照片</view>
    </view>

    <!-- In Transit Locations Card -->
    <view
      class="section detail-section-card"
      v-if="order.transitLocations && order.transitLocations.length"
    >
      <view class="section-title">在途轨迹上报</view>
      <view class="locations-timeline">
        <view class="loc-item" v-for="(loc, idx) in order.transitLocations" :key="idx">
          <view class="loc-bullet-column">
            <view class="loc-bullet"></view>
            <view class="loc-trail" v-if="idx < order.transitLocations.length - 1"></view>
          </view>
          <view class="loc-content">
            <view class="row-between">
              <text class="loc-title font-bold">{{ loc.cityName }}</text>
              <text class="loc-time">{{ dateText(loc.createdAt) }}</text>
            </view>
            <text class="loc-detail">{{ loc.address }}</text>
            <text class="loc-remark" v-if="loc.remark">备注: {{ loc.remark }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- Timeline Logs Card -->
    <view class="section detail-section-card" v-if="compensationClaim">
      <view class="section-title">赔付申请</view>
      <view class="detail-grid-info">
        <view class="detail-row">
          <text class="detail-label">申请编号</text>
          <text class="detail-value">{{ compensationClaim.claimNo }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">申请状态</text>
          <text class="detail-value">{{ compensationStatusText(compensationClaim.claimStatus) }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">申请金额</text>
          <text class="detail-value price-highlight">{{ yuanText(compensationClaim.requestedCompensationCent) }}</text>
        </view>
      </view>
      <button
        v-if="compensationClaim.claimStatus === 'PENDING_CARRIER'"
        class="primary-btn w-full"
        style="margin-top: 20rpx"
        @click="goCompensationHandle"
      >
        处理赔付申请
      </button>
    </view>

    <!-- Timeline Logs Card -->
    <view class="section detail-section-card">
      <view class="section-title">订单日志与追踪</view>

      <view class="timeline-container">
        <view
          v-for="(log, idx) in logs"
          :key="log.id"
          class="timeline-item"
          :class="{ latest: idx === 0 }"
        >
          <view class="timeline-line-wrap">
            <view class="timeline-dot" :class="getLogStatusClass(log.actionType)"></view>
            <view v-if="idx < logs.length - 1" class="timeline-trail-line"></view>
          </view>
          <view class="timeline-content">
            <text class="timeline-action">{{ logActionText(log.actionType) }}</text>
            <text v-if="log.remark" class="timeline-remark">{{ log.remark }}</text>
            <text class="timeline-time">{{ dateText(log.createdAt) }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- Fixed Action Bar -->
    <view class="fixed-footer detail-footer-actions">
      <!-- Info fee note for PENDING_CONFIRM -->
      <view v-if="order.orderStatus === 'PENDING_CONFIRM'" class="footer-alert-notice-text">
        {{ confirmFooterTip }}
      </view>

      <view class="actions-wrapper">
        <view class="button-row compact-actions">
          <button
            v-if="footerSecondaryAction"
            :class="[footerSecondaryAction.className, 'footer-action-btn']"
            @click="runFooterAction(footerSecondaryAction)"
          >
            {{ footerSecondaryAction.label }}
          </button>
          <button
            v-if="footerPrimaryAction"
            :class="[footerPrimaryAction.className, 'footer-action-btn primary-action']"
            @click="runFooterAction(footerPrimaryAction)"
          >
            {{ footerPrimaryAction.label }}
          </button>
          <button class="plain-btn more-action-btn" @click="showMoreActions = true">
            <image class="more-action-icon" src="/static/icons/more-horizontal.svg" mode="aspectFit" />
            <text>更多</text>
          </button>
        </view>
      </view>
    </view>

    <view
      class="drawer-mask"
      :class="{ show: showMoreActions }"
      @click="showMoreActions = false"
    ></view>
    <view class="drawer-content more-actions-drawer" :class="{ show: showMoreActions }">
      <view class="drawer-header">
        <view class="drawer-title">更多操作</view>
        <view class="drawer-close" @click="showMoreActions = false">×</view>
      </view>
      <view class="drawer-body">
        <view
          v-for="action in moreFooterActions"
          :key="action.key"
          class="more-action-item"
          :class="{ danger: action.danger }"
          @click="runFooterAction(action)"
        >
          <text class="more-action-label">{{ action.label }}</text>
          <image class="more-action-arrow" src="/static/icons/arrow-right.svg" mode="aspectFit" />
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
  formatOrderLogAction,
  orderStatusText,
  statusClass,
  transportModeText,
  yuanText,
  vehicleConditionText,
} from '../../utils/format.js';

export default {
  mixins: [miniappLoginPageMixin],
  data() {
    return {
      orderId: '',
      order: {},
      vehicles: [],
      logs: [],
      orderStatusText,
      transportModeText,
      vehicleConditionText,
      pickupUrls: [],
      handoverUrls: [],
      compensationClaim: null,
      showMoreActions: false,
    };
  },
  computed: {
    heroStatusClass() {
      const status = this.order.orderStatus;
      if (status === 'COMPLETED') return 'completed';
      if (
        ['PENDING_CONFIRM', 'PENDING_RECEIPT', 'CANCEL_PENDING'].includes(status)
      )
        return 'warning';
      if (['PENDING_PICKUP', 'IN_TRANSIT'].includes(status)) return 'in-transit';
      return 'canceled';
    },
    statusIconPath() {
      const status = this.order.orderStatus;
      if (status === 'COMPLETED') return '/static/icons/check-circle.svg';
      if (status === 'PENDING_CONFIRM') return '/static/icons/clock.svg';
      if (status === 'PENDING_RECEIPT') return '/static/icons/package.svg';
      if (status === 'CANCEL_PENDING') return '/static/icons/alert-triangle.svg';
      if (status === 'IN_TRANSIT') return '/static/icons/truck.svg';
      if (status === 'PENDING_PICKUP') return '/static/icons/map-pin.svg';
      return '/static/icons/alert-triangle.svg';
    },
    footerPrimaryAction() {
      const status = this.order.orderStatus;
      const map = {
        PENDING_CONFIRM: this.action('confirm', '确认接单', 'primary-btn', this.confirmOrder),
        PENDING_PICKUP: this.action('pickup', '确认提车', 'primary-btn', this.goPickup),
        IN_TRANSIT: this.action('handover', '确认交车', 'primary-btn', this.goHandover),
        CANCEL_PENDING: this.action('cancelHandle', '处理取消', 'primary-btn', this.goCancelHandle),
      };
      return map[status] || this.action('contact', '联系车商', 'primary-btn', this.contactDealerDirect);
    },
    footerSecondaryAction() {
      const status = this.order.orderStatus;
      if (status === 'PENDING_CONFIRM') {
        return this.action('contact', '联系车商', 'secondary-btn', this.contactDealerDirect);
      }
      if (status === 'PENDING_PICKUP') {
        return this.action('pickupDriver', '提车司机', 'secondary-btn', () => this.setDriver('PICKUP'));
      }
      if (status === 'IN_TRANSIT') {
        return this.action('location', '上报位置', 'secondary-btn', this.reportLocation);
      }
      return null;
    },
    moreFooterActions() {
      const status = this.order.orderStatus;
      const actions = [];
      if (['PENDING_PICKUP', 'IN_TRANSIT', 'CANCEL_PENDING'].includes(status)) {
        actions.push(this.action('contact', '联系车商客户', 'plain-btn', this.contactDealerDirect));
      }
      if (status === 'PENDING_CONFIRM') {
        actions.push(this.action('directCancel', '拒绝 / 取消订单', 'danger-btn', this.cancelOrderDirect, true));
      }
      if (['PENDING_PICKUP', 'IN_TRANSIT'].includes(status)) {
        actions.push(this.action('cancel', '发起取消协商', 'danger-btn', this.goCancel, true));
      }
      if (status === 'IN_TRANSIT') {
        actions.push(this.action('handoverDriver', '设置交车司机', 'plain-btn', () => this.setDriver('HANDOVER')));
      }
      actions.push(this.action('cancelLogs', '协商取消历史', 'plain-btn', this.goCancelLogs));
      return actions;
    },
    pendingConfirmTip() {
      const deadline = this.order.carrierConfirmDeadlineAt
        ? this.dateText(this.order.carrierConfirmDeadlineAt)
        : '';
      const deadlineText = deadline ? `请在 ${deadline} 前完成确认。` : '请尽快完成确认。';
      return `${deadlineText}确认接单前请核对托运路线、车辆和费用，确认后将扣除信息服务费。`;
    },
    pendingReceiptTip() {
      const autoReceiptAt = this.order.autoReceiptAt ? this.dateText(this.order.autoReceiptAt) : '';
      if (autoReceiptAt) {
        return `车辆已安全送达。车商未主动确认时，系统将在 ${autoReceiptAt} 自动确认收车。`;
      }
      return '车辆已安全送达。请等待车商确认收车，超时未确认时系统将自动处理。';
    },
    confirmFooterTip() {
      const deadline = this.order.carrierConfirmDeadlineAt
        ? this.dateText(this.order.carrierConfirmDeadlineAt)
        : '';
      if (deadline) return `请在 ${deadline} 前确认，接单将扣除信息服务费。`;
      return '接单将扣除信息服务费，请确保余额充足。';
    },
  },
  onLoad(options) {
    if (!requireLogin()) return;
    this.orderId = options.orderId;
  },
  onShow() {
    this.load();
  },
  methods: {
    dateText,
    yuanText,
    statusClass,
    action(key, label, className, handler, danger = false) {
      return { key, label, className, handler, danger };
    },
    runFooterAction(action) {
      this.showMoreActions = false;
      if (action && typeof action.handler === 'function') {
        action.handler();
      }
    },
    contactText(name, phone) {
      const safeName = name || '未填写';
      const safePhone = phone || '未填写';
      return `${safeName} ${safePhone}`;
    },
    formatOrderAddress(type) {
      const prefix = type === 'origin' ? 'origin' : 'destination';
      const parts = [
        this.order[`${prefix}ProvinceName`],
        this.order[`${prefix}CityName`],
        this.order[`${prefix}DistrictName`],
        this.order[`${prefix}AddressDetail`],
      ].filter(Boolean);
      return parts.length ? parts.join('') : '未填写详细位置';
    },
    hasPickupDriver() {
      return Boolean(
        this.order.driverInfo &&
        this.order.driverInfo.driverName &&
        this.order.driverInfo.driverPhone,
      );
    },
    promptSetPickupDriver() {
      uni.showModal({
        title: '请先设置提车司机',
        content: '确认提车前必须先设置提车司机。您可以立即设置，也可以稍后再操作。',
        confirmText: '去设置',
        cancelText: '稍后',
        confirmColor: '#1677ff',
        success: (res) => {
          if (res.confirm) {
            this.setDriver('PICKUP');
          }
        },
      });
    },
    async load() {
      try {
        const data = await api.orderDetail(this.orderId);
        this.order = data.order || {};
        this.vehicles = data.vehicles || [];

        // Sort logs so latest is first
        const rawLogs = data.logs || [];
        this.logs = rawLogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Recover file URLs
        this.pickupUrls = [];
        this.handoverUrls = [];
        if (data.mediaFiles) {
          data.mediaFiles.forEach((m) => {
            if (m.usageScene === 'PICKUP_INSPECTION') {
              this.pickupUrls.push(m.fileUrl);
            } else if (m.usageScene === 'HANDOVER_PHOTO') {
              this.handoverUrls.push(m.fileUrl);
            }
          });
        }
        await this.loadCompensation();
      } catch (err) {
        console.error(err);
      }
    },
    async loadCompensation() {
      try {
        const data = await api.compensationClaims(this.orderId);
        this.compensationClaim = (data.items || [])[0] || null;
      } catch (err) {
        this.compensationClaim = null;
      }
    },
    previewImg(url) {
      uni.previewImage({ urls: [url] });
    },
    async contactDealerDirect() {
      try {
        const res = await api.getContactPhone(this.orderId);
        uni.showModal({
          title: '拨打电话咨询',
          content: `联系人: ${res.contactName || '车商客户'}\n电话: ${res.phone}`,
          confirmColor: '#1677ff',
          confirmText: '拨打',
          success: (mRes) => {
            if (mRes.confirm) {
              uni.makePhoneCall({ phoneNumber: res.phone });
            }
          },
        });
      } catch (err) {
        // error handled in api.js
      }
    },
    async confirmOrder() {
      uni.showModal({
        title: '确认接单提示',
        content: '确认承接此托运订单吗？确认后系统将自动扣除信息服务费，且信息费不予退还。',
        confirmColor: '#1677ff',
        success: async (res) => {
          if (res.confirm) {
            try {
              await api.carrierConfirm(this.orderId);
              uni.showToast({ title: '确认接单成功', icon: 'success' });
              this.load();
            } catch (err) {
              if (err?.code === 'ORDER_CONFIRM_EXPIRED') {
                uni.showModal({
                  title: '确认已超时',
                  content: '订单确认已超时，无法再确认。可联系车商重新下单或取消当前订单。',
                  showCancel: false,
                  confirmColor: '#1677ff',
                  confirmText: '我知道了',
                  success: () => {
                    this.load();
                  },
                });
                return;
              }
              console.error(err);
            }
          }
        },
      });
    },
    cancelOrderDirect() {
      uni.navigateTo({ url: `/pages/order/cancel-request?orderId=${this.orderId}&direct=1` });
    },
    setDriver(driverType = 'PICKUP') {
      uni.navigateTo({
        url: `/pages/order/driver-form?orderId=${this.orderId}&driverType=${driverType}`,
      });
    },
    goPickup() {
      if (!this.hasPickupDriver()) {
        this.promptSetPickupDriver();
        return;
      }
      uni.navigateTo({ url: `/pages/order/pickup?orderId=${this.orderId}` });
    },
    reportLocation() {
      uni.navigateTo({ url: `/pages/order/transit-location?orderId=${this.orderId}` });
    },
    goHandover() {
      uni.navigateTo({ url: `/pages/order/handover?orderId=${this.orderId}` });
    },
    goCancel() {
      uni.navigateTo({ url: `/pages/order/cancel-request?orderId=${this.orderId}` });
    },
    goCancelHandle() {
      uni.navigateTo({ url: `/pages/order/cancel-handle?orderId=${this.orderId}` });
    },
    goCompensationHandle() {
      if (!this.compensationClaim?.id) return;
      uni.navigateTo({
        url: `/pages/order/compensation-handle?claimId=${this.compensationClaim.id}`,
      });
    },
    compensationStatusText(status) {
      const map = {
        PENDING_CARRIER: '待处理',
        CARRIER_APPROVED: '已同意',
        CARRIER_REJECTED: '已拒绝',
        PLATFORM_PENDING: '平台介入中',
        PLATFORM_APPROVED: '平台已通过',
        PLATFORM_REJECTED: '平台已驳回',
        CANCELED: '已撤销',
      };
      return map[status] || status || '-';
    },
    goCancelLogs() {
      this.viewNegotiationHistory();
    },
    async viewNegotiationHistory() {
      try {
        const data = await api.negotiationHistory(this.orderId);
        const logs = data.items || [];
        if (!logs.length) {
          uni.showModal({
            title: '协商历史',
            content: '该订单暂无协商记录',
            showCancel: false,
            confirmColor: '#1677ff',
          });
          return;
        }
        let txt = '';
        logs.forEach((item, index) => {
          txt += `[${index + 1}] ${item.historyType === 'COMPENSATION' ? '赔付' : '取消'} - ${this.translateNegotiationAction(item)}\n`;
          txt += `操作方: ${item.actorType === 'CARRIER' ? '我方承运商' : item.actorType === 'DEALER' ? '车商客户' : '平台'}\n`;
          if (item.claimNo) txt += `赔付申请: ${item.claimNo}\n`;
          if (item.reason || item.remark) txt += `说明: ${item.reason || item.remark}\n`;
          if (item.amountCent !== null && item.amountCent !== undefined) {
            txt += `金额: ${this.yuanText(item.amountCent)}\n`;
          }
          txt += `时间: ${this.dateText(item.createdAt)}\n\n`;
        });
        uni.showModal({
          title: '协商历史',
          content: txt,
          showCancel: false,
          confirmColor: '#1677ff',
        });
      } catch (err) {}
    },
    translateNegotiationAction(item) {
      const status = item.actionType;
      if (item.historyType === 'COMPENSATION' && status === 'REQUEST') {
        return '发起赔付申请';
      }
      const map = {
        REQUEST: '发起申请',
        APPROVED: '同意取消',
        REJECTED: '拒绝取消',
        WITHDRAW: '撤回取消',
        WITHDRAWN: '已撤回',
        CLOSED: '关闭申请',
        CARRIER_APPROVE: '同意赔付',
        CARRIER_REJECT: '拒绝赔付',
        REQUEST_PLATFORM: '申请平台介入',
        PLATFORM_APPROVE: '平台通过赔付',
        PLATFORM_REJECT: '平台驳回赔付',
        MARK_OFFLINE_PAID: '平台标记线下打款',
      };
      return map[status] || status;
    },
    getLogStatusClass(actionType) {
      if (
        [
          'RECEIPT_CONFIRM',
          'COMPLETED',
          'HANDOVER_CONFIRM',
          'CONTRACT_SIGN',
          'GUARANTEE_PAID',
          'CONFIRM_CONTRACT',
          'AUTO_RECEIPT',
          'CANCEL_APPROVED',
        ].includes(actionType)
      ) {
        return 'status-success';
      }
      if (
        [
          'CANCEL_REQUEST',
          'CANCEL_HANDLE',
          'FORCE_CANCEL',
          'ADMIN_FORCE_CANCEL',
          'DIRECT_CANCEL',
          'CANCEL_REJECTED',
        ].includes(actionType)
      ) {
        return 'status-danger';
      }
      if (
        [
          'PICKUP_CONFIRM',
          'TRANSIT_REPORT',
          'SET_DRIVER',
          'PICKUP',
          'TRANSIT_LOCATION',
          'HANDOVER',
        ].includes(actionType)
      ) {
        return 'status-info';
      }
      return 'status-warning';
    },
    logActionText(actionType) {
      return formatOrderLogAction(actionType);
    },
  },
};
</script>

<style>
.order-detail-page {
  padding: 24rpx;
  padding-bottom: calc(170rpx + env(safe-area-inset-bottom));
  background-color: #f8fafc;
}

.order-hero-card {
  padding: 44rpx 36rpx;
  border-radius: var(--radius-lg);
  color: #ffffff;
  margin-bottom: 24rpx;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10rpx 24rpx rgba(0, 0, 0, 0.05);
}

.hero-status-row {
  display: flex;
  align-items: center;
  gap: 28rpx;
}

.hero-status-icon {
  width: 54rpx;
  height: 54rpx;
  flex-shrink: 0;
  border-radius: 16rpx;
  padding: 8rpx;
  background: rgba(255, 255, 255, 0.88);
}

.hero-status-meta {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.hero-status-title {
  font-size: 38rpx;
  font-weight: 900;
}

.hero-order-no {
  font-size: 22rpx;
  opacity: 0.85;
  font-family: monospace;
}

.hero-tip-bar {
  margin-top: 24rpx;
  padding: 12rpx 24rpx;
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.15);
  font-size: 22rpx;
  line-height: 1.4;
}

.order-hero-card.warning {
  background: linear-gradient(135deg, #60a5fa, #1677ff);
}
.order-hero-card.in-transit {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
}
.order-hero-card.completed {
  background: linear-gradient(135deg, #16a34a, #15803d);
}
.order-hero-card.canceled {
  background: linear-gradient(135deg, #94a3b8, #64748b);
}

.footer-alert-notice-text {
  font-size: 22rpx;
  color: #dc2626;
  text-align: center;
  padding: 10rpx 0 20rpx;
  font-weight: bold;
}

.dealer-summary-card {
  padding: 30rpx 32rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
}

.dealer-summary-main {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 18rpx;
  flex: 1;
}

.dealer-summary-icon {
  width: 46rpx;
  height: 46rpx;
  flex-shrink: 0;
}

.dealer-summary-name {
  min-width: 0;
  flex: 1;
  color: #111827;
  font-size: 32rpx;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dealer-contact-btn {
  margin: 0;
  padding: 0;
  height: 52rpx;
  line-height: 52rpx;
  background: transparent;
  border: 0;
  color: #ef4444;
  font-size: 26rpx;
  font-weight: 700;
  flex-shrink: 0;
}

.dealer-contact-btn::after {
  border: 0;
}

.detail-route-flow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
  border-radius: var(--radius-md);
  background: #f9fafb;
  margin-bottom: 30rpx;
  border: 1rpx solid #f1f5f9;
}

.flow-node {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.flow-node.text-right {
  text-align: right;
  align-items: flex-end;
}

.flow-city {
  font-size: 34rpx;
  font-weight: 800;
  color: #111827;
}

.flow-role-lbl {
  font-size: 20rpx;
  color: #9ca3af;
}

.flow-connector {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.flow-bar {
  width: 100%;
  height: 2rpx;
  background: #e5e7eb;
}

.flow-icon {
  width: 34rpx;
  height: 34rpx;
  position: absolute;
  top: -26rpx;
  background: #f9fafb;
  padding: 0 6rpx;
}

.flow-mode-tag {
  font-size: 18rpx;
  color: #9ca3af;
  margin-top: 8rpx;
  font-weight: bold;
}

.detail-grid-info {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 26rpx;
}

.border-bottom-mini {
  border-bottom: 1rpx solid #f3f4f6;
  padding-bottom: 16rpx;
}

.detail-label {
  color: #4b5563;
}

.detail-value {
  color: #111827;
  font-weight: 500;
}

.detail-value.text-bold {
  font-weight: bold;
}

.detail-value.price-highlight {
  color: #ef4444;
  font-size: 32rpx;
  font-weight: 900;
}

.contact-lbl-block {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.bullet-tag {
  font-size: 16rpx;
}

.bullet-tag.orange {
  color: #f97316;
}

.bullet-tag.blue {
  color: #2563eb;
}

.contact-role-name {
  font-size: 26rpx;
  color: #4b5563;
  font-weight: bold;
}

.service-info-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.service-info-item {
  padding: 22rpx 24rpx;
  border: 1rpx solid #f1f5f9;
  border-radius: var(--radius-md);
  background: #f9fafb;
}

.service-info-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 18rpx;
}

.service-info-title {
  font-size: 28rpx;
  font-weight: 800;
  color: #111827;
}

.detail-row.service-address-row {
  align-items: flex-start;
  gap: 24rpx;
}

.service-address {
  flex: 1;
  text-align: right;
  line-height: 1.45;
  word-break: break-all;
}

.detail-vehicle-item {
  border: 1rpx solid #f3f4f6;
  border-radius: var(--radius-md);
  padding: 24rpx;
  margin-bottom: 20rpx;
  background: #f9fafb;
}

.detail-vehicle-item:last-child {
  margin-bottom: 0;
}

.vehicle-head {
  display: flex;
  align-items: center;
  gap: 16rpx;
  border-bottom: 1rpx solid #f3f4f6;
  padding-bottom: 16rpx;
  margin-bottom: 18rpx;
}

.vehicle-icon {
  width: 34rpx;
  height: 34rpx;
  flex-shrink: 0;
}

.vehicle-title {
  font-size: 28rpx;
  color: #111827;
}

.vehicle-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.vehicle-col {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.veh-lbl {
  font-size: 20rpx;
  color: #9ca3af;
}

.veh-val {
  font-size: 26rpx;
  color: #4b5563;
}

.mini-tag-v2 {
  min-height: 38rpx !important;
  font-size: 20rpx !important;
  padding: 0 12rpx !important;
  border-radius: 6rpx !important;
  line-height: 1.5;
}

.driver-block {
  margin-bottom: 24rpx;
}

.driver-block.separator {
  border-top: 1rpx solid #f1f5f9;
  padding-top: 24rpx;
  margin-bottom: 0;
}

.driver-role-title {
  font-size: 26rpx;
  font-weight: bold;
  color: #111827;
  margin-bottom: 12rpx;
}

.locations-timeline {
  display: flex;
  flex-direction: column;
  padding-left: 20rpx;
}

.loc-item {
  display: flex;
  gap: 24rpx;
  padding-bottom: 24rpx;
}

.loc-item:last-child {
  padding-bottom: 0;
}

.loc-bullet-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 16rpx;
}

.loc-bullet {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: #1677ff;
  margin-top: 10rpx;
}

.loc-trail {
  flex: 1;
  width: 2rpx;
  background: #dbeafe;
  margin-top: 6rpx;
}

.loc-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.loc-title {
  font-size: 26rpx;
  color: #111827;
}

.loc-time {
  font-size: 20rpx;
  color: #9ca3af;
}

.loc-detail {
  font-size: 24rpx;
  color: #4b5563;
}

.loc-remark {
  font-size: 22rpx;
  color: #9ca3af;
  background-color: #f9fafb;
  padding: 8rpx 12rpx;
  border-radius: 6rpx;
  margin-top: 4rpx;
}

.detail-footer-actions {
  padding-top: 18rpx;
}

.compact-actions {
  gap: 14rpx;
}

.footer-action-btn {
  flex: 1;
  min-width: 0;
  min-height: 84rpx !important;
  font-size: 28rpx !important;
  padding: 0 22rpx !important;
  border-radius: 12rpx !important;
  margin: 0 !important;
  box-shadow: none !important;
}

.primary-action {
  flex: 1.35;
}

.more-action-btn {
  width: 104rpx;
  min-width: 104rpx;
  min-height: 84rpx !important;
  padding: 0 !important;
  border-radius: 12rpx !important;
  flex-direction: column;
  gap: 2rpx;
  font-size: 20rpx !important;
  margin: 0 !important;
  box-shadow: none !important;
}

.more-action-icon {
  width: 32rpx;
  height: 24rpx;
}

.more-actions-drawer {
  padding-top: 30rpx;
}

.more-action-item {
  min-height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1rpx solid #f1f5f9;
}

.more-action-item:last-child {
  border-bottom: 0;
}

.more-action-label {
  color: #111827;
  font-size: 28rpx;
  font-weight: 600;
}

.more-action-item.danger .more-action-label {
  color: #dc2626;
}

.more-action-arrow {
  width: 28rpx;
  height: 28rpx;
}

.timeline-container {
  display: flex;
  flex-direction: column;
  padding-left: 20rpx;
}

.timeline-item {
  display: flex;
  gap: 30rpx;
  position: relative;
  padding-bottom: 36rpx;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-line-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  width: 20rpx;
}

.timeline-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #cbd5e1;
  z-index: 2;
  margin-top: 12rpx;
}

.timeline-dot.status-success {
  background: #16a34a;
}
.timeline-dot.status-danger {
  background: #dc2626;
}
.timeline-dot.status-info {
  background: #2563eb;
}
.timeline-dot.status-warning {
  background: #ea580c;
}

.timeline-item.latest .timeline-dot {
  background: #1677ff;
  box-shadow: 0 0 0 6rpx rgba(22, 119, 255, 0.2);
}
.timeline-item.latest .timeline-dot.status-success {
  box-shadow: 0 0 0 6rpx rgba(22, 163, 74, 0.2);
}
.timeline-item.latest .timeline-dot.status-danger {
  box-shadow: 0 0 0 6rpx rgba(220, 38, 38, 0.2);
}
.timeline-item.latest .timeline-dot.status-info {
  box-shadow: 0 0 0 6rpx rgba(37, 99, 235, 0.2);
}
.timeline-item.latest .timeline-dot.status-warning {
  box-shadow: 0 0 0 6rpx rgba(249, 115, 22, 0.2);
}

.timeline-trail-line {
  position: absolute;
  top: 28rpx;
  bottom: -28rpx;
  width: 2rpx;
  background: #e2e8f0;
  z-index: 1;
}

.timeline-content {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  flex: 1;
}

.timeline-action {
  font-size: 28rpx;
  font-weight: 750;
  color: #111827;
}

.timeline-item.latest .timeline-action {
  color: #1677ff;
}

.timeline-remark {
  font-size: 24rpx;
  color: #4b5563;
  background: #f9fafb;
  padding: 12rpx 20rpx;
  border-radius: var(--radius-sm);
  line-height: 1.4;
  border: 1rpx solid #f3f4f6;
}

.timeline-time {
  font-size: 20rpx;
  color: #9ca3af;
}

.actions-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.button-row {
  display: flex;
  gap: 20rpx;
}

.w-full {
  width: 100%;
}

.empty-media-text {
  margin-top: 16rpx;
  padding: 24rpx;
  border-radius: var(--radius-md);
  background: #f9fafb;
  color: #9ca3af;
  font-size: 24rpx;
  text-align: center;
}
</style>
