"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      isLoggedIn: false,
      userInfo: {
        nickname: "",
        registeredPhone: "",
        avatarUrl: ""
      },
      reviewStatus: "UNVERIFIED",
      reviewStatusText: common_vendor.reviewStatusText,
      walletData: {
        depositBalanceCent: 0,
        depositMinimumCent: 1e5,
        infoFeeBalanceCent: 0
      },
      routeCount: 0
    };
  },
  computed: {
    reviewStatusLabel() {
      const map = {
        APPROVED: "已认证",
        PENDING: "审核中",
        REJECTED: "未通过"
      };
      return map[this.reviewStatus] || "未认证";
    },
    isDepositLow() {
      return this.walletData.depositBalanceCent < this.walletData.depositMinimumCent;
    },
    isInfoFeeLow() {
      return this.walletData.infoFeeBalanceCent <= 0;
    },
    walletWarnText() {
      if (this.isDepositLow && this.isInfoFeeLow)
        return "保证金不足 · 信息费耗尽";
      if (this.isDepositLow)
        return "保证金低于最低要求";
      return "信息费余额不足";
    }
  },
  onShow() {
    this.isLoggedIn = !!common_vendor.getToken();
    if (this.isLoggedIn) {
      this.fetchMe();
      this.fetchWallet();
    } else {
      this.resetData();
    }
  },
  methods: {
    yuanVal(cent) {
      return (Number(cent || 0) / 100).toFixed(2);
    },
    resetData() {
      this.userInfo = {
        nickname: "",
        registeredPhone: "",
        avatarUrl: ""
      };
      this.reviewStatus = "UNVERIFIED";
      this.walletData = {
        depositBalanceCent: 0,
        depositMinimumCent: 1e5,
        infoFeeBalanceCent: 0
      };
      this.routeCount = 0;
    },
    ensureLoggedIn(actionText) {
      if (!this.isLoggedIn) {
        common_vendor.index.showModal({
          title: "请先登录",
          content: `您当前尚未登录，登录后才可使用${actionText}功能。`,
          confirmText: "去登录",
          cancelText: "暂不登录",
          confirmColor: "#1677ff",
          success: (res) => {
            if (res.confirm) {
              this.goLogin();
            }
          }
        });
        return false;
      }
      return true;
    },
    async fetchMe() {
      try {
        const res = await common_vendor.api.me();
        if (res) {
          this.userInfo = res.user || {};
          this.reviewStatus = res.reviewStatus || "UNVERIFIED";
        }
      } catch (error) {
        console.error("获取个人信息失败:", error);
      }
    },
    async fetchWallet() {
      try {
        const res = await common_vendor.api.dashboard();
        if (res && res.wallet) {
          this.walletData = res.wallet;
        }
        if (res && res.routeCounts) {
          this.routeCount = (res.routeCounts.largeTruck || 0) + (res.routeCounts.smallTruck || 0);
        }
      } catch (error) {
        console.error("获取钱包信息失败:", error);
      }
    },
    goVerification() {
      if (!this.ensureLoggedIn("企业资质认证"))
        return;
      common_vendor.index.navigateTo({ url: "/pages/verification/status" });
    },
    goCompanyProfile() {
      if (!this.ensureLoggedIn("企业介绍"))
        return;
      common_vendor.index.navigateTo({ url: "/pages/profile/company" });
    },
    goWallet() {
      if (!this.ensureLoggedIn("资金充值与钱包"))
        return;
      common_vendor.index.navigateTo({ url: "/pages/wallet/index" });
    },
    goRoutes() {
      if (!this.ensureLoggedIn("线路管理"))
        return;
      common_vendor.index.navigateTo({ url: "/pages/route/list" });
    },
    goSettings() {
      if (!this.ensureLoggedIn("系统设置"))
        return;
      common_vendor.index.navigateTo({ url: "/pages/account/settings" });
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
    b: common_assets._imports_0$1,
    c: common_vendor.o((...args) => $options.goLogin && $options.goLogin(...args), "83"),
    d: common_vendor.o((...args) => $options.goLogin && $options.goLogin(...args), "8a")
  } : {
    e: $data.userInfo.avatarUrl || "/static/default_avatar.png",
    f: common_vendor.t($data.userInfo.nickname || "承运商用户"),
    g: common_vendor.t($options.reviewStatusLabel),
    h: common_vendor.n($data.reviewStatus.toLowerCase()),
    i: common_vendor.t($data.userInfo.registeredPhone || "未绑定手机"),
    j: common_vendor.o((...args) => $options.goVerification && $options.goVerification(...args), "62")
  }, {
    k: common_vendor.t($options.yuanVal($data.walletData.depositBalanceCent)),
    l: $data.isLoggedIn && $options.isDepositLow ? 1 : "",
    m: common_vendor.t($options.yuanVal($data.walletData.infoFeeBalanceCent)),
    n: $data.isLoggedIn && $options.isInfoFeeLow ? 1 : "",
    o: $data.isLoggedIn && ($options.isDepositLow || $options.isInfoFeeLow)
  }, $data.isLoggedIn && ($options.isDepositLow || $options.isInfoFeeLow) ? {
    p: common_vendor.t($options.walletWarnText)
  } : {}, {
    q: common_vendor.o((...args) => $options.goWallet && $options.goWallet(...args), "0c"),
    r: $data.isLoggedIn && $data.reviewStatus !== "APPROVED"
  }, $data.isLoggedIn && $data.reviewStatus !== "APPROVED" ? {
    s: common_vendor.o((...args) => $options.goVerification && $options.goVerification(...args), "d3")
  } : {}, {
    t: $data.routeCount > 0
  }, $data.routeCount > 0 ? {
    v: common_vendor.t($data.routeCount)
  } : {}, {
    w: common_vendor.o((...args) => $options.goRoutes && $options.goRoutes(...args), "d1"),
    x: common_vendor.o((...args) => $options.goWallet && $options.goWallet(...args), "e8"),
    y: common_vendor.t($data.reviewStatusText[$data.reviewStatus] || "未认证"),
    z: $data.reviewStatus === "APPROVED" ? 1 : "",
    A: $data.reviewStatus === "PENDING" ? 1 : "",
    B: $data.reviewStatus === "REJECTED" ? 1 : "",
    C: common_vendor.o((...args) => $options.goVerification && $options.goVerification(...args), "15"),
    D: common_vendor.o((...args) => $options.goCompanyProfile && $options.goCompanyProfile(...args), "1e"),
    E: common_vendor.o((...args) => $options.goSettings && $options.goSettings(...args), "44")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
