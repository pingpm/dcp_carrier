<template>
  <view class="page route-list-page">
    <view
      v-if="verification.reviewStatus !== 'APPROVED'"
      class="notice-bar warning"
      @click="goStatus"
    >
      <image class="notice-icon-img" src="/static/icons/alert-triangle.svg" mode="aspectFit" />
      <text class="notice-text">资质未完成审核，添加的线路不会对车商公开展示</text>
      <text class="notice-action">去认证</text>
      <image class="arrow-icon" src="/static/icons/arrow-right.svg" mode="aspectFit" />
    </view>

    <view v-if="availableRouteTypes.length > 1" class="segmented-control section">
      <view
        v-if="canManageRouteType('LARGE_TRUCK')"
        class="segment-item"
        :class="{ active: activeType === 'LARGE_TRUCK' }"
        @click="switchType('LARGE_TRUCK')"
      >
        大板线路
      </view>
      <view
        v-if="canManageRouteType('SMALL_TRUCK')"
        class="segment-item"
        :class="{ active: activeType === 'SMALL_TRUCK' }"
        @click="switchType('SMALL_TRUCK')"
      >
        小板线路
      </view>
      <view
        v-if="canManageRouteType('DRIVING')"
        class="segment-item"
        :class="{ active: activeType === 'DRIVING' }"
        @click="switchType('DRIVING')"
      >
        代驾线路
      </view>
    </view>

    <view v-if="routes.length" class="section route-toolbar">
      <view class="filter-summary-row" @click="openFilterPanel">
        <view class="filter-summary-main">
          <image class="summary-icon" src="/static/icons/filter.svg" mode="aspectFit" />
          <text class="filter-city">{{ originFilterText }}</text>
          <text class="filter-arrow">→</text>
          <text class="filter-city">{{ destinationFilterText }}</text>
        </view>
        <view class="filter-summary-side">
          <text v-if="hasFilter" class="filter-count">{{ filteredRoutes.length }}条</text>
          <text class="filter-action">筛选</text>
        </view>
      </view>

      <scroll-view class="origin-province-tabs" scroll-x show-scrollbar="false">
        <view class="origin-province-tab-row">
          <view
            v-for="tab in originProvinceTabs"
            :key="tab.key"
            class="origin-province-tab"
            :class="{ active: activeOriginProvinceKey === tab.key }"
            @click.stop="switchOriginProvince(tab.key)"
          >
            {{ tab.label }}（{{ tab.count }}）
          </view>
        </view>
      </scroll-view>
    </view>

    <view v-if="routes.length === 0" class="section empty-routes-card">
      <image class="empty-icon" src="/static/icons/map.svg" mode="aspectFit" />
      <text class="empty-text">暂无配置的承运线路</text>
      <text class="empty-subtext"
        >配置承运线路及报价时段，车商客户搜索该线路时将能直连联系您。</text
      >
      <button class="primary-btn empty-btn" @click="goAdd">立即添加线路</button>
    </view>
    <view v-else-if="filteredRoutes.length === 0" class="section empty-routes-card compact-empty">
      <image class="empty-icon" src="/static/icons/map.svg" mode="aspectFit" />
      <text class="empty-text">没有匹配的线路</text>
      <text class="empty-subtext">试试调整起始地、目的地、状态或来源。</text>
      <button class="plain-btn empty-btn" @click="resetFilters">清空筛选</button>
    </view>

    <block v-else>
      <view
        v-for="route in filteredRoutes"
        :key="route.id"
        class="section route-card"
        :class="{ closed: route.routeStatus === 'CLOSED' }"
        @click="goEdit(route)"
      >
        <view class="row-between card-header">
          <view class="row align-center">
            <text class="route-badge">{{ routeTypeShortText(route.routeType) }}</text>
            <text
              class="route-source-tag font-bold"
              :class="route.source === 'ADMIN_ASSIGNED' ? 'admin' : 'self'"
            >
              {{ route.source === 'ADMIN_ASSIGNED' ? '平台分配' : '自主录入' }}
            </text>
          </view>

          <text
            class="status-tag"
            :class="route.routeStatus === 'ACTIVE' ? 'status-success' : 'status-danger'"
          >
            {{ route.routeStatus === 'ACTIVE' ? '展示中' : '已关闭' }}
          </text>
        </view>

        <view class="route-cities">
          <view class="city-name">{{ route.originCityName }}</view>
          <text class="route-flow-arrow">→</text>
          <view class="city-name">{{ route.destinationCityName }}</view>
        </view>

        <view class="route-meta-row row-between">
          <view class="route-meta-item">
            <text class="meta-label">预计时效: </text>
            <text class="meta-val font-bold">{{ route.durationText || '电话沟通' }}</text>
          </view>
          <view class="route-meta-item text-right">
            <text class="meta-label">托运参考价: </text>
            <text class="meta-price font-bold" v-if="activeType === 'LARGE_TRUCK'">
              {{ route.fixedPriceCent ? yuanText(route.fixedPriceCent) : '电话联系' }}
            </text>
            <text class="meta-price font-bold" v-else>
              起步价: {{ route.startPriceCent ? yuanText(route.startPriceCent) : '电话联系' }}
            </text>
          </view>
        </view>

        <view class="card-actions-row">
          <button class="plain-btn card-mini-btn" @click.stop="goEdit(route)">编辑报价</button>
        </view>
      </view>
    </block>

    <view class="floating-action-button" @click="goAdd">
      <text class="fab-icon">+</text>
    </view>

    <view v-if="filterPanelVisible" class="drawer-mask" @click="closeFilterPanel"></view>
    <view v-if="filterPanelVisible" class="filter-drawer">
      <view class="drawer-handle"></view>
      <view class="drawer-header">
        <view>
          <text class="drawer-title">筛选线路</text>
          <text class="drawer-subtitle">按承运覆盖地、展示状态和来源管理线路</text>
        </view>
        <button class="drawer-close-btn" @click="closeFilterPanel">关闭</button>
      </view>

      <view class="drawer-section">
        <text class="drawer-label">起始地</text>
        <view class="drawer-picker-row">
          <button
            class="nation-btn"
            :class="{ active: draftFilters.originNationwide }"
            @click="setDraftNationwide('origin')"
          >
            全国
          </button>
          <view class="drawer-picker" @click="openOriginPicker">
            <text :class="{ placeholder: draftFilters.originNationwide }">
              {{ draftOriginText }}
            </text>
          </view>
        </view>
      </view>

      <view class="drawer-section">
        <text class="drawer-label">目的地</text>
        <view class="drawer-picker-row">
          <button
            class="nation-btn"
            :class="{ active: draftFilters.destinationNationwide }"
            @click="setDraftNationwide('destination')"
          >
            全国
          </button>
          <view class="drawer-picker" @click="openDestinationPicker">
            <text :class="{ placeholder: draftFilters.destinationNationwide }">
              {{ draftDestinationText }}
            </text>
          </view>
        </view>
      </view>

      <view class="drawer-section">
        <text class="drawer-label">线路状态</text>
        <view class="pill-row">
          <button
            v-for="item in statusOptions"
            :key="item.value"
            class="filter-pill"
            :class="{ active: draftFilters.routeStatus === item.value }"
            @click="draftFilters.routeStatus = item.value"
          >
            {{ item.label }}
          </button>
        </view>
      </view>

      <view class="drawer-section">
        <text class="drawer-label">线路来源</text>
        <view class="pill-row">
          <button
            v-for="item in sourceOptions"
            :key="item.value"
            class="filter-pill"
            :class="{ active: draftFilters.source === item.value }"
            @click="draftFilters.source = item.value"
          >
            {{ item.label }}
          </button>
        </view>
      </view>

      <view class="drawer-actions">
        <button class="plain-btn drawer-action-btn" @click="resetDraftFilters">重置</button>
        <button class="primary-btn drawer-action-btn" @click="applyFilters">应用筛选</button>
      </view>
    </view>

    <region-picker ref="originPicker" title="选择起始地" @select="selectOrigin" />
    <region-picker ref="destinationPicker" title="选择目的地" @select="selectDestination" />
    <miniapp-login-sheet ref="loginSheet" @success="handleLoginSuccess" />
  </view>
