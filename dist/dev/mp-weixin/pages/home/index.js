"use strict";
const common_vendor = require("../../common/vendor.js");
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
    isDepositBelowMinimum() {
      return this.wallet.depositBalanceCent < this.wallet.depositMinimumCent;
    },
    isInfoFeeInsufficient() {
      return this.wallet.infoFeeBalanceCent <= 0;
    },
    hasWalletRisk() {
      return this.isDepositBelowMinimum || this.isInfoFeeInsufficient;
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
        const res = await common_vendor.api.dashboard();
        this.dashboard = res;
        this.showVerificationPromptIfNeeded(res.reviewStatus);
      } catch (error) {
        console.error(error);
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
            common_vendor.index.navigateTo({ url: "/pages/verification/status" });
          }
        }
      });
    },
    goVerification() {
      if (!this.isLoggedIn) {
        this.goLogin();
        return;
      }
      common_vendor.index.navigateTo({ url: "/pages/verification/status" });
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
    b: common_vendor.o((...args) => $options.goLogin && $options.goLogin(...args), "63")
  } : $data.dashboard.reviewStatus !== "APPROVED" ? {
    d: common_vendor.o((...args) => $options.goVerification && $options.goVerification(...args), "85")
  } : {}, {
    c: $data.dashboard.reviewStatus !== "APPROVED",
    e: $data.isLoggedIn && $options.hasWalletRisk
  }, $data.isLoggedIn && $options.hasWalletRisk ? {
    f: common_vendor.t($options.walletRiskText),
    g: common_vendor.o((...args) => $options.goWallet && $options.goWallet(...args), "1b")
  } : {}, {
    h: common_vendor.t($options.todoCounts.pendingConfirm || 0),
    i: $options.todoCounts.pendingConfirm > 0 ? 1 : "",
    j: common_vendor.o(($event) => $options.goOrders("PENDING_CONFIRM"), "c8"),
    k: common_vendor.t($options.todoCounts.pendingContract || 0),
    l: $options.todoCounts.pendingContract > 0 ? 1 : "",
    m: common_vendor.o(($event) => $options.goOrders("PENDING_CONTRACT"), "19"),
    n: common_vendor.t($options.todoCounts.pendingPickup || 0),
    o: $options.todoCounts.pendingPickup > 0 ? 1 : "",
    p: common_vendor.o(($event) => $options.goOrders("PENDING_PICKUP"), "56"),
    q: common_vendor.t($options.todoCounts.inTransit || 0),
    r: common_vendor.o(($event) => $options.goOrders("IN_TRANSIT"), "16"),
    s: common_vendor.t($options.todoCounts.cancelPending || 0),
    t: $options.todoCounts.cancelPending > 0 ? 1 : "",
    v: common_vendor.o(($event) => $options.goOrders("CANCEL_PENDING"), "42"),
    w: common_vendor.t($options.yuanText($options.wallet.depositBalanceCent)),
    x: $options.isDepositBelowMinimum ? 1 : "",
    y: common_vendor.t($options.yuanText($options.wallet.depositMinimumCent)),
    z: common_vendor.t($options.yuanText($options.wallet.infoFeeBalanceCent)),
    A: $options.isInfoFeeInsufficient ? 1 : "",
    B: common_vendor.t($options.isInfoFeeInsufficient ? "不足" : "充足"),
    C: common_vendor.o((...args) => $options.goWallet && $options.goWallet(...args), "66"),
    D: common_vendor.t($options.routeCounts.largeTruck || 0),
    E: common_vendor.t($options.routeCounts.smallTruck || 0),
    F: common_vendor.o((...args) => $options.goRoutes && $options.goRoutes(...args), "4e")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
