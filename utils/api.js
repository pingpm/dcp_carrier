import { API_BASE_URL } from '../config/api';

const TOKEN_KEY = 'carrier_token';
const PROFILE_KEY = 'carrier_profile';

export function getToken() {
  return uni.getStorageSync(TOKEN_KEY) || '';
}

export function setSession(data) {
  uni.setStorageSync(TOKEN_KEY, data.token);
  uni.setStorageSync(PROFILE_KEY, data);
}

export function clearSession() {
  uni.removeStorageSync(TOKEN_KEY);
  uni.removeStorageSync(PROFILE_KEY);
}

export function getSession() {
  return uni.getStorageSync(PROFILE_KEY) || null;
}

export function requireLogin() {
  if (!getToken()) {
    uni.reLaunch({ url: '/pages/auth/login' });
    return false;
  }
  return true;
}

export function request(options) {
  const token = getToken();
  const header = {
    ...(options.header || {}),
  };
  if (token) {
    header.Authorization = `Bearer ${token}`;
  }

  return new Promise((resolve, reject) => {
    uni.request({
      url: `${API_BASE_URL}${options.url}`,
      method: options.method || 'GET',
      data: options.data || {},
      header,
      success(res) {
        const body = res.data || {};
        if (res.statusCode >= 200 && res.statusCode < 300 && body.success) {
          resolve(body.data);
          return;
        }
        const message = body.message || '请求失败';
        if (res.statusCode === 401) {
          clearSession();
          if (options.authRedirect !== false) {
            uni.reLaunch({ url: '/pages/auth/login' });
          }
        }
        if (!options.silent) {
          uni.showToast({ title: message, icon: 'none' });
        }
        reject({ ...body, statusCode: res.statusCode, message });
      },
      fail(error) {
        if (!options.silent) {
          uni.showToast({ title: '网络连接失败', icon: 'none' });
        }
        reject(error);
      },
    });
  });
}

export function uploadFile(filePath, fileType, usageScene = '') {
  const token = getToken();
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: `${API_BASE_URL}/files`,
      filePath,
      name: 'file',
      formData: { fileType, usageScene },
      header: token ? { Authorization: `Bearer ${token}` } : {},
      success(res) {
        let body = {};
        try {
          body = JSON.parse(res.data);
        } catch (error) {
          reject(error);
          return;
        }
        if (res.statusCode >= 200 && res.statusCode < 300 && body.success) {
          resolve(body.data);
          return;
        }
        const message = body.message || '上传失败';
        uni.showToast({ title: message, icon: 'none' });
        reject(body);
      },
      fail(error) {
        uni.showToast({ title: '上传失败', icon: 'none' });
        reject(error);
      },
    });
  });
}

function normalizeRegionLevel(level) {
  if (level === '1') return 'PROVINCE';
  if (level === '2') return 'CITY';
  if (level === '3') return 'DISTRICT';
  return level;
}