</template>

<script>
import { miniappLoginPageMixin } from '../../utils/miniapp-login-page.js';
import { api, requireLogin } from '../../utils/api.js';
import { yuanText } from '../../utils/format.js';
import RegionPicker from '../../components/region-picker/region-picker.vue';

function createDefaultFilters() {
  return {
    originNationwide: true,
    originProvinceId: '',
    originProvinceName: '',
    originCityId: '',
    originCityName: '',
    destinationNationwide: true,
    destinationProvinceId: '',
    destinationProvinceName: '',
    destinationCityId: '',
    destinationCityName: '',
    routeStatus: 'ALL',
    source: 'ALL',
  };
}

export default {
  mixins: [miniappLoginPageMixin],
  components: {
    RegionPicker,
  },
  data() {
    return {
      activeType: 'LARGE_TRUCK',
      routes: [],
      verification: { reviewStatus: 'UNVERIFIED' },
      filters: createDefaultFilters(),
      draftFilters: createDefaultFilters(),
      activeOriginProvinceKey: 'ALL',
      filterPanelVisible: false,
      statusOptions: [
        { label: '展示中', value: 'ACTIVE' },
      ],
      sourceOptions: [
        { label: '全部', value: 'ALL' },
        { label: '自主录入', value: 'CARRIER_CREATED' },
        { label: '平台分配', value: 'ADMIN_ASSIGNED' },
      ],
    };
  },
  onShow() {
    if (requireLogin()) {
      this.loadStatus();
    }
  },
  methods: {
    yuanText,
    routeTypeShortText(type) {
      const map = { LARGE_TRUCK: '大板', SMALL_TRUCK: '小板', DRIVING: '代驾' };
      return map[type] || '线路';
    },
    canManageRouteType(type) {
      return this.availableRouteTypes.includes(type);
    },
    async loadStatus() {
      try {
        this.verification = await api.verificationStatus({ silent: true, authRedirect: false });
        if (!this.canManageRouteType(this.activeType)) {
          this.activeType = this.availableRouteTypes[0] || 'SMALL_TRUCK';
        }
        await this.load();
      } catch (err) {
        this.verification = { reviewStatus: 'UNVERIFIED' };
        this.routes = [];
      }
    },
    async load() {
      try {
        const res = await api.routes(
          { routeType: this.activeType, routeStatus: 'ACTIVE' },
          { silent: true, authRedirect: false },
        );
        this.routes = res.items || [];
        this.ensureActiveProvinceTab();
      } catch (err) {
        this.routes = [];
        this.activeOriginProvinceKey = 'ALL';
      }
    },
    switchType(type) {
      if (!this.canManageRouteType(type)) return;
      this.activeType = type;
      this.resetFilters();
      this.load();
    },
    openFilterPanel() {
      this.draftFilters = { ...this.filters };
      this.filterPanelVisible = true;
    },
    closeFilterPanel() {
      this.filterPanelVisible = false;
    },
    openOriginPicker() {
      this.$refs.originPicker.open();
    },
    openDestinationPicker() {
      this.$refs.destinationPicker.open();
    },
    selectOrigin(region) {
      this.draftFilters = {
        ...this.draftFilters,
        originNationwide: false,
        originProvinceId: region.provinceId,
        originProvinceName: region.provinceName,
        originCityId: region.cityId,
        originCityName: region.cityName,
      };
    },
    selectDestination(region) {
      this.draftFilters = {
        ...this.draftFilters,
        destinationNationwide: false,
        destinationProvinceId: region.provinceId,
        destinationProvinceName: region.provinceName,
        destinationCityId: region.cityId,
        destinationCityName: region.cityName,
      };
    },
    setDraftNationwide(type) {
      if (type === 'origin') {
        this.draftFilters = {
          ...this.draftFilters,
          originNationwide: true,
          originProvinceId: '',
          originProvinceName: '',
          originCityId: '',
          originCityName: '',
        };
        return;
      }
      this.draftFilters = {
        ...this.draftFilters,
        destinationNationwide: true,
        destinationProvinceId: '',
        destinationProvinceName: '',
        destinationCityId: '',
        destinationCityName: '',
      };
    },
    resetDraftFilters() {
      this.draftFilters = createDefaultFilters();
    },
    applyFilters() {
      this.filters = { ...this.draftFilters };
      this.filterPanelVisible = false;
      this.ensureActiveProvinceTab();
    },
    resetFilters() {
      this.filters = createDefaultFilters();
      this.draftFilters = createDefaultFilters();
      this.activeOriginProvinceKey = 'ALL';
    },
    switchOriginProvince(key) {
      this.activeOriginProvinceKey = key;
    },
    getOriginProvinceKey(route) {
      const id = route.originProvinceId || route.originProvinceName || '';
      return String(id);
    },
    ensureActiveProvinceTab() {
      if (this.activeOriginProvinceKey === 'ALL') return;
      const exists = this.originProvinceTabs.some(
        (tab) => tab.key === this.activeOriginProvinceKey,
      );
      if (!exists) {
        this.activeOriginProvinceKey = 'ALL';
      }
    },
    goStatus() {
      const url =
        this.verification.reviewStatus === 'PENDING'
          ? '/pages/verification/status'
          : '/pages/verification/form';
      uni.navigateTo({ url });
    },
    goAdd() {
      const caps = this.verification.serviceCapabilities || [];
      if (!caps.includes(this.activeType)) {
        const nameMap = { LARGE_TRUCK: '大板线路', SMALL_TRUCK: '小板线路', DRIVING: '代驾线路' };
        uni.showModal({
          title: '线路类型不可用',
          content: `当前认证资料不支持添加【${nameMap[this.activeType]}】，请先调整服务能力并通过审核。`,
          confirmText: '去认证页',
          confirmColor: '#1677ff',
          success: (res) => {
            if (res.confirm) {
              this.goStatus();
            }
          },
        });
        return;
      }
      uni.navigateTo({ url: `/pages/route/form?type=${this.activeType}` });
    },
    goEdit(route) {
      uni.navigateTo({ url: `/pages/route/form?routeId=${route.id}&type=${route.routeType}` });
    },
  },
  computed: {
    originFilterText() {
      if (this.filters.originNationwide) return '全国';
      return this.filters.originCityName
        ? `${this.filters.originProvinceName} · ${this.filters.originCityName}`
        : '选择起始地';
    },
    destinationFilterText() {
      if (this.filters.destinationNationwide) return '全国';
      return this.filters.destinationCityName
        ? `${this.filters.destinationProvinceName} · ${this.filters.destinationCityName}`
        : '选择目的地';
    },
    draftOriginText() {
      if (this.draftFilters.originNationwide) return '选择省市';
      return this.draftFilters.originCityName
        ? `${this.draftFilters.originProvinceName} · ${this.draftFilters.originCityName}`
        : '选择省市';
    },
    draftDestinationText() {
      if (this.draftFilters.destinationNationwide) return '选择省市';
      return this.draftFilters.destinationCityName
        ? `${this.draftFilters.destinationProvinceName} · ${this.draftFilters.destinationCityName}`
        : '选择省市';
    },
    hasFilter() {
      return (
        !this.filters.originNationwide ||
        !this.filters.destinationNationwide ||
        this.filters.routeStatus !== 'ALL' ||
        this.filters.source !== 'ALL' ||
        this.activeOriginProvinceKey !== 'ALL'
      );
    },
    baseFilteredRoutes() {
      return this.routes.filter((route) => {
        const originMatched =
          this.filters.originNationwide ||
          String(route.originCityId || '') === String(this.filters.originCityId);
        const destinationMatched =
          this.filters.destinationNationwide ||
          String(route.destinationCityId || '') === String(this.filters.destinationCityId);
        const statusMatched =
          this.filters.routeStatus === 'ALL' || route.routeStatus === this.filters.routeStatus;
        const sourceMatched = this.filters.source === 'ALL' || route.source === this.filters.source;
        return originMatched && destinationMatched && statusMatched && sourceMatched;
      });
    },
    filteredRoutes() {
      if (this.activeOriginProvinceKey === 'ALL') return this.baseFilteredRoutes;
      return this.baseFilteredRoutes.filter(
        (route) => this.getOriginProvinceKey(route) === this.activeOriginProvinceKey,
      );
    },
    originProvinceTabs() {
      const provinceMap = new Map();
      this.baseFilteredRoutes.forEach((route) => {
        const key = this.getOriginProvinceKey(route);
        if (!key || !route.originProvinceName) return;
        if (!provinceMap.has(key)) {
          provinceMap.set(key, {
            key,
            label: route.originProvinceName,
            count: 0,
          });
        }
        provinceMap.get(key).count += 1;
      });
      return [
        { key: 'ALL', label: '全部', count: this.baseFilteredRoutes.length },
        ...Array.from(provinceMap.values()),
      ];
    },
    availableRouteTypes() {
      const caps = this.verification.serviceCapabilities || [];
      const allowed = ['LARGE_TRUCK', 'SMALL_TRUCK', 'DRIVING'].filter((type) =>
        caps.includes(type),
      );
      if (allowed.length) return allowed;
      if (this.verification.companyType === 'ROADSIDE_RESCUE') return ['SMALL_TRUCK', 'DRIVING'];
      return ['LARGE_TRUCK', 'SMALL_TRUCK', 'DRIVING'];
    },
  },
};
</script>

