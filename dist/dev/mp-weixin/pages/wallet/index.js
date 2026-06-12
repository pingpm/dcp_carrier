"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      wallet: {
        depositBalanceCent: 0,
        depositMinimumCent: 1e5,
        // Default 1000元
        isDepositBelowMinimum: false,
        infoFeeBalanceCent: 0,
        isInfoFeeInsufficient: false
      }
    };
  },
  computed: {
    isDepositBelowMinimum() {
      return this.wallet.depositBalanceCent < this.wallet.depositMinimumCent;
    },
    isInfoFeeInsufficient() {
      return this.wallet.infoFeeBalanceCent <= 0;
    }
  },
  onShow() {
    if (common_vendor.requireLogin())
      this.load();
  },
  methods: {
    yuanText: common_vendor.yuanText,
    yuanVal(cent) {
      return (Number(cent || 0) / 100).toFixed(2);
    },
    async load() {
      try {
        const res = await common_vendor.api.walletIndex();
        this.wallet = res;
      } catch (err) {
      }
    },
    goRecharge(type) {
      common_vendor.index.navigateTo({ url: `/pages/wallet/recharge?type=${type}` });
    },
    goLink(url) {
      common_vendor.index.navigateTo({ url });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $options.isDepositBelowMinimum
  }, $options.isDepositBelowMinimum ? {
    b: common_vendor.o(($event) => $options.goRecharge("DEPOSIT"), "5f")
  } : {}, {
    c: $options.isInfoFeeInsufficient
  }, $options.isInfoFeeInsufficient ? {
    d: common_vendor.o(($event) => $options.goRecharge("INFO_FEE"), "15")
  } : {}, {
    e: common_vendor.t($options.yuanVal($data.wallet.depositBalanceCent)),
    f: common_vendor.o(($event) => $options.goRecharge("DEPOSIT"), "63"),
    g: common_vendor.t($options.yuanText($data.wallet.depositMinimumCent)),
    h: common_vendor.t($options.isDepositBelowMinimum ? "余额不足" : "正常展示"),
    i: common_vendor.n($options.isDepositBelowMinimum ? "status-danger" : "status-success"),
    j: common_vendor.t($options.yuanVal($data.wallet.infoFeeBalanceCent)),
    k: common_vendor.o(($event) => $options.goRecharge("INFO_FEE"), "60"),
    l: common_vendor.t($options.isInfoFeeInsufficient ? "余额不足" : "正常接单"),
    m: common_vendor.n($options.isInfoFeeInsufficient ? "status-danger" : "status-success"),
    n: common_vendor.o(($event) => $options.goLink("/pages/wallet/recharge-records"), "88"),
    o: common_vendor.o(($event) => $options.goLink("/pages/wallet/info-fee-deductions"), "13"),
    p: common_vendor.o(($event) => $options.goLink("/pages/wallet/transactions"), "80")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
