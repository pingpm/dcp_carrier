"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      orderId: "",
      contract: {},
      submitting: false
    };
  },
  computed: {
    confirmDeadlineAt() {
      return this.contract.confirmDeadlineAt || this.contract.contractConfirmDeadlineAt || "";
    },
    contractExpired() {
      if (!this.confirmDeadlineAt)
        return false;
      const deadline = new Date(this.confirmDeadlineAt);
      return !Number.isNaN(deadline.getTime()) && deadline.getTime() <= Date.now();
    },
    deadlineText() {
      return this.confirmDeadlineAt ? this.dateText(this.confirmDeadlineAt) : "未设置";
    }
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
    dateText(val) {
      if (!val)
        return "";
      const date = new Date(val);
      if (Number.isNaN(date.getTime()))
        return "";
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    },
    back() {
      common_vendor.index.redirectTo({ url: `/pages/order/detail?orderId=${this.orderId}` });
    },
    async confirm() {
      if (this.contractExpired) {
        common_vendor.index.showToast({ title: "合同签署已超时", icon: "none" });
        return;
      }
      this.submitting = true;
      try {
        const result = await common_vendor.api.confirmContract(this.orderId);
        if ((result == null ? void 0 : result.expired) || (result == null ? void 0 : result.orderStatus) === "CANCELED") {
          common_vendor.index.showToast({ title: "合同签署已超时，订单已取消", icon: "none" });
          setTimeout(
            () => common_vendor.index.redirectTo({ url: `/pages/order/detail?orderId=${this.orderId}` }),
            800
          );
          return;
        }
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
    a: common_assets._imports_0$3,
    b: common_vendor.t($data.contract.contractNo || "-"),
    c: common_vendor.t($data.contract.contractContent || "合同内容加载中..."),
    d: $data.contract.dealerConfirmedAt
  }, $data.contract.dealerConfirmedAt ? {
    e: common_vendor.t($options.dateTextDateOnly($data.contract.dealerConfirmedAt))
  } : {}, {
    f: $data.contract.carrierConfirmedAt
  }, $data.contract.carrierConfirmedAt ? {
    g: common_vendor.t($options.dateTextDateOnly($data.contract.carrierConfirmedAt))
  } : {}, {
    h: common_vendor.t($data.contract.dealerConfirmedAt ? "已签署确认" : "等待车商签署"),
    i: common_vendor.n($data.contract.dealerConfirmedAt ? "status-success" : "status-warning"),
    j: common_vendor.t($data.contract.carrierConfirmedAt ? "已签署确认" : "待您签署"),
    k: common_vendor.n($data.contract.carrierConfirmedAt ? "status-success" : "status-warning"),
    l: common_vendor.t($options.deadlineText),
    m: $options.contractExpired ? 1 : "",
    n: $options.contractExpired && !$data.contract.carrierConfirmedAt
  }, $options.contractExpired && !$data.contract.carrierConfirmedAt ? {} : {}, {
    o: !$data.contract.carrierConfirmedAt
  }, !$data.contract.carrierConfirmedAt ? {
    p: common_vendor.t($options.contractExpired ? "签署已超时" : "确认合同并签章"),
    q: $data.submitting,
    r: $options.contractExpired,
    s: common_vendor.o((...args) => $options.confirm && $options.confirm(...args), "73")
  } : {
    t: common_vendor.o((...args) => $options.back && $options.back(...args), "25")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
