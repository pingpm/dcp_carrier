"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      isLoggedIn: false,
      activeStatus: "",
      loading: false,
      orders: [],
      orderStatusText: common_vendor.orderStatusText,
      transportModeText: common_vendor.transportModeText,
      tabs: [
        { label: "全部", value: "" },
        { label: "待确认", value: "PENDING_CONFIRM" },
        { label: "待合同", value: "PENDING_CONTRACT" },
        { label: "待提车", value: "PENDING_PICKUP" },
        { label: "运输中", value: "IN_TRANSIT" },
        { label: "待收车", value: "PENDING_RECEIPT" },
        { label: "取消中", value: "CANCEL_PENDING" },
        { label: "已完成", value: "COMPLETED" }
      ]
    };
  },
  onLoad(options) {
    if (options.status) {
      this.activeStatus = options.status;
    }
  },
  onShow() {
    this.isLoggedIn = !!common_vendor.getToken();
    const filterStatus = common_vendor.index.getStorageSync("order_list_filter_status");
    if (filterStatus !== void 0 && filterStatus !== null && filterStatus !== "undefined") {
      this.activeStatus = filterStatus;
      common_vendor.index.removeStorageSync("order_list_filter_status");
    }
    if (this.isLoggedIn) {
      this.load();
    } else {
      this.orders = [];
    }
  },
  methods: {
    dateText: common_vendor.dateText,
    yuanText: common_vendor.yuanText,
    statusClass: common_vendor.statusClass,
    yuanVal(cent) {
      return (Number(cent || 0) / 100).toFixed(2) + " 元";
    },
    orderTimingTip(order) {
      if (order.orderStatus === "PENDING_CONFIRM" && order.carrierConfirmDeadlineAt) {
        return `请在 ${this.dateText(order.carrierConfirmDeadlineAt)} 前确认接单`;
      }
      if (order.orderStatus === "PENDING_RECEIPT" && order.autoReceiptAt) {
        return `车商未确认时，系统将在 ${this.dateText(order.autoReceiptAt)} 自动确认收车`;
      }
      return "";
    },
    formatVehicles(vehicles) {
      if (!vehicles || !vehicles.length)
        return "";
      return vehicles.map((v) => `${v.brandName} ${v.modelName || ""}`).join("，");
    },
    formatServiceAddress(order, type) {
      const prefix = type === "origin" ? "origin" : "destination";
      return [
        order[`${prefix}ProvinceName`],
        order[`${prefix}CityName`],
        order[`${prefix}DistrictName`],
        order[`${prefix}AddressDetail`]
      ].filter(Boolean).join("");
    },
    async load() {
      if (!this.isLoggedIn) {
        this.orders = [];
        return;
      }
      this.loading = true;
      try {
        const data = await common_vendor.api.orders(
          { orderStatus: this.activeStatus },
          { silent: true, authRedirect: false }
        );
        this.orders = data.orders || data.items || [];
      } catch (err) {
        this.orders = [];
      } finally {
        this.loading = false;
      }
    },
    changeStatus(status) {
      this.activeStatus = status;
      this.load();
    },
    goDetail(orderId) {
      common_vendor.index.navigateTo({ url: `/pages/order/detail?orderId=${orderId}` });
    },
    goHome() {
      common_vendor.index.switchTab({ url: "/pages/home/index" });
    },
    goLogin() {
      common_vendor.index.navigateTo({ url: "/pages/auth/login" });
    },
    async contactDealer(order) {
      try {
        const res = await common_vendor.api.getContactPhone(order.id);
        common_vendor.index.showModal({
          title: "联系车商客户",
          content: `车商姓名: ${res.contactName || "未填"}
手机号码: ${res.phone}`,
          confirmText: "拨打电话",
          confirmColor: "#1677ff",
          success: (mRes) => {
            if (mRes.confirm) {
              common_vendor.index.makePhoneCall({ phoneNumber: res.phone });
            }
          }
        });
      } catch (err) {
      }
    },
    signContract(order) {
      common_vendor.index.navigateTo({ url: `/pages/order/contract?orderId=${order.id}` });
    },
    setDriver(order) {
      common_vendor.index.navigateTo({ url: `/pages/order/driver-form?orderId=${order.id}&driverType=PICKUP` });
    },
    promptSetPickupDriver(order) {
      common_vendor.index.showModal({
        title: "请先设置提车司机",
        content: "确认提车前必须先设置提车司机。您可以立即设置，也可以稍后再操作。",
        confirmText: "去设置",
        cancelText: "稍后",
        confirmColor: "#1677ff",
        success: (res) => {
          if (res.confirm) {
            this.setDriver(order);
          }
        }
      });
    },
    async pickupVehicle(order) {
      var _a;
      try {
        const data = await common_vendor.api.orderDetail(order.id);
        const pickupDriver = (_a = data.order) == null ? void 0 : _a.driverInfo;
        if (!(pickupDriver == null ? void 0 : pickupDriver.driverName) || !(pickupDriver == null ? void 0 : pickupDriver.driverPhone)) {
          this.promptSetPickupDriver(order);
          return;
        }
      } catch (err) {
        console.error(err);
        return;
      }
      common_vendor.index.navigateTo({ url: `/pages/order/pickup?orderId=${order.id}` });
    },
    reportLocation(order) {
      common_vendor.index.navigateTo({ url: `/pages/order/transit-location?orderId=${order.id}` });
    },
    handoverVehicle(order) {
      common_vendor.index.navigateTo({ url: `/pages/order/handover?orderId=${order.id}` });
    },
    handleCancel(order) {
      common_vendor.index.navigateTo({ url: `/pages/order/cancel-handle?orderId=${order.id}` });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.f($data.tabs, (item, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t(item.label),
        b: $data.activeStatus === item.value
      }, $data.activeStatus === item.value ? {} : {}, {
        c: item.value,
        d: $data.activeStatus === item.value ? 1 : "",
        e: common_vendor.o(($event) => $options.changeStatus(item.value), item.value)
      });
    }),
    b: !$data.isLoggedIn
  }, !$data.isLoggedIn ? {
    c: common_assets._imports_0,
    d: common_vendor.o((...args) => $options.goLogin && $options.goLogin(...args), "9a")
  } : !$data.loading && $data.orders.length === 0 ? {
    f: common_assets._imports_1$3,
    g: common_vendor.o((...args) => $options.goHome && $options.goHome(...args), "26")
  } : {
    h: common_vendor.f($data.orders, (order, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t(order.dealerName || "车商客户"),
        b: common_vendor.t($data.orderStatusText[order.orderStatus]),
        c: common_vendor.n($options.statusClass(order.orderStatus)),
        d: common_vendor.t(order.orderNo),
        e: order.transportMode
      }, order.transportMode ? {
        f: common_vendor.t($data.transportModeText[order.transportMode])
      } : {}, {
        g: common_vendor.t(order.originCityName),
        h: common_vendor.t(order.originProvinceName),
        i: common_vendor.t(order.hasPickupService ? "需提车" : "不提车"),
        j: order.hasPickupService ? 1 : "",
        k: order.hasPickupService
      }, order.hasPickupService ? {
        l: common_vendor.t($options.formatServiceAddress(order, "origin"))
      } : {}, {
        m: common_vendor.t(order.destinationCityName),
        n: common_vendor.t(order.destinationProvinceName),
        o: common_vendor.t(order.hasDeliveryService ? "需送车" : "不送车"),
        p: order.hasDeliveryService ? 1 : "",
        q: order.hasDeliveryService
      }, order.hasDeliveryService ? {
        r: common_vendor.t($options.formatServiceAddress(order, "destination"))
      } : {}, {
        s: order.vehicles && order.vehicles.length
      }, order.vehicles && order.vehicles.length ? {
        t: common_assets._imports_2,
        v: common_vendor.t($options.formatVehicles(order.vehicles))
      } : {}, {
        w: common_vendor.t($options.dateText(order.createdAt)),
        x: common_vendor.t($options.yuanVal(order.orderAmountCent)),
        y: $options.orderTimingTip(order)
      }, $options.orderTimingTip(order) ? {
        z: common_vendor.t($options.orderTimingTip(order))
      } : {}, {
        A: common_vendor.o(($event) => $options.contactDealer(order), order.id),
        B: order.orderStatus === "PENDING_CONFIRM"
      }, order.orderStatus === "PENDING_CONFIRM" ? {
        C: common_vendor.o(($event) => $options.goDetail(order.id), order.id)
      } : order.orderStatus === "PENDING_CONTRACT" ? {
        E: common_vendor.o(($event) => $options.signContract(order), order.id)
      } : order.orderStatus === "PENDING_PICKUP" ? {
        G: common_vendor.o(($event) => $options.setDriver(order), order.id),
        H: common_vendor.o(($event) => $options.pickupVehicle(order), order.id)
      } : order.orderStatus === "IN_TRANSIT" ? {
        J: common_vendor.o(($event) => $options.reportLocation(order), order.id),
        K: common_vendor.o(($event) => $options.handoverVehicle(order), order.id)
      } : order.orderStatus === "CANCEL_PENDING" ? {
        M: common_vendor.o(($event) => $options.handleCancel(order), order.id)
      } : {
        N: common_vendor.o(($event) => $options.goDetail(order.id), order.id)
      }, {
        D: order.orderStatus === "PENDING_CONTRACT",
        F: order.orderStatus === "PENDING_PICKUP",
        I: order.orderStatus === "IN_TRANSIT",
        L: order.orderStatus === "CANCEL_PENDING",
        O: common_vendor.o(() => {
        }, order.id),
        P: order.id,
        Q: common_vendor.o(($event) => $options.goDetail(order.id), order.id)
      });
    }),
    i: common_assets._imports_0$2
  }, {
    e: !$data.loading && $data.orders.length === 0
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
