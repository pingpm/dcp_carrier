"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      deductions: []
    };
  },
  onShow() {
    if (common_vendor.requireLogin())
      this.load();
  },
  methods: {
    dateText: common_vendor.dateText,
    yuanText: common_vendor.yuanText,
    async load() {
      try {
        const res = await common_vendor.api.infoFeeDeductions();
        this.deductions = res.records || res.items || [];
      } catch (err) {
        console.error(err);
      }
    },
    goOrder(orderId) {
      if (orderId) {
        common_vendor.index.navigateTo({ url: `/pages/order/detail?orderId=${orderId}` });
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.deductions.length === 0
  }, $data.deductions.length === 0 ? {} : {
    b: common_vendor.f($data.deductions, (item, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t(item.relatedOrderId),
        b: common_vendor.t($options.yuanText(item.amountCent)),
        c: common_vendor.t($options.yuanText(item.beforeBalanceCent)),
        d: common_vendor.t($options.yuanText(item.afterBalanceCent)),
        e: common_vendor.t($options.dateText(item.createdAt)),
        f: item.remark
      }, item.remark ? {
        g: common_vendor.t(item.remark)
      } : {}, {
        h: item.id,
        i: common_vendor.o(($event) => $options.goOrder(item.relatedOrderId), item.id)
      });
    })
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
