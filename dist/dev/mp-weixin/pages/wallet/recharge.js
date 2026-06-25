"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const defaultRechargeConfig = {
  methods: {
    DEPOSIT: { wechatEnabled: true, offlineEnabled: false },
    INFO_FEE: { wechatEnabled: true, offlineEnabled: false }
  },
  offlineAccount: {
    accountName: "",
    bankName: "",
    bankBranch: "",
    accountNo: "",
    transferRemark: "",
    contact: ""
  }
};
const _sfc_main = {
  data() {
    return {
      presets: [100, 500, 1e3, 2e3, 5e3],
      amountYuan: "1000",
      form: {
        walletType: "DEPOSIT",
        amountCent: 0
      },
      payMethod: "WECHAT",
      rechargeConfig: defaultRechargeConfig,
      transferProfile: {
        companyName: "",
        registeredPhone: ""
      },
      submitting: false
    };
  },
  computed: {
    currentMethods() {
      return this.rechargeConfig.methods[this.form.walletType] || {
        wechatEnabled: false,
        offlineEnabled: false
      };
    },
    offlineAccount() {
      return this.rechargeConfig.offlineAccount || defaultRechargeConfig.offlineAccount;
    },
    walletTypeLabel() {
      return this.form.walletType === "DEPOSIT" ? "保证金" : "信息服务费";
    },
    transferCompanyName() {
      return this.transferProfile.companyName || "未获取到企业名称";
    },
    transferRegisteredPhone() {
      return this.transferProfile.registeredPhone || "未获取到注册手机号";
    },
    transferInfoText() {
      return [
        `企业名称：${this.transferCompanyName}`,
        ` 注册手机号：${this.transferRegisteredPhone}`,
        ` 充值类型：${this.walletTypeLabel}账户`
      ].join("");
    }
  },
  async onLoad(options) {
    if (!common_vendor.requireLogin())
      return;
    if (options.type) {
      this.form.walletType = options.type;
    }
    await Promise.all([this.loadRechargeConfig(), this.loadTransferProfile()]);
  },
  methods: {
    async loadTransferProfile() {
      var _a, _b, _c, _d;
      try {
        const res = await common_vendor.api.me({ authRedirect: false, silent: true });
        let companyName = ((_a = res == null ? void 0 : res.profile) == null ? void 0 : _a.companyName) || ((_b = res == null ? void 0 : res.user) == null ? void 0 : _b.nickname) || "";
        let registeredPhone = ((_c = res == null ? void 0 : res.profile) == null ? void 0 : _c.registeredPhone) || ((_d = res == null ? void 0 : res.user) == null ? void 0 : _d.registeredPhone) || "";
        if (!companyName || !registeredPhone) {
          try {
            const status = await common_vendor.api.verificationStatus({ authRedirect: false, silent: true });
            companyName = companyName || (status == null ? void 0 : status.companyName) || "";
            registeredPhone = registeredPhone || (status == null ? void 0 : status.registeredPhone) || "";
          } catch (err) {
          }
        }
        this.transferProfile = {
          companyName,
          registeredPhone
        };
      } catch (err) {
        this.transferProfile = { companyName: "", registeredPhone: "" };
      }
    },
    async loadRechargeConfig() {
      try {
        const wallet = await common_vendor.api.walletIndex();
        this.rechargeConfig = wallet.rechargeConfig || defaultRechargeConfig;
        this.ensurePayMethod();
      } catch (err) {
        console.error(err);
        this.ensurePayMethod();
      }
    },
    ensurePayMethod() {
      if (this.payMethod === "WECHAT" && this.currentMethods.wechatEnabled)
        return;
      if (this.payMethod === "OFFLINE" && this.currentMethods.offlineEnabled)
        return;
      if (this.currentMethods.wechatEnabled) {
        this.payMethod = "WECHAT";
      } else if (this.currentMethods.offlineEnabled) {
        this.payMethod = "OFFLINE";
      } else {
        this.payMethod = "";
      }
    },
    setWalletType(type) {
      this.form.walletType = type;
      this.ensurePayMethod();
    },
    setPayMethod(method) {
      this.payMethod = method;
    },
    selectPreset(amt) {
      this.amountYuan = String(amt);
    },
    copyText(text) {
      if (!text) {
        common_vendor.index.showToast({ title: "暂无可复制内容", icon: "none" });
        return;
      }
      common_vendor.index.setClipboardData({
        data: text,
        success: () => {
          common_vendor.index.showToast({ title: "已复制", icon: "none" });
        }
      });
    },
    validate() {
      if (this.payMethod !== "WECHAT")
        return false;
      const cent = common_vendor.yuanToCent(this.amountYuan);
      if (!cent || cent <= 0) {
        common_vendor.index.showToast({ title: "请输入有效的充值金额", icon: "none" });
        return false;
      }
      this.form.amountCent = cent;
      return true;
    },
    async submit() {
      if (!this.currentMethods.wechatEnabled) {
        common_vendor.index.showToast({ title: "当前账户未开启微信支付", icon: "none" });
        return;
      }
      if (!this.validate())
        return;
      this.submitting = true;
      try {
        const res = await common_vendor.api.recharge(this.form);
        try {
          await common_vendor.requestWechatPayment(res.paymentParams);
        } catch (err) {
          common_vendor.index.showToast({ title: "充值单已创建，待支付", icon: "none" });
          return;
        }
        try {
          await common_vendor.api.syncWechatPayment(res.paymentId);
        } catch (err) {
          common_vendor.index.showToast({ title: "支付已完成，正在等待确认", icon: "none" });
          return;
        }
        common_vendor.index.showModal({
          title: "支付充值成功",
          content: `已成功向您的【${this.form.walletType === "DEPOSIT" ? "保证金" : "信息服务费"}】账户充值 ${this.amountYuan} 元。`,
          showCancel: false,
          success: () => {
            common_vendor.index.navigateBack();
          }
        });
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
    a: common_vendor.t($data.form.walletType === "DEPOSIT" ? "●" : ""),
    b: $data.form.walletType === "DEPOSIT" ? 1 : "",
    c: common_vendor.o(($event) => $options.setWalletType("DEPOSIT"), "e9"),
    d: common_vendor.t($data.form.walletType === "INFO_FEE" ? "●" : ""),
    e: $data.form.walletType === "INFO_FEE" ? 1 : "",
    f: common_vendor.o(($event) => $options.setWalletType("INFO_FEE"), "90"),
    g: $options.currentMethods.wechatEnabled
  }, $options.currentMethods.wechatEnabled ? common_vendor.e({
    h: common_assets._imports_0$4,
    i: $data.payMethod === "WECHAT"
  }, $data.payMethod === "WECHAT" ? {} : {}, {
    j: $data.payMethod === "WECHAT" ? 1 : "",
    k: common_vendor.o(($event) => $options.setPayMethod("WECHAT"), "55")
  }) : {}, {
    l: $options.currentMethods.offlineEnabled
  }, $options.currentMethods.offlineEnabled ? common_vendor.e({
    m: $data.payMethod === "OFFLINE"
  }, $data.payMethod === "OFFLINE" ? {} : {}, {
    n: $data.payMethod === "OFFLINE" ? 1 : "",
    o: common_vendor.o(($event) => $options.setPayMethod("OFFLINE"), "76")
  }) : {}, {
    p: $data.payMethod === "WECHAT"
  }, $data.payMethod === "WECHAT" ? {
    q: common_vendor.f($data.presets, (amt, k0, i0) => {
      return {
        a: common_vendor.t(amt),
        b: amt,
        c: $data.amountYuan === String(amt) ? 1 : "",
        d: common_vendor.o(($event) => $options.selectPreset(amt), amt)
      };
    }),
    r: $data.amountYuan,
    s: common_vendor.o(($event) => $data.amountYuan = $event.detail.value, "79")
  } : {}, {
    t: $data.payMethod === "OFFLINE"
  }, $data.payMethod === "OFFLINE" ? common_vendor.e({
    v: common_vendor.t($options.walletTypeLabel),
    w: common_vendor.t($options.offlineAccount.accountName || "-"),
    x: common_vendor.o(($event) => $options.copyText($options.offlineAccount.accountName), "af"),
    y: common_vendor.t($options.offlineAccount.bankName || "-"),
    z: common_vendor.o(($event) => $options.copyText($options.offlineAccount.bankName), "ea"),
    A: $options.offlineAccount.bankBranch
  }, $options.offlineAccount.bankBranch ? {
    B: common_vendor.t($options.offlineAccount.bankBranch),
    C: common_vendor.o(($event) => $options.copyText($options.offlineAccount.bankBranch), "24")
  } : {}, {
    D: common_vendor.t($options.offlineAccount.accountNo || "-"),
    E: common_vendor.o(($event) => $options.copyText($options.offlineAccount.accountNo), "3a"),
    F: common_vendor.t($options.offlineAccount.contact || "-"),
    G: common_vendor.o(($event) => $options.copyText($options.offlineAccount.contact), "01"),
    H: common_vendor.o(($event) => $options.copyText($options.transferInfoText), "53"),
    I: $options.offlineAccount.transferRemark
  }, $options.offlineAccount.transferRemark ? {
    J: common_vendor.t($options.offlineAccount.transferRemark)
  } : {}, {
    K: common_vendor.t($options.transferCompanyName),
    L: common_vendor.o(($event) => $options.copyText($options.transferCompanyName), "87"),
    M: common_vendor.t($options.transferRegisteredPhone),
    N: common_vendor.o(($event) => $options.copyText($options.transferRegisteredPhone), "e4"),
    O: common_vendor.t($options.walletTypeLabel),
    P: common_vendor.o(($event) => $options.copyText(`${$options.walletTypeLabel}账户`), "d1")
  }) : {}, {
    Q: !$options.currentMethods.wechatEnabled && !$options.currentMethods.offlineEnabled
  }, !$options.currentMethods.wechatEnabled && !$options.currentMethods.offlineEnabled ? {} : {}, {
    R: $data.payMethod === "WECHAT"
  }, $data.payMethod === "WECHAT" ? {
    S: $data.submitting,
    T: common_vendor.o((...args) => $options.submit && $options.submit(...args), "f4")
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
