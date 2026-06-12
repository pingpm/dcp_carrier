"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      orderId: "",
      activeRequest: null,
      remark: "",
      submitting: false
    };
  },
  onLoad(options) {
    if (!common_vendor.requireLogin())
      return;
    this.orderId = options.orderId;
    this.loadRequest();
  },
  methods: {
    dateText: common_vendor.dateText,
    async loadRequest() {
      try {
        const res = await common_vendor.api.cancelLogs(this.orderId);
        const logs = res.items || [];
        const requestLog = [...logs].reverse().find((l) => l.actionType === "REQUEST");
        if (requestLog) {
          this.activeRequest = requestLog;
        } else {
          common_vendor.index.showToast({ title: "未找到待处理的取消申请", icon: "none" });
          setTimeout(() => common_vendor.index.navigateBack(), 1e3);
        }
      } catch (err) {
        console.error(err);
      }
    },
    async handle(result) {
      if (result === "REJECTED" && !this.remark.trim()) {
        common_vendor.index.showToast({ title: "拒绝取消时，请填写处理意见", icon: "none" });
        return;
      }
      const confirmMsg = result === "APPROVED" ? "确认同意取消订单吗？同意后订单将被关闭并结算。" : "确认拒绝取消订单吗？拒绝后订单将恢复正常承运履约。";
      common_vendor.index.showModal({
        title: "操作确认",
        content: confirmMsg,
        confirmColor: result === "APPROVED" ? "#1677ff" : "#dc2626",
        success: async (mRes) => {
          if (mRes.confirm) {
            this.submitting = true;
            try {
              await common_vendor.api.handleCancelRequest(
                this.orderId,
                this.activeRequest.cancelRequestId,
                result,
                this.remark
              );
              common_vendor.index.showToast({ title: "处理完成", icon: "success" });
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
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.activeRequest
  }, $data.activeRequest ? {
    b: common_vendor.t($options.dateText($data.activeRequest.createdAt)),
    c: common_vendor.t($data.activeRequest.reason || "未提供具体原因")
  } : {}, {
    d: $data.remark,
    e: common_vendor.o(($event) => $data.remark = $event.detail.value, "95"),
    f: common_vendor.t($data.remark.length),
    g: $data.submitting,
    h: common_vendor.o(($event) => $options.handle("REJECTED"), "5e"),
    i: $data.submitting,
    j: common_vendor.o(($event) => $options.handle("APPROVED"), "6c")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
