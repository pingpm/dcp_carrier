"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      activeType: "",
      // '', DEPOSIT, INFO_FEE
      records: [],
      paymentStatusText: common_vendor.paymentStatusText,
      walletTypeText: common_vendor.walletTypeText
    };
  },
  onShow() {
    if (common_vendor.requireLogin())
      this.load();
  },
  methods: {
    dateText: common_vendor.dateText,
    yuanText: common_vendor.yuanText,
    statusClass: common_vendor.statusClass,
    async load() {
      try {
        const params = {};
        if (this.activeType)
          params.walletType = this.activeType;
        const res = await common_vendor.api.rechargeRecords(params);
        this.records = res.records || res.items || [];
      } catch (err) {
        console.error(err);
      }
    },
    switchType(type) {
      this.activeType = type;
      this.load();
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.activeType === "" ? 1 : "",
    b: common_vendor.o(($event) => $options.switchType(""), "54"),
    c: $data.activeType === "DEPOSIT" ? 1 : "",
    d: common_vendor.o(($event) => $options.switchType("DEPOSIT"), "8c"),
    e: $data.activeType === "INFO_FEE" ? 1 : "",
    f: common_vendor.o(($event) => $options.switchType("INFO_FEE"), "1b"),
    g: $data.records.length === 0
  }, $data.records.length === 0 ? {} : {
    h: common_vendor.f($data.records, (item, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t($data.walletTypeText[item.walletType]),
        b: common_vendor.n(item.walletType.toLowerCase()),
        c: common_vendor.t(item.merchantOrderNo),
        d: common_vendor.t($data.paymentStatusText[item.paymentStatus]),
        e: common_vendor.n($options.statusClass(item.paymentStatus)),
        f: common_vendor.t($options.dateText(item.createdAt)),
        g: common_vendor.t($options.yuanText(item.amountCent)),
        h: item.paidAt
      }, item.paidAt ? {
        i: common_vendor.t($options.dateText(item.paidAt))
      } : {}, {
        j: item.id
      });
    })
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
