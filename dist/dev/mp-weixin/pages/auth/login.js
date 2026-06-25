"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      phone: "",
      verificationCode: "",
      loading: false,
      codeLoading: false,
      countdown: 0,
      countdownTimer: null,
      agreementAccepted: true
    };
  },
  onUnload() {
    if (this.countdownTimer)
      clearInterval(this.countdownTimer);
  },
  methods: {
    validatePhone() {
      if (!/^1\d{10}$/.test(this.phone)) {
        common_vendor.index.showToast({ title: "请输入 11 位有效手机号", icon: "none" });
        return false;
      }
      return true;
    },
    validateAgreement() {
      if (!this.agreementAccepted) {
        common_vendor.index.showToast({ title: "请先勾选注册协议和隐私协议", icon: "none" });
        return false;
      }
      return true;
    },
    toggleAgreement() {
      this.agreementAccepted = !this.agreementAccepted;
    },
    openAgreement(type) {
      common_vendor.index.navigateTo({ url: `/pages/agreement/detail?type=${type}` });
    },
    async sendCode() {
      if (!this.validatePhone() || this.countdown > 0)
        return;
      this.codeLoading = true;
      try {
        const data = await common_vendor.api.sendLoginCode(this.phone);
        let title = "验证码短信已发送";
        if (data.isRegistered === false) {
          title += "（新手机号登录将自动注册）";
        }
        common_vendor.index.showToast({ title, icon: "none" });
        this.countdown = 60;
        this.countdownTimer = setInterval(() => {
          this.countdown -= 1;
          if (this.countdown <= 0 && this.countdownTimer) {
            clearInterval(this.countdownTimer);
            this.countdownTimer = null;
          }
        }, 1e3);
      } finally {
        this.codeLoading = false;
      }
    },
    async login() {
      if (!this.validateAgreement()) {
        return;
      }
      if (!this.validatePhone()) {
        return;
      }
      if (!/^\d{6}$/.test(this.verificationCode)) {
        common_vendor.index.showToast({ title: "请输入 6 位验证码", icon: "none" });
        return;
      }
      this.loading = true;
      try {
        const wxCode = await common_vendor.miniappLoginCode();
        const data = wxCode ? await common_vendor.api.loginWithWechatCode(this.phone, this.verificationCode, wxCode) : await common_vendor.api.login(this.phone, this.verificationCode);
        common_vendor.setSession(data);
        common_vendor.goAfterLogin(data);
      } finally {
        this.loading = false;
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_assets._imports_1$1,
    b: $data.phone,
    c: common_vendor.o(($event) => $data.phone = $event.detail.value, "d2"),
    d: $data.verificationCode,
    e: common_vendor.o(($event) => $data.verificationCode = $event.detail.value, "3d"),
    f: common_vendor.t($data.countdown > 0 ? `${$data.countdown}s` : "获取验证码"),
    g: $data.codeLoading || $data.countdown > 0,
    h: common_vendor.o((...args) => $options.sendCode && $options.sendCode(...args), "ab"),
    i: $data.loading,
    j: common_vendor.o((...args) => $options.login && $options.login(...args), "09"),
    k: $data.agreementAccepted,
    l: common_vendor.o((...args) => $options.toggleAgreement && $options.toggleAgreement(...args), "cd"),
    m: common_vendor.o(($event) => $options.openAgreement("terms"), "18"),
    n: common_vendor.o(($event) => $options.openAgreement("privacy"), "55"),
    o: common_vendor.o((...args) => $options.toggleAgreement && $options.toggleAgreement(...args), "6b")
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
