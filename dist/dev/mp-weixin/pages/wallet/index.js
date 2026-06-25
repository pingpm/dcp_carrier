"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      wallet: {
        depositBalanceCent: 0,
        depositMinimumCent: 1e5,
        // Default 1000元
        isDepositCheckEnabled: true,
        isDepositBelowMinimum: false,
        infoFeeBalanceCent: 0,
        isInfoFeeCheckEnabled: true,
        isInfoFeeInsufficient: false
      }
    };
  },
  computed: {
    isDepositBelowMinimum() {
      return Boolean(this.wallet.isDepositBelowMinimum);
    },
    isInfoFeeInsufficient() {
      return Boolean(this.wallet.isInfoFeeInsufficient);
    },
    depositStatusLabel() {
      if (this.wallet.isDepositCheckEnabled === false)
        return "限制关闭";
      return this.isDepositBelowMinimum ? "余额不足" : "正常展示";
    },
    infoFeeStatusLabel() {
      if (this.wallet.isInfoFeeCheckEnabled === false)
        return "限制关闭";
      return this.isInfoFeeInsufficient ? "余额不足" : "正常接单";
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
        const res = await common_vendor.api.walletIndex({ silent: true, authRedirect: false });
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
    b: common_assets._imports_3,
    c: common_assets._imports_1,
    d: common_vendor.o(($event) => $options.goRecharge("DEPOSIT"), "5f")
  } : {}, {
    e: $options.isInfoFeeInsufficient
  }, $options.isInfoFeeInsufficient ? {
    f: common_assets._imports_3,
    g: common_assets._imports_1,
    h: common_vendor.o(($event) => $options.goRecharge("INFO_FEE"), "03")
  } : {}, {
    i: common_vendor.t($options.yuanVal($data.wallet.depositBalanceCent)),
    j: common_vendor.o(($event) => $options.goRecharge("DEPOSIT"), "22"),
    k: common_vendor.t($options.yuanText($data.wallet.depositMinimumCent)),
    l: common_vendor.t($options.depositStatusLabel),
    m: common_vendor.n($options.isDepositBelowMinimum ? "status-danger" : "status-success"),
    n: common_vendor.t($options.yuanVal($data.wallet.infoFeeBalanceCent)),
    o: common_vendor.o(($event) => $options.goRecharge("INFO_FEE"), "9e"),
    p: common_vendor.t($options.infoFeeStatusLabel),
    q: common_vendor.n($options.isInfoFeeInsufficient ? "status-danger" : "status-success"),
    r: common_assets._imports_2$2,
    s: common_assets._imports_1,
    t: common_vendor.o(($event) => $options.goLink("/pages/wallet/recharge-records"), "b7"),
    v: common_assets._imports_3$2,
    w: common_assets._imports_1,
    x: common_vendor.o(($event) => $options.goLink("/pages/wallet/info-fee-deductions"), "ae"),
    y: common_assets._imports_4$1,
    z: common_assets._imports_1,
    A: common_vendor.o(($event) => $options.goLink("/pages/wallet/transactions"), "da")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
