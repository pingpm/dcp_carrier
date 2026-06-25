"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      orderId: "",
      form: {
        driverType: "PICKUP",
        // PICKUP, HANDOVER
        driverName: "",
        driverPhone: "",
        licensePlate: "",
        idNumber: ""
      },
      submitting: false
    };
  },
  onLoad(options) {
    if (!common_vendor.requireLogin())
      return;
    this.orderId = options.orderId;
    if (["PICKUP", "HANDOVER"].includes(options.driverType)) {
      this.form.driverType = options.driverType;
    }
    this.loadCurrent();
  },
  methods: {
    async loadCurrent() {
      try {
        const data = await common_vendor.api.orderDetail(this.orderId);
        this.fillDriverForm(data.order, this.form.driverType);
      } catch (err) {
        console.error(err);
      }
    },
    fillDriverForm(order, type) {
      const driver = type === "HANDOVER" ? order == null ? void 0 : order.deliveryDriverInfo : order == null ? void 0 : order.driverInfo;
      if (!driver)
        return;
      this.form = {
        driverType: type,
        driverName: driver.driverName || "",
        driverPhone: driver.driverPhone || "",
        licensePlate: driver.licensePlate || "",
        idNumber: driver.idNumber || ""
      };
    },
    setDriverType(type) {
      this.form.driverType = type;
      this.reloadDriverInfo(type);
    },
    async reloadDriverInfo(type) {
      var _a, _b;
      try {
        const data = await common_vendor.api.orderDetail(this.orderId);
        if (type === "PICKUP" && ((_a = data.order) == null ? void 0 : _a.driverInfo)) {
          const d = data.order.driverInfo;
          this.form.driverName = d.driverName || "";
          this.form.driverPhone = d.driverPhone || "";
          this.form.licensePlate = d.licensePlate || "";
          this.form.idNumber = d.idNumber || "";
        } else if (type === "HANDOVER" && ((_b = data.order) == null ? void 0 : _b.deliveryDriverInfo)) {
          const d = data.order.deliveryDriverInfo;
          this.form.driverName = d.driverName || "";
          this.form.driverPhone = d.driverPhone || "";
          this.form.licensePlate = d.licensePlate || "";
          this.form.idNumber = d.idNumber || "";
        } else {
          this.form.driverName = "";
          this.form.driverPhone = "";
          this.form.licensePlate = "";
          this.form.idNumber = "";
        }
      } catch (err) {
      }
    },
    validate() {
      if (!this.form.driverName.trim()) {
        common_vendor.index.showToast({ title: "请输入司机姓名", icon: "none" });
        return false;
      }
      if (!/^1\d{10}$/.test(this.form.driverPhone.trim())) {
        common_vendor.index.showToast({ title: "请输入正确的11位电话号码", icon: "none" });
        return false;
      }
      if (!this.form.licensePlate.trim()) {
        common_vendor.index.showToast({ title: "请输入车牌号", icon: "none" });
        return false;
      }
      if (this.form.idNumber.trim() && this.form.idNumber.trim().length !== 18) {
        common_vendor.index.showToast({ title: "身份证号码格式不正确", icon: "none" });
        return false;
      }
      return true;
    },
    async submit() {
      if (!this.validate())
        return;
      this.submitting = true;
      try {
        await common_vendor.api.setDrivers(this.orderId, {
          driverType: this.form.driverType,
          driverName: this.form.driverName,
          driverPhone: this.form.driverPhone,
          vehiclePlateNumber: this.form.licensePlate,
          driverIdNumber: this.form.idNumber
        });
        common_vendor.index.showToast({ title: "司机设置成功", icon: "success" });
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
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.t($data.form.driverType === "PICKUP" ? "●" : ""),
    b: $data.form.driverType === "PICKUP" ? 1 : "",
    c: common_vendor.o(($event) => $options.setDriverType("PICKUP"), "83"),
    d: common_vendor.t($data.form.driverType === "HANDOVER" ? "●" : ""),
    e: $data.form.driverType === "HANDOVER" ? 1 : "",
    f: common_vendor.o(($event) => $options.setDriverType("HANDOVER"), "d7"),
    g: $data.form.driverName,
    h: common_vendor.o(($event) => $data.form.driverName = $event.detail.value, "12"),
    i: $data.form.driverPhone,
    j: common_vendor.o(($event) => $data.form.driverPhone = $event.detail.value, "23"),
    k: $data.form.licensePlate,
    l: common_vendor.o(($event) => $data.form.licensePlate = $event.detail.value, "ba"),
    m: $data.form.idNumber,
    n: common_vendor.o(($event) => $data.form.idNumber = $event.detail.value, "50"),
    o: $data.submitting,
    p: common_vendor.o((...args) => $options.submit && $options.submit(...args), "5e")
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
