"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      profile: {
        companyName: "",
        creditCode: "",
        legalRepresentativeName: "",
        registeredPhone: "",
        contactPhone: "",
        reviewStatus: "",
        introduction: ""
      },
      introduction: "",
      saving: false
    };
  },
  computed: {
    introductionLength() {
      return (this.introduction || "").length;
    }
  },
  onShow() {
    if (common_vendor.requireLogin()) {
      this.fetchProfile();
    }
  },
  methods: {
    async fetchProfile() {
      try {
        common_vendor.index.showLoading({ title: "加载中..." });
        const res = await common_vendor.api.companyProfile();
        this.profile = res || {};
        this.introduction = res.introduction || "";
      } catch (error) {
        console.error("获取企业介绍失败:", error);
      } finally {
        common_vendor.index.hideLoading();
      }
    },
    onInput(e) {
      this.introduction = e.detail.value;
    },
    async saveProfile() {
      try {
        this.saving = true;
        common_vendor.index.showLoading({ title: "保存中..." });
        await common_vendor.api.saveCompanyProfile({ introduction: this.introduction });
        common_vendor.index.showToast({ title: "保存成功", icon: "success" });
        setTimeout(() => {
          common_vendor.index.navigateBack();
        }, 1500);
      } catch (error) {
        console.error("保存企业介绍失败:", error);
      } finally {
        this.saving = false;
        common_vendor.index.hideLoading();
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.t($data.profile.companyName || "企业名称未完善"),
    b: $data.profile.reviewStatus === "APPROVED"
  }, $data.profile.reviewStatus === "APPROVED" ? {} : $data.profile.reviewStatus === "PENDING" ? {} : $data.profile.reviewStatus === "REJECTED" ? {} : {}, {
    c: $data.profile.reviewStatus === "PENDING",
    d: $data.profile.reviewStatus === "REJECTED",
    e: common_vendor.t($data.profile.creditCode || "暂无"),
    f: common_vendor.t($data.profile.legalRepresentativeName || "暂无"),
    g: common_vendor.t($data.profile.registeredPhone || "暂无"),
    h: common_vendor.t($data.profile.contactPhone || "暂无"),
    i: common_vendor.o([($event) => $data.introduction = $event.detail.value, (...args) => $options.onInput && $options.onInput(...args)], "03"),
    j: $data.introduction,
    k: common_vendor.t($options.introductionLength),
    l: $data.saving,
    m: common_vendor.o((...args) => $options.saveProfile && $options.saveProfile(...args), "8c")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
