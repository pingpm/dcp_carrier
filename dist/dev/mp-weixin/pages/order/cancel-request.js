"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      orderId: "",
      cancelReason: "",
      isDirect: false,
      submitting: false
    };
  },
  onLoad(options) {
    if (!common_vendor.requireLogin())
      return;
    this.orderId = options.orderId;
    if (options.direct === "1" || options.direct === 1) {
      this.isDirect = true;
    }
  },
  methods: {
    async submit() {
      if (!this.cancelReason.trim()) {
        common_vendor.index.showToast({ title: "请输入取消原因", icon: "none" });
        return;
      }
      this.submitting = true;
      try {
        await common_vendor.api.cancelOrder(this.orderId, this.cancelReason);
        common_vendor.index.showToast({
          title: this.isDirect ? "订单已拒绝取消" : "取消申请已提交",
          icon: "success"
        });
        setTimeout(() => {
          common_vendor.index.redirectTo({ url: `/pages/order/detail?orderId=${this.orderId}` });
        }, 800);
      } catch (err) {
        console.error(err);
      } finally {
        this.submitting = false;
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_assets._imports_3,
    b: $data.isDirect
  }, $data.isDirect ? {} : {}, {
    c: $data.cancelReason,
    d: common_vendor.o(($event) => $data.cancelReason = $event.detail.value, "01"),
    e: common_vendor.t($data.cancelReason.length),
    f: common_vendor.t($data.isDirect ? "拒绝接单并取消" : "发起取消协商申请"),
    g: $data.submitting,
    h: common_vendor.o((...args) => $options.submit && $options.submit(...args), "7d")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