export const api = {
  exampleImageConfigs() {
    return request({
      url: '/system-configs/example-images',
      authRedirect: false,
    });
  },
  carrierOrderMediaLimits() {
    return request({
      url: '/system-configs/carrier-order-media-limits',
      authRedirect: false,
    });
  },
  sendLoginCode(phone) {
    return request({
      url: '/auth/miniapp/verification-codes',
      method: 'POST',
      data: {
        appType: 'CARRIER_MINIAPP',
        phone,
      },
    });
  },
  login(phone, verificationCode) {
    return request({
      url: '/auth/miniapp/login',
      method: 'POST',
      data: {
        appType: 'CARRIER_MINIAPP',
        phone,
        verificationCode,
      },
    });
  },
  loginWithWechatCode(phone, verificationCode, wxCode) {
    return request({
      url: '/auth/miniapp/login',
      method: 'POST',
      data: {
        appType: 'CARRIER_MINIAPP',
        phone,
        verificationCode,
        wxCode,
      },
    });
  },
  me(options = {}) {
    return request({ url: '/auth/me', ...options });
  },
  verificationStatus(options = {}) {
    return request({ url: '/carrier/verification/status', ...options });
  },
  verificationDetail(params = {}) {
    const query = toQuery(params);
    return request({ url: `/carrier/verification${query ? `?${query}` : ''}` });
  },
  submitVerification(data) {
    return request({ url: '/carrier/verification', method: 'POST', data });
  },
  dashboard(options = {}) {
    return request({ url: '/carrier/dashboard', ...options });
  },
  companyProfile() {
    return request({ url: '/carrier/profile/company' });
  },
  saveCompanyProfile(data) {
    return request({ url: '/carrier/profile/company', method: 'PUT', data });
  },
  regions(parentId, level) {
    const params = {};
    if (parentId) params.parentId = parentId;
    const normalizedLevel = normalizeRegionLevel(level);
    if (normalizedLevel) params.level = normalizedLevel;
    const query = toQuery(params);
    return request({ url: `/regions${query ? `?${query}` : ''}` });
  },
  amapPoiSearch(params = {}) {
    return request({ url: `/map/amap/pois?${toQuery(params)}` });
  },
  amapRegeo(params = {}) {
    return request({ url: `/map/amap/regeo?${toQuery(params)}` });
  },
  routes(params = {}, options = {}) {
    return request({ url: `/carrier/routes?${toQuery(params)}`, ...options });
  },
  createRoute(data) {
    return request({ url: '/carrier/routes', method: 'POST', data });
  },
  updateRoute(routeId, data) {
    return request({ url: `/carrier/routes/${routeId}`, method: 'PUT', data });
  },
  closeRoute(routeId) {
    return request({ url: `/carrier/routes/${routeId}/close`, method: 'POST' });
  },
  tierTemplates() {
    return request({ url: '/carrier/tier-price-templates' });
  },
  createTierTemplate(data) {
    return request({ url: '/carrier/tier-price-templates', method: 'POST', data });
  },
  walletIndex(options = {}) {
    return request({ url: '/carrier/wallet', ...options });
  },
  recharge(data) {
    return request({ url: '/carrier/wallet/recharges', method: 'POST', data });
  },
  syncWechatPayment(paymentId) {
    return request({ url: `/payments/${paymentId}/wechat-sync`, method: 'POST' });
  },
  rechargeRecords(params = {}) {
    return request({ url: `/carrier/wallet/recharge-records?${toQuery(params)}` });
  },
  infoFeeDeductions() {
    return request({ url: '/carrier/wallet/info-fee-deductions' });
  },
  walletTransactions(params = {}) {
    return request({ url: `/carrier/wallet/transactions?${toQuery(params)}` });
  },
  orders(params = {}, options = {}) {
    const query = toQuery(params);
    return request({ url: `/orders${query ? `?${query}` : ''}`, ...options });
  },
  orderDetail(orderId) {
    return request({ url: `/orders/${orderId}` });
  },
  contract(orderId) {
    return request({ url: `/orders/${orderId}/contract` });
  },
  carrierConfirm(orderId) {
    return request({ url: `/orders/${orderId}/carrier-confirm`, method: 'POST' });
  },
  confirmContract(orderId) {
    return request({ url: `/orders/${orderId}/contract/confirm`, method: 'POST' });
  },
  setDrivers(orderId, data) {
    return request({ url: `/orders/${orderId}/drivers`, method: 'POST', data });
  },
  pickup(orderId, data) {
    return request({ url: `/orders/${orderId}/pickup`, method: 'POST', data });
  },
  reportTransitLocation(orderId, data) {
    return request({ url: `/orders/${orderId}/transit-locations`, method: 'POST', data });
  },
  handover(orderId, data) {
    return request({ url: `/orders/${orderId}/handover`, method: 'POST', data });
  },
  cancelOrder(orderId, cancelReason) {
    return request({
      url: `/orders/${orderId}/cancel-requests`,
      method: 'POST',
      data: { cancelReason },
    });
  },
  handleCancelRequest(orderId, cancelRequestId, handleResult, remark) {
    return request({
      url: `/orders/${orderId}/cancel-requests/${cancelRequestId}/handle`,
      method: 'POST',
      data: { handleResult, remark },
    });
  },
  withdrawCancelRequest(orderId, cancelRequestId) {
    return request({
      url: `/orders/${orderId}/cancel-requests/${cancelRequestId}/withdraw`,
      method: 'POST',
    });
  },
  cancelLogs(orderId) {
    return request({ url: `/orders/${orderId}/cancel-logs` });
  },
  negotiationHistory(orderId) {
    return request({ url: `/orders/${orderId}/negotiation-history` });
  },
  compensationClaims(orderId) {
    return request({ url: `/orders/${orderId}/compensation-claims` });
  },
  compensationClaim(claimId) {
    return request({ url: `/compensation-claims/${claimId}` });
  },
  handleCompensationClaim(claimId, data) {
    return request({ url: `/compensation-claims/${claimId}/handle`, method: 'POST', data });
  },
  getContactPhone(orderId) {
    return request({ url: `/orders/${orderId}/contact-phone`, method: 'POST' });
  },
  importDevTestFile(relativePath, fileType = 'IMAGE') {
    return request({
      url: '/dev/test-files/import',
      method: 'POST',
      data: { relativePath, fileType },
    });
  },
  notificationSettings() {
    return request({ url: '/account/notification-settings' });
  },
  updateNotificationSetting(data) {
    return request({ url: '/account/notification-settings', method: 'PUT', data });
  },
};

export function toQuery(params) {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

export function miniappLoginCode() {
  // #ifdef MP-WEIXIN
  return new Promise((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success(res) {
        if (res.code) {
          resolve(res.code);
          return;
        }
        reject(new Error('微信登录未返回 code'));
      },
      fail: reject,
    });
  });
  // #endif
  // #ifndef MP-WEIXIN
  return Promise.resolve('');
  // #endif
}

export function requestWechatPayment(paymentParams) {
  // #ifdef MP-WEIXIN
  return new Promise((resolve, reject) => {
    uni.requestPayment({
      provider: 'wxpay',
      timeStamp: paymentParams.timeStamp,
      nonceStr: paymentParams.nonceStr,
      package: paymentParams.package,
      signType: paymentParams.signType || 'MD5',
      paySign: paymentParams.paySign,
      success: resolve,
      fail: reject,
    });
  });
  // #endif
  // #ifndef MP-WEIXIN
  uni.showModal({
    title: '请在微信小程序中支付',
    content: 'H5 预览不能拉起微信小程序支付，请使用微信开发者工具或真机小程序完成支付。',
    showCancel: false,
  });
  return Promise.reject(new Error('当前环境不支持微信小程序支付'));
  // #endif
}
