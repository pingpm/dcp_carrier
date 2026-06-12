"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      phone: "13800000001",
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
        let title = data.mockSent ? "验证码已模拟发送" : "验证码已发送";
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
        const data = await common_vendor.api.login(this.phone, this.verificationCode);
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
    a: $data.phone,
    b: common_vendor.o(($event) => $data.phone = $event.detail.value, "f4"),
    c: $data.verificationCode,
    d: common_vendor.o(($event) => $data.verificationCode = $event.detail.value, "3f"),
    e: common_vendor.t($data.countdown > 0 ? `${$data.countdown}s` : "获取验证码"),
    f: $data.codeLoading || $data.countdown > 0,
    g: common_vendor.o((...args) => $options.sendCode && $options.sendCode(...args), "9b"),
    h: $data.loading,
    i: common_vendor.o((...args) => $options.login && $options.login(...args), "a6"),
    j: $data.agreementAccepted,
    k: common_vendor.o((...args) => $options.toggleAgreement && $options.toggleAgreement(...args), "19"),
    l: common_vendor.o(($event) => $options.openAgreement("terms"), "70"),
    m: common_vendor.o(($event) => $options.openAgreement("privacy"), "89"),
    n: common_vendor.o((...args) => $options.toggleAgreement && $options.toggleAgreement(...args), "1c")
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