<style>
.route-list-page {
  padding: 30rpx;
  padding-bottom: calc(160rpx + env(safe-area-inset-bottom));
}

.segmented-control {
  display: flex;
  padding: 8rpx !important;
  background-color: #f1f5f9 !important;
  border-radius: var(--radius-lg);
  margin-bottom: 24rpx;
}

.segment-item {
  flex: 1;
  text-align: center;
  font-size: 26rpx;
  color: #4b5563;
  font-weight: 700;
  padding: 16rpx 0;
  border-radius: var(--radius-md);
}

.segment-item.active {
  background-color: #ffffff;
  color: #1677ff;
  box-shadow: 0 4rpx 12rpx rgba(17, 24, 39, 0.05);
}

.route-toolbar {
  padding: 20rpx 24rpx;
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.filter-summary-row {
  min-height: 68rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.filter-summary-main,
.filter-summary-side {
  min-width: 0;
  display: flex;
  align-items: center;
}

.filter-summary-main {
  flex: 1;
  gap: 12rpx;
}

.summary-icon {
  flex-shrink: 0;
  width: 34rpx;
  height: 34rpx;
}

.filter-city {
  max-width: 210rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #111827;
  font-size: 26rpx;
  font-weight: 800;
}

.filter-arrow {
  color: #94a3b8;
  font-size: 26rpx;
  font-weight: 800;
}

.filter-summary-side {
  flex-shrink: 0;
  gap: 8rpx;
  color: #1677ff;
  font-size: 23rpx;
  font-weight: 800;
}

.filter-count {
  color: #64748b;
  font-weight: 700;
}

.origin-province-tabs {
  width: 100%;
  padding-top: 18rpx;
  border-top: 1rpx solid #eef2f7;
  white-space: nowrap;
}

.origin-province-tab-row {
  display: inline-flex;
  align-items: center;
  gap: 14rpx;
  min-width: 100%;
}

.origin-province-tab {
  flex-shrink: 0;
  height: 56rpx;
  line-height: 56rpx;
  padding: 0 22rpx;
  border-radius: 28rpx;
  background: #f8fafc;
  border: 1rpx solid #e2e8f0;
  color: #475569;
  font-size: 23rpx;
  font-weight: 800;
}

.origin-province-tab.active {
  color: #1677ff;
  background: #eff6ff;
  border-color: #93c5fd;
}

.empty-routes-card {
  padding: 140rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.compact-empty {
  padding: 80rpx 40rpx;
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
  min-width: 240rpx;
  height: 80rpx;
}

.route-card {
  position: relative;
  padding: 30rpx;
  border: 1rpx solid rgba(229, 231, 235, 0.5);
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease,
    border-color 0.16s ease;
}

.route-card::after {
  content: '›';
  position: absolute;
  right: 30rpx;
  top: 50%;
  transform: translateY(-50%);
  color: #cbd5e1;
  font-size: 42rpx;
  font-weight: 300;
}

.route-card:active {
  transform: scale(0.99);
  border-color: #bfdbfe;
  box-shadow: 0 8rpx 24rpx rgba(22, 119, 255, 0.08);
}

.route-card.closed {
  opacity: 0.65;
}

.card-header {
  border-bottom: 1rpx solid #f1f5f9;
  padding-bottom: 16rpx;
  margin-bottom: 20rpx;
}

.route-badge {
  font-size: 20rpx;
  background-color: #eff6ff;
  color: #1677ff;
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
  font-weight: bold;
}

.route-source-tag {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
}

.route-source-tag.admin {
  background-color: #fef3c7;
  color: #d97706;
}

.route-source-tag.self {
  background-color: #e2e8f0;
  color: #475569;
}

.route-cities {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.city-name {
  min-width: 0;
  font-size: 32rpx;
  font-weight: 800;
  color: #111827;
}

.route-flow-arrow {
  color: #94a3b8;
  font-size: 30rpx;
  font-weight: 900;
}

.route-meta-row {
  margin-bottom: 24rpx;
}

.meta-label {
  font-size: 22rpx;
  color: #9ca3af;
}

.meta-val {
  font-size: 26rpx;
  color: #374151;
}

.meta-price {
  font-size: 28rpx;
  color: #ef4444;
}

.card-actions-row {
  display: flex;
  justify-content: flex-end;
  gap: 16rpx;
  border-top: 1rpx dashed #f3f4f6;
  padding-top: 20rpx;
  padding-right: 40rpx;
}

.card-mini-btn {
  min-height: 60rpx !important;
  font-size: 22rpx !important;
  padding: 0 24rpx !important;
  border-radius: 30rpx !important;
  margin: 0 !important;
  box-shadow: none !important;
  border-width: 1rpx !important;
}

.danger-link-btn {
  color: #dc2626 !important;
  background: #fff !important;
  border-color: #fecaca !important;
}

.floating-action-button {
  position: fixed;
  right: 40rpx;
  bottom: calc(140rpx + env(safe-area-inset-bottom));
  width: 110rpx;
  height: 110rpx;
  border-radius: 50%;
  background: var(--primary-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12rpx 36rpx rgba(22, 119, 255, 0.4);
  z-index: 99;
}

.floating-action-button:active {
  transform: scale(0.95);
}

.fab-icon {
  font-size: 60rpx;
  color: #ffffff;
  font-weight: 300;
  line-height: 1;
}

.drawer-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 190;
  background: rgba(15, 23, 42, 0.42);
}

.filter-drawer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 200;
  max-height: 76vh;
  padding: 14rpx 30rpx calc(30rpx + env(safe-area-inset-bottom));
  border-radius: 28rpx 28rpx 0 0;
  background: #ffffff;
  box-shadow: 0 -16rpx 40rpx rgba(15, 23, 42, 0.16);
}

.drawer-handle {
  width: 72rpx;
  height: 8rpx;
  margin: 0 auto 20rpx;
  border-radius: 999rpx;
  background: #cbd5e1;
}

.drawer-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
  margin-bottom: 26rpx;
}

.drawer-title {
  display: block;
  color: #111827;
  font-size: 32rpx;
  font-weight: 900;
  line-height: 1.2;
}

.drawer-subtitle {
  display: block;
  margin-top: 8rpx;
  color: #64748b;
  font-size: 22rpx;
  line-height: 1.35;
}

.drawer-close-btn {
  flex-shrink: 0;
  margin: 0;
  padding: 0 22rpx;
  height: 58rpx;
  line-height: 58rpx;
  border-radius: 29rpx;
  background: #f1f5f9;
  color: #475569;
  font-size: 23rpx;
  font-weight: 800;
}

.drawer-close-btn::after,
.nation-btn::after,
.filter-pill::after {
  border: 0;
}

.drawer-section {
  margin-bottom: 24rpx;
}

.drawer-label {
  display: block;
  margin-bottom: 12rpx;
  color: #334155;
  font-size: 24rpx;
  font-weight: 800;
}

.drawer-picker-row {
  display: flex;
  gap: 12rpx;
}

.nation-btn {
  flex-shrink: 0;
  min-width: 110rpx;
  height: 72rpx;
  line-height: 72rpx;
  margin: 0;
  padding: 0 22rpx;
  border-radius: 12rpx;
  background: #f8fafc;
  color: #64748b;
  border: 1rpx solid #e2e8f0;
  font-size: 24rpx;
  font-weight: 800;
}

.nation-btn.active {
  background: #eff6ff;
  color: #1677ff;
  border-color: #93c5fd;
}

.drawer-picker {
  flex: 1;
  min-width: 0;
  height: 72rpx;
  padding: 0 22rpx;
  border-radius: 12rpx;
  border: 1rpx solid #e2e8f0;
  background: #f8fafc;
  color: #111827;
  font-size: 24rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
}

.drawer-picker .placeholder {
  color: #94a3b8;
  font-weight: 600;
}

.pill-row {
  display: flex;
  gap: 12rpx;
}

.filter-pill {
  flex: 1;
  height: 66rpx;
  line-height: 66rpx;
  margin: 0;
  padding: 0 8rpx;
  border-radius: 12rpx;
  background: #f8fafc;
  color: #64748b;
  border: 1rpx solid #e2e8f0;
  font-size: 23rpx;
  font-weight: 800;
}

.filter-pill.active {
  background: #eef6ff;
  color: #1677ff;
  border-color: #93c5fd;
}

.drawer-actions {
  display: flex;
  gap: 16rpx;
  padding-top: 8rpx;
}

.drawer-action-btn {
  flex: 1;
  height: 80rpx;
  margin: 0 !important;
}
</style>
