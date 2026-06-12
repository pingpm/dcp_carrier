"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      orderId: "",
      order: {},
      vehicles: [],
      logs: [],
      orderStatusText: common_vendor.orderStatusText,
      transportModeText: common_vendor.transportModeText,
      vehicleConditionText: common_vendor.vehicleConditionText,
      pickupUrls: [],
      handoverUrls: []
    };
  },
  computed: {
    heroStatusClass() {
      const status = this.order.orderStatus;
      if (status === "COMPLETED")
        return "completed";
      if (["PENDING_CONFIRM", "PENDING_CONTRACT", "PENDING_RECEIPT", "CANCEL_PENDING"].includes(
        status
      ))
        return "warning";
      if (["PENDING_PICKUP", "IN_TRANSIT"].includes(status))
        return "in-transit";
      return "canceled";
    },
    statusIcon() {
      const status = this.order.orderStatus;
      if (status === "COMPLETED")
        return "✅";
      if (status === "PENDING_CONFIRM")
        return "⏳";
      if (status === "PENDING_CONTRACT")
        return "🖋️";
      if (status === "PENDING_RECEIPT")
        return "📦";
      if (status === "CANCEL_PENDING")
        return "⚠️";
      if (status === "IN_TRANSIT")
        return "🚚";
      if (status === "PENDING_PICKUP")
        return "🛻";
      return "❌";
    }
  },
  onLoad(options) {
    if (!common_vendor.requireLogin())
      return;
    this.orderId = options.orderId;
  },
  onShow() {
    this.load();
  },
  methods: {
    dateText: common_vendor.dateText,
    yuanText: common_vendor.yuanText,
    statusClass: common_vendor.statusClass,
    async load() {
      try {
        const data = await common_vendor.api.orderDetail(this.orderId);
        this.order = data.order || {};
        this.vehicles = data.vehicles || [];
        const rawLogs = data.logs || [];
        this.logs = rawLogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        this.pickupUrls = [];
        this.handoverUrls = [];
        if (data.mediaFiles) {
          data.mediaFiles.forEach((m) => {
            if (m.usageScene === "PICKUP_INSPECTION") {
              this.pickupUrls.push(m.fileUrl);
            } else if (m.usageScene === "HANDOVER_PHOTO") {
              this.handoverUrls.push(m.fileUrl);
            }
          });
        }
      } catch (err) {
        console.error(err);
      }
    },
    previewImg(url) {
      common_vendor.index.previewImage({ urls: [url] });
    },
    async contactDealerDirect() {
      try {
        const res = await common_vendor.api.getContactPhone(this.orderId);
        common_vendor.index.showModal({
          title: "拨打电话咨询",
          content: `联系人: ${res.contactName || "车商客户"}
电话: ${res.phone}`,
          confirmColor: "#1677ff",
          confirmText: "拨打",
          success: (mRes) => {
            if (mRes.confirm) {
              common_vendor.index.makePhoneCall({ phoneNumber: res.phone });
            }
          }
        });
      } catch (err) {
      }
    },
    async confirmOrder() {
      common_vendor.index.showModal({
        title: "确认接单提示",
        content: "确认承接此托运订单吗？确认后系统将自动扣除信息服务费，且信息费不予退还。",
        confirmColor: "#1677ff",
        success: async (res) => {
          if (res.confirm) {
            try {
              await common_vendor.api.carrierConfirm(this.orderId);
              common_vendor.index.showToast({ title: "确认接单成功", icon: "success" });
              this.load();
            } catch (err) {
              console.error(err);
            }
          }
        }
      });
    },
    cancelOrderDirect() {
      common_vendor.index.navigateTo({ url: `/pages/order/cancel-request?orderId=${this.orderId}&direct=1` });
    },
    goContract() {
      common_vendor.index.navigateTo({ url: `/pages/order/contract?orderId=${this.orderId}` });
    },
    setDriver() {
      common_vendor.index.navigateTo({ url: `/pages/order/driver-form?orderId=${this.orderId}` });
    },
    goPickup() {
      common_vendor.index.navigateTo({ url: `/pages/order/pickup?orderId=${this.orderId}` });
    },
    reportLocation() {
      common_vendor.index.navigateTo({ url: `/pages/order/transit-location?orderId=${this.orderId}` });
    },
    goHandover() {
      common_vendor.index.navigateTo({ url: `/pages/order/handover?orderId=${this.orderId}` });
    },
    goCancel() {
      common_vendor.index.navigateTo({ url: `/pages/order/cancel-request?orderId=${this.orderId}` });
    },
    goCancelHandle() {
      common_vendor.index.navigateTo({ url: `/pages/order/cancel-handle?orderId=${this.orderId}` });
    },
    goCancelLogs() {
      common_vendor.index.navigateTo({ url: `/pages/order/transactions` });
      this.viewCancelHistory();
    },
    async viewCancelHistory() {
      try {
        const logs = await common_vendor.api.cancelLogs(this.orderId);
        if (!logs || !logs.length) {
          common_vendor.index.showModal({
            title: "协商取消历史",
            content: "该订单暂无协商取消记录",
            showCancel: false,
            confirmColor: "#1677ff"
          });
          return;
        }
        let txt = "";
        logs.forEach((item, index) => {
          txt += `[${index + 1}] 发起人: ${item.initiatorRole === "CARRIER" ? "我方承运商" : "车商客户"}
`;
          txt += `原因: ${item.cancelReason}
`;
          txt += `状态: ${this.translateCancelStatus(item.status)}
`;
          if (item.rejectReason)
            txt += `拒绝理由: ${item.rejectReason}
`;
          txt += `时间: ${this.dateText(item.createdAt)}

`;
        });
        common_vendor.index.showModal({
          title: "协商取消历史",
          content: txt,
          showCancel: false,
          confirmColor: "#1677ff"
        });
      } catch (err) {
      }
    },
    translateCancelStatus(status) {
      const map = {
        PENDING: "待处理",
        APPROVED: "同意取消",
        REJECTED: "拒绝取消",
        WITHDRAWN: "已撤回"
      };
      return map[status] || status;
    },
    getLogStatusClass(actionType) {
      if ([
        "RECEIPT_CONFIRM",
        "COMPLETED",
        "HANDOVER_CONFIRM",
        "CONTRACT_SIGN",
        "GUARANTEE_PAID",
        "CONFIRM_CONTRACT",
        "AUTO_RECEIPT",
        "CANCEL_APPROVED"
      ].includes(actionType)) {
        return "status-success";
      }
      if ([
        "CANCEL_REQUEST",
        "CANCEL_HANDLE",
        "FORCE_CANCEL",
        "ADMIN_FORCE_CANCEL",
        "DIRECT_CANCEL",
        "CANCEL_REJECTED"
      ].includes(actionType)) {
        return "status-danger";
      }
      if ([
        "PICKUP_CONFIRM",
        "TRANSIT_REPORT",
        "SET_DRIVER",
        "PICKUP",
        "TRANSIT_LOCATION",
        "HANDOVER"
      ].includes(actionType)) {
        return "status-info";
      }
      return "status-warning";
    },
    logActionText(actionType) {
      if (!actionType)
        return "";
      const key = String(actionType).toUpperCase();
      const map = {
        CREATE: "订单提交创建",
        CREATE_ORDER: "订单提交创建",
        GUARANTEE_PAID: "车商已支付担保费",
        CARRIER_CONFIRM: "承运商确认接单",
        CONFIRM_CONTRACT: "双方确认合同",
        CONTRACT_SIGN: "双方确认合同",
        SET_DRIVER: "设置司机信息",
        PICKUP: "提车验车完成",
        PICKUP_CONFIRM: "提车验车完成",
        TRANSIT_LOCATION: "位置上报",
        TRANSIT_REPORT: "位置上报",
        HANDOVER: "交车确认完成",
        HANDOVER_CONFIRM: "交车确认完成",
        RECEIPT_CONFIRM: "车商收车结算",
        DEALER_CONFIRM_RECEIPT: "车商收车结算",
        AUTO_RECEIPT: "系统自动确认收车",
        DIRECT_CANCEL: "订单取消关闭",
        CANCEL_REQUEST: "发起取消申请",
        CANCEL_WITHDRAW: "撤回取消申请",
        WITHDRAW: "撤回取消申请",
        CANCEL_HANDLE: "取消申请已处理",
        CANCEL_APPROVED: "同意取消申请",
        CANCEL_REJECTED: "拒绝取消申请",
        FORCE_CANCEL: "系统强制取消",
        ADMIN_FORCE_CANCEL: "系统强制取消",
        STATUS_CHANGE: "订单状态变更"
      };
      return map[key] || actionType;
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.order.id
  }, $data.order.id ? common_vendor.e({
    b: common_vendor.t($options.statusIcon),
    c: common_vendor.t($data.orderStatusText[$data.order.orderStatus] || "-"),
    d: common_vendor.t($data.order.orderNo),
    e: $data.order.orderStatus === "PENDING_RECEIPT"
  }, $data.order.orderStatus === "PENDING_RECEIPT" ? {} : $data.order.orderStatus === "PENDING_CONFIRM" ? {} : {}, {
    f: $data.order.orderStatus === "PENDING_CONFIRM",
    g: common_vendor.n($options.heroStatusClass),
    h: common_vendor.t($data.order.originCityName),
    i: common_vendor.t($data.order.originProvinceName),
    j: common_vendor.t($data.transportModeText[$data.order.transportMode]),
    k: common_vendor.t($data.order.destinationCityName),
    l: common_vendor.t($data.order.destinationProvinceName),
    m: common_vendor.t($options.yuanText($data.order.orderAmountCent)),
    n: common_vendor.t($options.dateText($data.order.agreedDeliveryTime)),
    o: common_vendor.t($data.order.hasInvoice ? "需要发票（线下交付）" : "不需要发票"),
    p: common_vendor.t($data.order.dealerName || "车商客户"),
    q: common_vendor.t($data.order.senderName),
    r: common_vendor.t($data.order.senderPhone),
    s: common_vendor.t($data.order.receiverName),
    t: common_vendor.t($data.order.receiverPhone),
    v: common_vendor.t($data.vehicles.length),
    w: common_vendor.f($data.vehicles, (vehicle, k0, i0) => {
      return {
        a: common_vendor.t(vehicle.brandName),
        b: common_vendor.t(vehicle.seriesName || ""),
        c: common_vendor.t(vehicle.modelName || ""),
        d: common_vendor.t(vehicle.vin || "未录入"),
        e: common_vendor.t(vehicle.vehicleConditionType === "NEW" ? "新车" : "二手车"),
        f: vehicle.id
      };
    }),
    x: $data.order.driverInfo || $data.order.deliveryDriverInfo
  }, $data.order.driverInfo || $data.order.deliveryDriverInfo ? common_vendor.e({
    y: $data.order.driverInfo
  }, $data.order.driverInfo ? {
    z: common_vendor.t($data.order.driverInfo.driverName),
    A: common_vendor.t($data.order.driverInfo.driverPhone),
    B: common_vendor.t($data.order.driverInfo.licensePlate),
    C: common_vendor.t($data.order.driverInfo.idNumber || "-")
  } : {}, {
    D: $data.order.deliveryDriverInfo
  }, $data.order.deliveryDriverInfo ? {
    E: common_vendor.t($data.order.deliveryDriverInfo.driverName),
    F: common_vendor.t($data.order.deliveryDriverInfo.driverPhone),
    G: common_vendor.t($data.order.deliveryDriverInfo.licensePlate),
    H: common_vendor.t($data.order.deliveryDriverInfo.idNumber || "-")
  } : {}) : {}, {
    I: $data.order.pickupDetails
  }, $data.order.pickupDetails ? common_vendor.e({
    J: common_vendor.t($options.dateText($data.order.pickupDetails.pickupTime)),
    K: $data.order.pickupDetails.remark
  }, $data.order.pickupDetails.remark ? {
    L: common_vendor.t($data.order.pickupDetails.remark)
  } : {}, {
    M: common_vendor.f($data.pickupUrls, (url, index, i0) => {
      return {
        a: url,
        b: common_vendor.o(($event) => $options.previewImg(url), index),
        c: index
      };
    })
  }) : {}, {
    N: $data.order.handoverDetails
  }, $data.order.handoverDetails ? common_vendor.e({
    O: common_vendor.t($options.dateText($data.order.handoverDetails.handoverTime)),
    P: $data.order.handoverDetails.remark
  }, $data.order.handoverDetails.remark ? {
    Q: common_vendor.t($data.order.handoverDetails.remark)
  } : {}, {
    R: common_vendor.f($data.handoverUrls, (url, index, i0) => {
      return {
        a: url,
        b: common_vendor.o(($event) => $options.previewImg(url), index),
        c: index
      };
    })
  }) : {}, {
    S: $data.order.transitLocations && $data.order.transitLocations.length
  }, $data.order.transitLocations && $data.order.transitLocations.length ? {
    T: common_vendor.f($data.order.transitLocations, (loc, idx, i0) => {
      return common_vendor.e({
        a: idx < $data.order.transitLocations.length - 1
      }, idx < $data.order.transitLocations.length - 1 ? {} : {}, {
        b: common_vendor.t(loc.cityName),
        c: common_vendor.t($options.dateText(loc.createdAt)),
        d: common_vendor.t(loc.address),
        e: loc.remark
      }, loc.remark ? {
        f: common_vendor.t(loc.remark)
      } : {}, {
        g: idx
      });
    })
  } : {}, {
    U: common_vendor.f($data.logs, (log, idx, i0) => {
      return common_vendor.e({
        a: common_vendor.n($options.getLogStatusClass(log.actionType)),
        b: idx < $data.logs.length - 1
      }, idx < $data.logs.length - 1 ? {} : {}, {
        c: common_vendor.t($options.logActionText(log.actionType)),
        d: log.remark
      }, log.remark ? {
        e: common_vendor.t(log.remark)
      } : {}, {
        f: common_vendor.t($options.dateText(log.createdAt)),
        g: log.id,
        h: idx === 0 ? 1 : ""
      });
    }),
    V: $data.order.orderStatus === "PENDING_CONFIRM"
  }, $data.order.orderStatus === "PENDING_CONFIRM" ? {} : {}, {
    W: $data.order.orderStatus === "PENDING_CONFIRM"
  }, $data.order.orderStatus === "PENDING_CONFIRM" ? {
    X: common_vendor.o((...args) => $options.cancelOrderDirect && $options.cancelOrderDirect(...args), "3d"),
    Y: common_vendor.o((...args) => $options.confirmOrder && $options.confirmOrder(...args), "a1")
  } : $data.order.orderStatus === "PENDING_CONTRACT" ? {
    aa: common_vendor.o((...args) => $options.goCancel && $options.goCancel(...args), "55"),
    ab: common_vendor.o((...args) => $options.goContract && $options.goContract(...args), "5b")
  } : $data.order.orderStatus === "PENDING_PICKUP" ? {
    ad: common_vendor.o((...args) => $options.setDriver && $options.setDriver(...args), "97"),
    ae: common_vendor.o((...args) => $options.goPickup && $options.goPickup(...args), "cb"),
    af: common_vendor.o((...args) => $options.goCancel && $options.goCancel(...args), "98")
  } : $data.order.orderStatus === "IN_TRANSIT" ? {
    ah: common_vendor.o((...args) => $options.reportLocation && $options.reportLocation(...args), "2e"),
    ai: common_vendor.o((...args) => $options.setDriver && $options.setDriver(...args), "95"),
    aj: common_vendor.o((...args) => $options.goHandover && $options.goHandover(...args), "bc"),
    ak: common_vendor.o((...args) => $options.goCancel && $options.goCancel(...args), "0e")
  } : $data.order.orderStatus === "CANCEL_PENDING" ? {
    am: common_vendor.o((...args) => $options.goCancelHandle && $options.goCancelHandle(...args), "33")
  } : {
    an: common_vendor.o((...args) => $options.contactDealerDirect && $options.contactDealerDirect(...args), "99")
  }, {
    Z: $data.order.orderStatus === "PENDING_CONTRACT",
    ac: $data.order.orderStatus === "PENDING_PICKUP",
    ag: $data.order.orderStatus === "IN_TRANSIT",
    al: $data.order.orderStatus === "CANCEL_PENDING",
    ao: common_vendor.o((...args) => $options.goCancelLogs && $options.goCancelLogs(...args), "ec")
  }) : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
