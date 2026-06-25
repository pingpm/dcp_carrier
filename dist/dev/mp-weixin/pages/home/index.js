"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      isLoggedIn: false,
      dashboard: {
        reviewStatus: "UNVERIFIED",
        orderTodoCounts: {
          pendingConfirm: 0,
          pendingContract: 0,
          pendingPickup: 0,
          inTransit: 0,
          cancelPending: 0
        },
        wallet: {
          depositBalanceCent: 0,
          depositMinimumCent: 0,
          isDepositBelowMinimum: false,
          infoFeeBalanceCent: 0,
          isInfoFeeInsufficient: false
        },
        routeCounts: {
          largeTruck: 0,
          smallTruck: 0
        }
      },
      reviewStatusText: common_vendor.reviewStatusText
    };
  },
  computed: {
    todoCounts() {
      return this.dashboard.orderTodoCounts || {};
    },
    wallet() {
      return this.dashboard.wallet || {};
    },
    routeCounts() {
      return this.dashboard.routeCounts || {};
    },
    isVerificationApproved() {
      return this.dashboard.reviewStatus === "APPROVED";
    },
    isDepositBelowMinimum() {
      return this.isVerificationApproved && Boolean(this.wallet.isDepositBelowMinimum);
    },
    isInfoFeeInsufficient() {
      return this.isVerificationApproved && Boolean(this.wallet.isInfoFeeInsufficient);
    },
    hasWalletRisk() {
      return this.isDepositBelowMinimum || this.isInfoFeeInsufficient;
    },
    depositStatusText() {
      if (!this.isVerificationApproved) {
        return "认证通过后校验保证金标准";
      }
      if (this.wallet.isDepositCheckEnabled === false) {
        return "当前状态: 搜索联系限制已关闭";
      }
      return `最低标准: ${this.yuanText(this.wallet.depositMinimumCent)}`;
    },
    infoFeeStatusText() {
      if (!this.isVerificationApproved) {
        return "当前状态: 认证通过后校验";
      }
      if (this.wallet.isInfoFeeCheckEnabled === false) {
        return "当前状态: 搜索联系限制已关闭";
      }
      return `当前状态: ${this.isInfoFeeInsufficient ? "不足" : "充足"}`;
    },
    walletRiskText() {
      if (this.isDepositBelowMinimum && this.isInfoFeeInsufficient) {
        return "保证金及信息费不足，线路已隐藏且无法接单";
      }
      if (this.isDepositBelowMinimum) {
        return "保证金低于最低额度，运输线路已隐藏";
      }
      if (this.isInfoFeeInsufficient) {
        return "信息服务费不足，您将无法确认接单";
      }
      return "";
    }
  },
  onShow() {
    this.isLoggedIn = !!common_vendor.getToken();
    if (this.isLoggedIn) {
      this.loadData();
    } else {
      this.resetData();
    }
  },
  methods: {
    yuanText: common_vendor.yuanText,
    resetData() {
      this.dashboard = {
        reviewStatus: "UNVERIFIED",
        orderTodoCounts: {
          pendingConfirm: 0,
          pendingContract: 0,
          pendingPickup: 0,
          inTransit: 0,
          cancelPending: 0
        },
        wallet: {
          depositBalanceCent: 0,
          depositMinimumCent: 0,
          isDepositBelowMinimum: false,
          infoFeeBalanceCent: 0,
          isInfoFeeInsufficient: false
        },
        routeCounts: {
          largeTruck: 0,
          smallTruck: 0
        }
      };
    },
    async loadData() {
      try {
        const res = await common_vendor.api.dashboard({ silent: true, authRedirect: false });
        this.dashboard = res;
        this.showVerificationPromptIfNeeded(res.reviewStatus);
      } catch (error) {
        this.resetData();
      }
    },
    showVerificationPromptIfNeeded(reviewStatus) {
      const shouldPrompt = common_vendor.index.getStorageSync("carrier_need_verification_prompt") === "1";
      if (!shouldPrompt || reviewStatus === "APPROVED") {
        return;
      }
      common_vendor.index.removeStorageSync("carrier_need_verification_prompt");
      common_vendor.index.showModal({
        title: "还未完成认证",
        content: "完成承运商认证后，您维护的线路才可对外展示，并可确认接单。",
        confirmText: "立即认证",
        cancelText: "稍后认证",
        success: (res) => {
          if (res.confirm) {
            if (typeof common_vendor.index.hideModal === "function") {
              common_vendor.index.hideModal();
            }
            this.goVerification();
          }
        }
      });
    },
    goVerification() {
      if (!this.isLoggedIn) {
        this.goLogin();
        return;
      }
      const url = this.dashboard.reviewStatus === "PENDING" ? "/pages/verification/status" : "/pages/verification/form";
      common_vendor.index.navigateTo({ url });
    },
    goOrders(status) {
      if (!this.isLoggedIn) {
        this.goLogin();
        return;
      }
      common_vendor.index.setStorageSync("order_list_filter_status", status);
      common_vendor.index.switchTab({ url: "/pages/order/list" });
    },
    goWallet() {
      if (!this.isLoggedIn) {
        this.goLogin();
        return;
      }
      common_vendor.index.navigateTo({ url: "/pages/wallet/index" });
    },
    goRoutes() {
      if (!this.isLoggedIn) {
        this.goLogin();
        return;
      }
      common_vendor.index.navigateTo({ url: "/pages/route/list" });
    },
    goLogin() {
      common_vendor.index.navigateTo({ url: "/pages/auth/login" });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: !$data.isLoggedIn
  }, !$data.isLoggedIn ? {
    b: common_assets._imports_0,
    c: common_assets._imports_1,
    d: common_vendor.o((...args) => $options.goLogin && $options.goLogin(...args), "63")
  } : $data.dashboard.reviewStatus !== "APPROVED" ? {
    f: common_assets._imports_3,
    g: common_assets._imports_1,
    h: common_vendor.o((...args) => $options.goVerification && $options.goVerification(...args), "06")
  } : {}, {
    e: $data.dashboard.reviewStatus !== "APPROVED",
    i: $data.isLoggedIn && $options.hasWalletRisk
  }, $data.isLoggedIn && $options.hasWalletRisk ? {
    j: common_assets._imports_3,
    k: common_vendor.t($options.walletRiskText),
    l: common_assets._imports_1,
    m: common_vendor.o((...args) => $options.goWallet && $options.goWallet(...args), "43")
  } : {}, {
    n: common_vendor.t($options.todoCounts.pendingConfirm || 0),
    o: $options.todoCounts.pendingConfirm > 0 ? 1 : "",
    p: common_vendor.o(($event) => $options.goOrders("PENDING_CONFIRM"), "57"),
    q: common_vendor.t($options.todoCounts.pendingContract || 0),
    r: $options.todoCounts.pendingContract > 0 ? 1 : "",
    s: common_vendor.o(($event) => $options.goOrders("PENDING_CONTRACT"), "40"),
    t: common_vendor.t($options.todoCounts.pendingPickup || 0),
    v: $options.todoCounts.pendingPickup > 0 ? 1 : "",
    w: common_vendor.o(($event) => $options.goOrders("PENDING_PICKUP"), "55"),
    x: common_vendor.t($options.todoCounts.inTransit || 0),
    y: common_vendor.o(($event) => $options.goOrders("IN_TRANSIT"), "75"),
    z: common_vendor.t($options.todoCounts.cancelPending || 0),
    A: $options.todoCounts.cancelPending > 0 ? 1 : "",
    B: common_vendor.o(($event) => $options.goOrders("CANCEL_PENDING"), "48"),
    C: common_assets._imports_1,
    D: common_vendor.t($options.yuanText($options.wallet.depositBalanceCent)),
    E: $options.isDepositBelowMinimum ? 1 : "",
    F: common_vendor.t($options.depositStatusText),
    G: common_vendor.t($options.yuanText($options.wallet.infoFeeBalanceCent)),
    H: $options.isInfoFeeInsufficient ? 1 : "",
    I: common_vendor.t($options.infoFeeStatusText),
    J: common_vendor.o((...args) => $options.goWallet && $options.goWallet(...args), "b0"),
    K: common_assets._imports_1,
    L: common_vendor.t($options.routeCounts.largeTruck || 0),
    M: common_vendor.t($options.routeCounts.smallTruck || 0),
    N: common_vendor.o((...args) => $options.goRoutes && $options.goRoutes(...args), "ee")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
