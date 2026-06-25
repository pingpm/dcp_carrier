"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      filterWalletType: "",
      // '', DEPOSIT, INFO_FEE
      transactions: [],
      walletTransactionTypeText: common_vendor.walletTransactionTypeText,
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
    async load() {
      try {
        const params = {};
        if (this.filterWalletType)
          params.walletType = this.filterWalletType;
        const res = await common_vendor.api.walletTransactions(params);
        this.transactions = res.records || res.items || [];
      } catch (err) {
        console.error(err);
      }
    },
    switchWalletType(type) {
      this.filterWalletType = type;
      this.load();
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
    a: $data.filterWalletType === "" ? 1 : "",
    b: common_vendor.o(($event) => $options.switchWalletType(""), "90"),
    c: $data.filterWalletType === "DEPOSIT" ? 1 : "",
    d: common_vendor.o(($event) => $options.switchWalletType("DEPOSIT"), "4f"),
    e: $data.filterWalletType === "INFO_FEE" ? 1 : "",
    f: common_vendor.o(($event) => $options.switchWalletType("INFO_FEE"), "67"),
    g: $data.transactions.length === 0
  }, $data.transactions.length === 0 ? {} : {
    h: common_vendor.f($data.transactions, (item, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t($data.walletTypeText[item.walletType]),
        b: common_vendor.n(item.walletType.toLowerCase()),
        c: common_vendor.t($data.walletTransactionTypeText[item.changeType] || item.changeType),
        d: common_vendor.t(item.amountCent < 0 ? "-" : "+"),
        e: common_vendor.t($options.yuanText(Math.abs(item.amountCent))),
        f: common_vendor.n(item.amountCent < 0 || item.changeType === "ORDER_INFO_FEE_DEDUCT" || item.changeType === "ADMIN_DECREASE" ? "decrease" : "increase"),
        g: common_vendor.t(item.transactionNo),
        h: item.relatedOrderId
      }, item.relatedOrderId ? {
        i: common_vendor.t(item.relatedOrderId),
        j: common_vendor.o(($event) => $options.goOrder(item.relatedOrderId), item.id)
      } : {}, {
        k: common_vendor.t($options.yuanText(item.beforeBalanceCent)),
        l: common_vendor.t($options.yuanText(item.afterBalanceCent)),
        m: common_vendor.t($options.dateText(item.createdAt)),
        n: item.remark
      }, item.remark ? {
        o: common_vendor.t(item.remark)
      } : {}, {
        p: item.id
      });
    })
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
