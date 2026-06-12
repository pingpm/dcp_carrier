"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      presets: [100, 500, 1e3, 2e3, 5e3],
      amountYuan: "1000",
      form: {
        walletType: "DEPOSIT",
        // DEPOSIT, INFO_FEE
        amountCent: 0
      },
      submitting: false
    };
  },
  onLoad(options) {
    if (!common_vendor.requireLogin())
      return;
    if (options.type) {
      this.form.walletType = options.type;
    }
  },
  methods: {
    setWalletType(type) {
      this.form.walletType = type;
    },
    selectPreset(amt) {
      this.amountYuan = String(amt);
    },
    validate() {
      const cent = common_vendor.yuanToCent(this.amountYuan);
      if (!cent || cent <= 0) {
        common_vendor.index.showToast({ title: "请输入有效的充值金额", icon: "none" });
        return false;
      }
      this.form.amountCent = cent;
      return true;
    },
    async submit() {
      if (!this.validate())
        return;
      this.submitting = true;
      try {
        const res = await common_vendor.api.recharge(this.form);
        const paymentId = res.paymentId;
        common_vendor.index.showLoading({ title: "发起微信模拟支付..." });
        await common_vendor.api.simulatePaymentSuccess(paymentId);
        common_vendor.index.hideLoading();
        common_vendor.index.showModal({
          title: "支付充值成功",
          content: `已成功向您的【${this.form.walletType === "DEPOSIT" ? "保证金" : "信息服务费"}】账户充值 ${this.amountYuan} 元。`,
          showCancel: false,
          success: () => {
            common_vendor.index.navigateBack();
          }
        });
      } catch (err) {
        common_vendor.index.hideLoading();
        console.error(err);
      } finally {
        this.submitting = false;
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.t($data.form.walletType === "DEPOSIT" ? "●" : ""),
    b: $data.form.walletType === "DEPOSIT" ? 1 : "",
    c: common_vendor.o(($event) => $options.setWalletType("DEPOSIT"), "51"),
    d: common_vendor.t($data.form.walletType === "INFO_FEE" ? "●" : ""),
    e: $data.form.walletType === "INFO_FEE" ? 1 : "",
    f: common_vendor.o(($event) => $options.setWalletType("INFO_FEE"), "7c"),
    g: common_vendor.f($data.presets, (amt, k0, i0) => {
      return {
        a: common_vendor.t(amt),
        b: amt,
        c: $data.amountYuan === String(amt) ? 1 : "",
        d: common_vendor.o(($event) => $options.selectPreset(amt), amt)
      };
    }),
    h: $data.amountYuan,
    i: common_vendor.o(($event) => $data.amountYuan = $event.detail.value, "f3"),
    j: $data.submitting,
    k: common_vendor.o((...args) => $options.submit && $options.submit(...args), "4c")
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
