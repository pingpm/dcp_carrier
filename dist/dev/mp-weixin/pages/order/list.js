"use strict";
const common_vendor = require("../../common/vendor.js");
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
    formatVehicles(vehicles) {
      if (!vehicles || !vehicles.length)
        return "";
      return vehicles.map((v) => `${v.brandName} ${v.modelName || ""}`).join("，");
    },
    async load() {
      if (!this.isLoggedIn) {
        this.orders = [];
        return;
      }
      this.loading = true;
      try {
        const data = await common_vendor.api.orders({ orderStatus: this.activeStatus });
        this.orders = data.orders || data.items || [];
      } catch (err) {
        console.error(err);
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
    async confirmOrder(order) {
      common_vendor.index.showModal({
        title: "确认接单提示",
        content: "确认承接此托运订单吗？确认后系统将自动扣除信息服务费，且信息费不予退还。",
        confirmColor: "#1677ff",
        success: async (res) => {
          if (res.confirm) {
            try {
              await common_vendor.api.carrierConfirm(order.id);
              common_vendor.index.showToast({ title: "确认订单成功", icon: "success" });
              this.load();
            } catch (err) {
              console.error(err);
            }
          }
        }
      });
    },
    cancelOrderDirect(order) {
      common_vendor.index.navigateTo({ url: `/pages/order/cancel-request?orderId=${order.id}` });
    },
    signContract(order) {
      common_vendor.index.navigateTo({ url: `/pages/order/contract?orderId=${order.id}` });
    },
    setDriver(order) {
      common_vendor.index.navigateTo({ url: `/pages/order/driver-form?orderId=${order.id}` });
    },
    pickupVehicle(order) {
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
    c: common_vendor.o((...args) => $options.goLogin && $options.goLogin(...args), "aa")
  } : !$data.loading && $data.orders.length === 0 ? {
    e: common_vendor.o((...args) => $options.goHome && $options.goHome(...args), "7e")
  } : {
    f: common_vendor.f($data.orders, (order, k0, i0) => {
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
        i: common_vendor.t(order.destinationCityName),
        j: common_vendor.t(order.destinationProvinceName),
        k: order.vehicles && order.vehicles.length
      }, order.vehicles && order.vehicles.length ? {
        l: common_vendor.t($options.formatVehicles(order.vehicles))
      } : {}, {
        m: common_vendor.t($options.dateText(order.createdAt)),
        n: common_vendor.t($options.yuanVal(order.orderAmountCent)),
        o: common_vendor.o(($event) => $options.contactDealer(order), order.id),
        p: order.orderStatus === "PENDING_CONFIRM"
      }, order.orderStatus === "PENDING_CONFIRM" ? {
        q: common_vendor.o(($event) => $options.cancelOrderDirect(order), order.id),
        r: common_vendor.o(($event) => $options.confirmOrder(order), order.id)
      } : order.orderStatus === "PENDING_CONTRACT" ? {
        t: common_vendor.o(($event) => $options.signContract(order), order.id)
      } : order.orderStatus === "PENDING_PICKUP" ? {
        w: common_vendor.o(($event) => $options.setDriver(order), order.id),
        x: common_vendor.o(($event) => $options.pickupVehicle(order), order.id)
      } : order.orderStatus === "IN_TRANSIT" ? {
        z: common_vendor.o(($event) => $options.reportLocation(order), order.id),
        A: common_vendor.o(($event) => $options.handoverVehicle(order), order.id)
      } : order.orderStatus === "CANCEL_PENDING" ? {
        C: common_vendor.o(($event) => $options.handleCancel(order), order.id)
      } : {
        D: common_vendor.o(($event) => $options.goDetail(order.id), order.id)
      }, {
        s: order.orderStatus === "PENDING_CONTRACT",
        v: order.orderStatus === "PENDING_PICKUP",
        y: order.orderStatus === "IN_TRANSIT",
        B: order.orderStatus === "CANCEL_PENDING",
        E: common_vendor.o(() => {
        }, order.id),
        F: order.id,
        G: common_vendor.o(($event) => $options.goDetail(order.id), order.id)
      });
    })
  }, {
    d: !$data.loading && $data.orders.length === 0
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
