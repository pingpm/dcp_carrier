"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      claimId: "",
      claim: {},
      handleResult: "APPROVED",
      remark: "",
      proofFiles: [],
      submitting: false
    };
  },
  onLoad(options) {
    if (!common_vendor.requireLogin())
      return;
    this.claimId = options.claimId;
    this.load();
  },
  methods: {
    dateText: common_vendor.dateText,
    yuanText: common_vendor.yuanText,
    async load() {
      const data = await common_vendor.api.compensationClaim(this.claimId);
      this.claim = data.claim || {};
    },
    chooseProof() {
      common_vendor.index.chooseImage({
        count: 9 - this.proofFiles.length,
        sizeType: ["compressed"],
        success: async (res) => {
          for (const path of res.tempFilePaths || []) {
            const file = await common_vendor.uploadFile(path, "IMAGE", "COMPENSATION_PROOF");
            this.proofFiles.push(file);
          }
        }
      });
    },
    removeProof(index) {
      this.proofFiles.splice(index, 1);
    },
    async submit() {
      if (!this.remark.trim()) {
        common_vendor.index.showToast({ title: this.handleResult === "APPROVED" ? "请填写赔付说明" : "请填写拒绝理由", icon: "none" });
        return;
      }
      if (this.handleResult === "APPROVED" && this.proofFiles.length === 0) {
        common_vendor.index.showToast({ title: "请上传赔付凭证", icon: "none" });
        return;
      }
      this.submitting = true;
      try {
        await common_vendor.api.handleCompensationClaim(this.claimId, {
          handleResult: this.handleResult,
          carrierHandleText: this.handleResult === "APPROVED" ? this.remark : void 0,
          rejectReason: this.handleResult === "REJECTED" ? this.remark : void 0,
          proofFileIds: this.proofFiles.map((file) => file.fileId || file.id)
        });
        common_vendor.index.showToast({ title: "已处理赔付申请", icon: "success" });
        setTimeout(() => common_vendor.index.navigateBack(), 600);
      } finally {
        this.submitting = false;
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.claim.id
  }, $data.claim.id ? {
    b: common_vendor.t($data.claim.orderNo),
    c: common_vendor.t($data.claim.dealerName),
    d: common_vendor.t($options.dateText($data.claim.agreedDeliveryTime)),
    e: common_vendor.t($options.dateText($data.claim.carrierHandoverTime)),
    f: common_vendor.t($options.yuanText($data.claim.requestedCompensationCent)),
    g: common_vendor.t($data.claim.dealerClaimText)
  } : {}, {
    h: $data.handleResult === "APPROVED" ? 1 : "",
    i: common_vendor.o(($event) => $data.handleResult = "APPROVED", "34"),
    j: $data.handleResult === "REJECTED" ? 1 : "",
    k: common_vendor.o(($event) => $data.handleResult = "REJECTED", "21"),
    l: $data.handleResult === "APPROVED" ? "填写赔付说明" : "填写拒绝理由",
    m: $data.remark,
    n: common_vendor.o(($event) => $data.remark = $event.detail.value, "ea"),
    o: $data.handleResult === "APPROVED"
  }, $data.handleResult === "APPROVED" ? common_vendor.e({
    p: common_vendor.f($data.proofFiles, (file, index, i0) => {
      return {
        a: file.fileUrl,
        b: common_vendor.o(($event) => $options.removeProof(index), file.fileId),
        c: file.fileId
      };
    }),
    q: $data.proofFiles.length < 9
  }, $data.proofFiles.length < 9 ? {
    r: common_vendor.o((...args) => $options.chooseProof && $options.chooseProof(...args), "b7")
  } : {}) : {}, {
    s: $data.submitting,
    t: common_vendor.o((...args) => $options.submit && $options.submit(...args), "ca")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-dc8b239a"]]);
wx.createPage(MiniProgramPage);
