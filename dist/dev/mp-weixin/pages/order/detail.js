"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
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
      handoverUrls: [],
      compensationClaim: null,
      showMoreActions: false
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
    statusIconPath() {
      const status = this.order.orderStatus;
      if (status === "COMPLETED")
        return "/static/icons/check-circle.svg";
      if (status === "PENDING_CONFIRM")
        return "/static/icons/clock.svg";
      if (status === "PENDING_CONTRACT")
        return "/static/icons/file-text.svg";
      if (status === "PENDING_RECEIPT")
        return "/static/icons/package.svg";
      if (status === "CANCEL_PENDING")
        return "/static/icons/alert-triangle.svg";
      if (status === "IN_TRANSIT")
        return "/static/icons/truck.svg";
      if (status === "PENDING_PICKUP")
        return "/static/icons/map-pin.svg";
      return "/static/icons/alert-triangle.svg";
    },
    footerPrimaryAction() {
      const status = this.order.orderStatus;
      const map = {
        PENDING_CONFIRM: this.action("confirm", "确认接单", "primary-btn", this.confirmOrder),
        PENDING_CONTRACT: this.action("contract", "确认合同", "primary-btn", this.goContract),
        PENDING_PICKUP: this.action("pickup", "确认提车", "primary-btn", this.goPickup),
        IN_TRANSIT: this.action("handover", "确认交车", "primary-btn", this.goHandover),
        CANCEL_PENDING: this.action("cancelHandle", "处理取消", "primary-btn", this.goCancelHandle)
      };
      return map[status] || this.action("contact", "联系车商", "primary-btn", this.contactDealerDirect);
    },
    footerSecondaryAction() {
      const status = this.order.orderStatus;
      if (status === "PENDING_CONFIRM") {
        return this.action("contact", "联系车商", "secondary-btn", this.contactDealerDirect);
      }
      if (status === "PENDING_PICKUP") {
        return this.action("pickupDriver", "提车司机", "secondary-btn", () => this.setDriver("PICKUP"));
      }
      if (status === "IN_TRANSIT") {
        return this.action("location", "上报位置", "secondary-btn", this.reportLocation);
      }
      return null;
    },
    moreFooterActions() {
      const status = this.order.orderStatus;
      const actions = [];
      if (["PENDING_CONTRACT", "PENDING_PICKUP", "IN_TRANSIT", "CANCEL_PENDING"].includes(status)) {
        actions.push(this.action("contact", "联系车商客户", "plain-btn", this.contactDealerDirect));
      }
      if (status === "PENDING_CONFIRM") {
        actions.push(this.action("directCancel", "拒绝 / 取消订单", "danger-btn", this.cancelOrderDirect, true));
      }
      if (["PENDING_CONTRACT", "PENDING_PICKUP", "IN_TRANSIT"].includes(status)) {
        actions.push(this.action("cancel", "发起取消协商", "danger-btn", this.goCancel, true));
      }
      if (status === "IN_TRANSIT") {
        actions.push(this.action("handoverDriver", "设置交车司机", "plain-btn", () => this.setDriver("HANDOVER")));
      }
      actions.push(this.action("cancelLogs", "协商取消历史", "plain-btn", this.goCancelLogs));
      return actions;
    },
    pendingConfirmTip() {
      const deadline = this.order.carrierConfirmDeadlineAt ? this.dateText(this.order.carrierConfirmDeadlineAt) : "";
      const deadlineText = deadline ? `请在 ${deadline} 前完成确认。` : "请尽快完成确认。";
      return `${deadlineText}确认接单前请核对托运路线、车辆和费用，确认后将扣除信息服务费。`;
    },
    pendingReceiptTip() {
      const autoReceiptAt = this.order.autoReceiptAt ? this.dateText(this.order.autoReceiptAt) : "";
      if (autoReceiptAt) {
        return `车辆已安全送达。车商未主动确认时，系统将在 ${autoReceiptAt} 自动确认收车。`;
      }
      return "车辆已安全送达。请等待车商确认收车，超时未确认时系统将自动处理。";
    },
    confirmFooterTip() {
      const deadline = this.order.carrierConfirmDeadlineAt ? this.dateText(this.order.carrierConfirmDeadlineAt) : "";
      if (deadline)
        return `请在 ${deadline} 前确认，接单将扣除信息服务费。`;
      return "接单将扣除信息服务费，请确保余额充足。";
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
    action(key, label, className, handler, danger = false) {
      return { key, label, className, handler, danger };
    },
    runFooterAction(action) {
      this.showMoreActions = false;
      if (action && typeof action.handler === "function") {
        action.handler();
      }
    },
    contactText(name, phone) {
      const safeName = name || "未填写";
      const safePhone = phone || "未填写";
      return `${safeName} ${safePhone}`;
    },
    formatOrderAddress(type) {
      const prefix = type === "origin" ? "origin" : "destination";
      const parts = [
        this.order[`${prefix}ProvinceName`],
        this.order[`${prefix}CityName`],
        this.order[`${prefix}DistrictName`],
        this.order[`${prefix}AddressDetail`]
      ].filter(Boolean);
      return parts.length ? parts.join("") : "未填写详细位置";
    },
    hasPickupDriver() {
      return Boolean(
        this.order.driverInfo && this.order.driverInfo.driverName && this.order.driverInfo.driverPhone
      );
    },
    promptSetPickupDriver() {
      common_vendor.index.showModal({
        title: "请先设置提车司机",
        content: "确认提车前必须先设置提车司机。您可以立即设置，也可以稍后再操作。",
        confirmText: "去设置",
        cancelText: "稍后",
        confirmColor: "#1677ff",
        success: (res) => {
          if (res.confirm) {
            this.setDriver("PICKUP");
          }
        }
      });
    },
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
        await this.loadCompensation();
      } catch (err) {
        console.error(err);
      }
    },
    async loadCompensation() {
      try {
        const data = await common_vendor.api.compensationClaims(this.orderId);
        this.compensationClaim = (data.items || [])[0] || null;
      } catch (err) {
        this.compensationClaim = null;
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
              if ((err == null ? void 0 : err.code) === "ORDER_CONFIRM_EXPIRED") {
                common_vendor.index.showModal({
                  title: "确认已超时",
                  content: "订单确认已超时，无法再确认。可联系车商重新下单或取消当前订单。",
                  showCancel: false,
                  confirmColor: "#1677ff",
                  confirmText: "我知道了",
                  success: () => {
                    this.load();
                  }
                });
                return;
              }
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
    setDriver(driverType = "PICKUP") {
      common_vendor.index.navigateTo({
        url: `/pages/order/driver-form?orderId=${this.orderId}&driverType=${driverType}`
      });
    },
    goPickup() {
      if (!this.hasPickupDriver()) {
        this.promptSetPickupDriver();
        return;
      }
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
    goCompensationHandle() {
      var _a;
      if (!((_a = this.compensationClaim) == null ? void 0 : _a.id))
        return;
      common_vendor.index.navigateTo({
        url: `/pages/order/compensation-handle?claimId=${this.compensationClaim.id}`
      });
    },
    compensationStatusText(status) {
      const map = {
        PENDING_CARRIER: "待处理",
        CARRIER_APPROVED: "已同意",
        CARRIER_REJECTED: "已拒绝",
        PLATFORM_PENDING: "平台介入中",
        PLATFORM_APPROVED: "平台已通过",
        PLATFORM_REJECTED: "平台已驳回",
        CANCELED: "已撤销"
      };
      return map[status] || status || "-";
    },
    goCancelLogs() {
      this.viewNegotiationHistory();
    },
    async viewNegotiationHistory() {
      try {
        const data = await common_vendor.api.negotiationHistory(this.orderId);
        const logs = data.items || [];
        if (!logs.length) {
          common_vendor.index.showModal({
            title: "协商历史",
            content: "该订单暂无协商记录",
            showCancel: false,
            confirmColor: "#1677ff"
          });
          return;
        }
        let txt = "";
        logs.forEach((item, index) => {
          txt += `[${index + 1}] ${item.historyType === "COMPENSATION" ? "赔付" : "取消"} - ${this.translateNegotiationAction(item)}
`;
          txt += `操作方: ${item.actorType === "CARRIER" ? "我方承运商" : item.actorType === "DEALER" ? "车商客户" : "平台"}
`;
          if (item.claimNo)
            txt += `赔付申请: ${item.claimNo}
`;
          if (item.reason || item.remark)
            txt += `说明: ${item.reason || item.remark}
`;
          if (item.amountCent !== null && item.amountCent !== void 0) {
            txt += `金额: ${this.yuanText(item.amountCent)}
`;
          }
          txt += `时间: ${this.dateText(item.createdAt)}

`;
        });
        common_vendor.index.showModal({
          title: "协商历史",
          content: txt,
          showCancel: false,
          confirmColor: "#1677ff"
        });
      } catch (err) {
      }
    },
    translateNegotiationAction(item) {
      const status = item.actionType;
      if (item.historyType === "COMPENSATION" && status === "REQUEST") {
        return "发起赔付申请";
      }
      const map = {
        REQUEST: "发起申请",
        APPROVED: "同意取消",
        REJECTED: "拒绝取消",
        WITHDRAW: "撤回取消",
        WITHDRAWN: "已撤回",
        CLOSED: "关闭申请",
        CARRIER_APPROVE: "同意赔付",
        CARRIER_REJECT: "拒绝赔付",
        REQUEST_PLATFORM: "申请平台介入",
        PLATFORM_APPROVE: "平台通过赔付",
        PLATFORM_REJECT: "平台驳回赔付",
        MARK_OFFLINE_PAID: "平台标记线下打款"
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
        UPDATE_ORDER: "车商修改订单",
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
    b: $options.statusIconPath,
    c: common_vendor.t($data.orderStatusText[$data.order.orderStatus] || "-"),
    d: common_vendor.t($data.order.orderNo),
    e: $data.order.orderStatus === "PENDING_RECEIPT"
  }, $data.order.orderStatus === "PENDING_RECEIPT" ? {
    f: common_vendor.t($options.pendingReceiptTip)
  } : $data.order.orderStatus === "PENDING_CONFIRM" ? {
    h: common_vendor.t($options.pendingConfirmTip)
  } : {}, {
    g: $data.order.orderStatus === "PENDING_CONFIRM",
    i: common_vendor.n($options.heroStatusClass),
    j: common_assets._imports_0$2,
    k: common_vendor.t($data.order.dealerName || "车商客户"),
    l: common_vendor.o((...args) => $options.contactDealerDirect && $options.contactDealerDirect(...args), "bb"),
    m: common_vendor.t($data.order.originCityName),
    n: common_vendor.t($data.order.originProvinceName),
    o: common_assets._imports_1$1,
    p: common_vendor.t($data.transportModeText[$data.order.transportMode]),
    q: common_vendor.t($data.order.destinationCityName),
    r: common_vendor.t($data.order.destinationProvinceName),
    s: common_vendor.t($options.yuanText($data.order.orderAmountCent)),
    t: common_vendor.t($options.dateText($data.order.agreedDeliveryTime)),
    v: common_vendor.t($data.order.hasInvoice ? "需要发票（线下交付）" : "不需要发票"),
    w: common_vendor.t($data.order.hasPickupService ? "需要提车" : "不需要提车"),
    x: common_vendor.n($data.order.hasPickupService ? "status-success" : "status-warning"),
    y: common_vendor.t($options.formatOrderAddress("origin")),
    z: common_vendor.t($data.order.hasDeliveryService ? "需要送车" : "不需要送车"),
    A: common_vendor.n($data.order.hasDeliveryService ? "status-success" : "status-warning"),
    B: common_vendor.t($options.formatOrderAddress("destination")),
    C: common_vendor.t($options.contactText($data.order.senderName, $data.order.senderPhone)),
    D: common_vendor.t($options.contactText($data.order.receiverName, $data.order.receiverPhone)),
    E: common_vendor.t($data.vehicles.length),
    F: common_vendor.f($data.vehicles, (vehicle, k0, i0) => {
      return {
        a: common_vendor.t(vehicle.brandName),
        b: common_vendor.t(vehicle.seriesName || ""),
        c: common_vendor.t(vehicle.modelName || ""),
        d: common_vendor.t(vehicle.vin || "未录入"),
        e: common_vendor.t(vehicle.vehicleConditionType === "NEW" ? "新车" : "二手车"),
        f: vehicle.id
      };
    }),
    G: common_assets._imports_2,
    H: $data.order.driverInfo || $data.order.deliveryDriverInfo
  }, $data.order.driverInfo || $data.order.deliveryDriverInfo ? common_vendor.e({
    I: $data.order.driverInfo
  }, $data.order.driverInfo ? {
    J: common_vendor.t($data.order.driverInfo.driverName),
    K: common_vendor.t($data.order.driverInfo.driverPhone),
    L: common_vendor.t($data.order.driverInfo.licensePlate),
    M: common_vendor.t($data.order.driverInfo.idNumber || "-")
  } : {}, {
    N: $data.order.deliveryDriverInfo
  }, $data.order.deliveryDriverInfo ? {
    O: common_vendor.t($data.order.deliveryDriverInfo.driverName),
    P: common_vendor.t($data.order.deliveryDriverInfo.driverPhone),
    Q: common_vendor.t($data.order.deliveryDriverInfo.licensePlate),
    R: common_vendor.t($data.order.deliveryDriverInfo.idNumber || "-")
  } : {}) : {}, {
    S: $data.order.pickupDetails
  }, $data.order.pickupDetails ? common_vendor.e({
    T: common_vendor.t($options.dateText($data.order.pickupDetails.pickupTime)),
    U: common_vendor.t($data.order.pickupDetails.remark || "-"),
    V: $data.pickupUrls.length
  }, $data.pickupUrls.length ? {
    W: common_vendor.f($data.pickupUrls, (url, index, i0) => {
      return {
        a: url,
        b: common_vendor.o(($event) => $options.previewImg(url), index),
        c: index
      };
    })
  } : {}) : {}, {
    X: $data.order.handoverDetails
  }, $data.order.handoverDetails ? common_vendor.e({
    Y: common_vendor.t($options.dateText($data.order.handoverDetails.handoverTime)),
    Z: common_vendor.t($data.order.handoverDetails.remark || "-"),
    aa: $data.handoverUrls.length
  }, $data.handoverUrls.length ? {
    ab: common_vendor.f($data.handoverUrls, (url, index, i0) => {
      return {
        a: url,
        b: common_vendor.o(($event) => $options.previewImg(url), index),
        c: index
      };
    })
  } : {}) : {}, {
    ac: $data.order.transitLocations && $data.order.transitLocations.length
  }, $data.order.transitLocations && $data.order.transitLocations.length ? {
    ad: common_vendor.f($data.order.transitLocations, (loc, idx, i0) => {
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
    ae: $data.compensationClaim
  }, $data.compensationClaim ? common_vendor.e({
    af: common_vendor.t($data.compensationClaim.claimNo),
    ag: common_vendor.t($options.compensationStatusText($data.compensationClaim.claimStatus)),
    ah: common_vendor.t($options.yuanText($data.compensationClaim.requestedCompensationCent)),
    ai: $data.compensationClaim.claimStatus === "PENDING_CARRIER"
  }, $data.compensationClaim.claimStatus === "PENDING_CARRIER" ? {
    aj: common_vendor.o((...args) => $options.goCompensationHandle && $options.goCompensationHandle(...args), "58")
  } : {}) : {}, {
    ak: common_vendor.f($data.logs, (log, idx, i0) => {
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
    al: $data.order.orderStatus === "PENDING_CONFIRM"
  }, $data.order.orderStatus === "PENDING_CONFIRM" ? {
    am: common_vendor.t($options.confirmFooterTip)
  } : {}, {
    an: $options.footerSecondaryAction
  }, $options.footerSecondaryAction ? {
    ao: common_vendor.t($options.footerSecondaryAction.label),
    ap: common_vendor.n($options.footerSecondaryAction.className),
    aq: common_vendor.o(($event) => $options.runFooterAction($options.footerSecondaryAction), "6f")
  } : {}, {
    ar: $options.footerPrimaryAction
  }, $options.footerPrimaryAction ? {
    as: common_vendor.t($options.footerPrimaryAction.label),
    at: common_vendor.n($options.footerPrimaryAction.className),
    av: common_vendor.o(($event) => $options.runFooterAction($options.footerPrimaryAction), "a4")
  } : {}, {
    aw: common_assets._imports_3$1,
    ax: common_vendor.o(($event) => $data.showMoreActions = true, "aa"),
    ay: $data.showMoreActions ? 1 : "",
    az: common_vendor.o(($event) => $data.showMoreActions = false, "ff"),
    aA: common_vendor.o(($event) => $data.showMoreActions = false, "7a"),
    aB: common_vendor.f($options.moreFooterActions, (action, k0, i0) => {
      return {
        a: common_vendor.t(action.label),
        b: action.key,
        c: action.danger ? 1 : "",
        d: common_vendor.o(($event) => $options.runFooterAction(action), action.key)
      };
    }),
    aC: common_assets._imports_1,
    aD: $data.showMoreActions ? 1 : ""
  }) : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
