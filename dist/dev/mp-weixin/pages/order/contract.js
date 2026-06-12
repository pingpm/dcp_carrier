"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      orderId: "",
      contract: {},
      submitting: false
    };
  },
  onLoad(options) {
    if (!common_vendor.requireLogin())
      return;
    this.orderId = options.orderId;
    this.load();
  },
  methods: {
    async load() {
      try {
        this.contract = await common_vendor.api.contract(this.orderId);
      } catch (err) {
        console.error(err);
      }
    },
    dateTextDateOnly(val) {
      if (!val)
        return "";
      const date = new Date(val);
      if (Number.isNaN(date.getTime()))
        return "";
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    },
    back() {
      common_vendor.index.redirectTo({ url: `/pages/order/detail?orderId=${this.orderId}` });
    },
    async confirm() {
      this.submitting = true;
      try {
        await common_vendor.api.confirmContract(this.orderId);
        common_vendor.index.showToast({ title: "签署合同成功", icon: "success" });
        setTimeout(
          () => common_vendor.index.redirectTo({ url: `/pages/order/detail?orderId=${this.orderId}` }),
          500
        );
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
    a: common_vendor.t($data.contract.contractNo || "-"),
    b: common_vendor.t($data.contract.contractContent || "合同内容加载中..."),
    c: $data.contract.dealerConfirmedAt
  }, $data.contract.dealerConfirmedAt ? {
    d: common_vendor.t($options.dateTextDateOnly($data.contract.dealerConfirmedAt))
  } : {}, {
    e: $data.contract.carrierConfirmedAt
  }, $data.contract.carrierConfirmedAt ? {
    f: common_vendor.t($options.dateTextDateOnly($data.contract.carrierConfirmedAt))
  } : {}, {
    g: common_vendor.t($data.contract.dealerConfirmedAt ? "已签署确认" : "等待车商签署"),
    h: common_vendor.n($data.contract.dealerConfirmedAt ? "status-success" : "status-warning"),
    i: common_vendor.t($data.contract.carrierConfirmedAt ? "已签署确认" : "待您签署"),
    j: common_vendor.n($data.contract.carrierConfirmedAt ? "status-success" : "status-warning"),
    k: !$data.contract.carrierConfirmedAt
  }, !$data.contract.carrierConfirmedAt ? {
    l: $data.submitting,
    m: common_vendor.o((...args) => $options.confirm && $options.confirm(...args), "f8")
  } : {
    n: common_vendor.o((...args) => $options.back && $options.back(...args), "51")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
