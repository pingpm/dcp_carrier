"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      status: { reviewStatus: "UNVERIFIED" },
      reviewStatusText: common_vendor.reviewStatusText
    };
  },
  onShow() {
    if (common_vendor.requireLogin())
      this.load();
  },
  methods: {
    dateText: common_vendor.dateText,
    async load() {
      try {
        const res = await common_vendor.api.verificationStatus();
        this.status = res;
      } catch (error) {
        console.error(error);
      }
    },
    formatCompanyType(companyType, caps = []) {
      if (companyType === "CAR_CARRIER" || caps.includes("LARGE_TRUCK")) {
        return "轿运公司";
      }
      if (companyType === "ROADSIDE_RESCUE" || caps.includes("SMALL_TRUCK")) {
        return "道路救援公司";
      }
      return "";
    },
    goHome() {
      common_vendor.index.switchTab({ url: "/pages/home/index" });
    },
    goForm() {
      common_vendor.index.navigateTo({ url: "/pages/verification/form" });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.status.reviewStatus === "APPROVED"
  }, $data.status.reviewStatus === "APPROVED" ? {} : $data.status.reviewStatus === "PENDING" ? {} : $data.status.reviewStatus === "REJECTED" ? {} : {}, {
    b: $data.status.reviewStatus === "PENDING",
    c: $data.status.reviewStatus === "REJECTED",
    d: common_vendor.t($data.reviewStatusText[$data.status.reviewStatus] || "未认证"),
    e: $data.status.reviewStatus === "APPROVED"
  }, $data.status.reviewStatus === "APPROVED" ? {} : $data.status.reviewStatus === "PENDING" ? {} : $data.status.reviewStatus === "REJECTED" ? {} : {}, {
    f: $data.status.reviewStatus === "PENDING",
    g: $data.status.reviewStatus === "REJECTED",
    h: common_vendor.n($data.status.reviewStatus ? $data.status.reviewStatus.toLowerCase() : "unverified"),
    i: $data.status.rejectReason
  }, $data.status.rejectReason ? {
    j: common_vendor.t($data.status.rejectReason)
  } : {}, {
    k: common_vendor.t($data.status.companyName || "未填写"),
    l: common_vendor.t($options.formatCompanyType($data.status.companyType, $data.status.serviceCapabilities) || "未填写"),
    m: $data.status.submittedAt
  }, $data.status.submittedAt ? {
    n: common_vendor.t($options.dateText($data.status.submittedAt))
  } : {}, {
    o: $data.status.reviewedAt
  }, $data.status.reviewedAt ? {
    p: common_vendor.t($options.dateText($data.status.reviewedAt))
  } : {}, {
    q: common_vendor.o((...args) => $options.goHome && $options.goHome(...args), "dd"),
    r: $data.status.reviewStatus !== "PENDING"
  }, $data.status.reviewStatus !== "PENDING" ? {
    s: common_vendor.t($data.status.reviewStatus === "REJECTED" || $data.status.reviewStatus === "APPROVED" ? "重新提交资料" : "立即去认证"),
    t: common_vendor.o((...args) => $options.goForm && $options.goForm(...args), "36")
  } : {
    v: common_vendor.o((...args) => $options.load && $options.load(...args), "22")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
