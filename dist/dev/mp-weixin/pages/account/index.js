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
      profile: {
        companyName: ""
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
    displayName() {
      return this.profile.companyName || this.userInfo.nickname || "承运商用户";
    },
    reviewStatusLabel() {
      const map = {
        APPROVED: "已认证",
        PENDING: "审核中",
        REJECTED: "未通过"
      };
      return map[this.reviewStatus] || "未认证";
    },
    isVerificationApproved() {
      return this.reviewStatus === "APPROVED";
    },
    isDepositLow() {
      return this.isVerificationApproved && Boolean(this.walletData.isDepositBelowMinimum);
    },
    isInfoFeeLow() {
      return this.isVerificationApproved && Boolean(this.walletData.isInfoFeeInsufficient);
    },
    hasWalletRisk() {
      return this.isDepositLow || this.isInfoFeeLow;
    },
    walletWarnText() {
      if (this.isDepositLow && this.isInfoFeeLow)
        return "保证金不足 · 信息费耗尽";
      if (this.isDepositLow)
        return "保证金低于最低要求";
      if (this.isInfoFeeLow)
        return "信息费余额不足";
      if (this.walletData.isDepositCheckEnabled === false || this.walletData.isInfoFeeCheckEnabled === false) {
        return "搜索联系限制已关闭";
      }
      return "";
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
      this.profile = {
        companyName: ""
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
          this.profile = res.profile || {};
          this.reviewStatus = res.reviewStatus || "UNVERIFIED";
          if (!this.profile.companyName) {
            const status = await common_vendor.api.verificationStatus({ authRedirect: false });
            this.profile = {
              ...this.profile,
              companyName: (status == null ? void 0 : status.companyName) || ""
            };
            this.reviewStatus = (status == null ? void 0 : status.reviewStatus) || this.reviewStatus;
          }
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
      const url = this.reviewStatus === "UNVERIFIED" || this.reviewStatus === "REJECTED" ? "/pages/verification/form" : "/pages/verification/status";
      common_vendor.index.navigateTo({ url });
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
    b: common_assets._imports_0,
    c: common_vendor.o((...args) => $options.goLogin && $options.goLogin(...args), "c6"),
    d: common_vendor.o((...args) => $options.goLogin && $options.goLogin(...args), "8a")
  } : {
    e: $data.userInfo.avatarUrl || "/static/icons/user.svg",
    f: common_vendor.t($options.displayName),
    g: common_vendor.t($options.reviewStatusLabel),
    h: common_vendor.n($data.reviewStatus.toLowerCase()),
    i: common_vendor.t($data.userInfo.registeredPhone || "未绑定手机"),
    j: common_assets._imports_1,
    k: common_vendor.o((...args) => $options.goVerification && $options.goVerification(...args), "10")
  }, {
    l: common_assets._imports_2$2,
    m: common_assets._imports_1,
    n: common_vendor.t($options.yuanVal($data.walletData.depositBalanceCent)),
    o: $data.isLoggedIn && $options.isDepositLow ? 1 : "",
    p: common_vendor.t($options.yuanVal($data.walletData.infoFeeBalanceCent)),
    q: $data.isLoggedIn && $options.isInfoFeeLow ? 1 : "",
    r: $data.isLoggedIn && $options.hasWalletRisk
  }, $data.isLoggedIn && $options.hasWalletRisk ? {
    s: common_assets._imports_3,
    t: common_vendor.t($options.walletWarnText)
  } : {}, {
    v: common_vendor.o((...args) => $options.goWallet && $options.goWallet(...args), "12"),
    w: $data.isLoggedIn && $data.reviewStatus !== "APPROVED"
  }, $data.isLoggedIn && $data.reviewStatus !== "APPROVED" ? {
    x: common_assets._imports_3,
    y: common_assets._imports_1,
    z: common_vendor.o((...args) => $options.goVerification && $options.goVerification(...args), "6b")
  } : {}, {
    A: common_assets._imports_4,
    B: $data.routeCount > 0
  }, $data.routeCount > 0 ? {
    C: common_vendor.t($data.routeCount)
  } : {}, {
    D: common_assets._imports_1,
    E: common_vendor.o((...args) => $options.goRoutes && $options.goRoutes(...args), "ac"),
    F: common_assets._imports_2$2,
    G: common_assets._imports_1,
    H: common_vendor.o((...args) => $options.goWallet && $options.goWallet(...args), "e0"),
    I: common_assets._imports_5,
    J: common_vendor.t($data.reviewStatusText[$data.reviewStatus] || "未认证"),
    K: $data.reviewStatus === "APPROVED" ? 1 : "",
    L: $data.reviewStatus === "PENDING" ? 1 : "",
    M: $data.reviewStatus === "REJECTED" ? 1 : "",
    N: common_assets._imports_1,
    O: common_vendor.o((...args) => $options.goVerification && $options.goVerification(...args), "c2"),
    P: common_assets._imports_6,
    Q: common_assets._imports_1,
    R: common_vendor.o((...args) => $options.goCompanyProfile && $options.goCompanyProfile(...args), "f5"),
    S: common_assets._imports_7,
    T: common_assets._imports_1,
    U: common_vendor.o((...args) => $options.goSettings && $options.goSettings(...args), "bb")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
