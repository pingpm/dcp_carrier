"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      activeType: "LARGE_TRUCK",
      // LARGE_TRUCK, SMALL_TRUCK
      routes: [],
      verification: { reviewStatus: "UNVERIFIED" }
    };
  },
  onShow() {
    if (common_vendor.requireLogin()) {
      this.loadStatus();
    }
  },
  methods: {
    yuanText: common_vendor.yuanText,
    canManageRouteType(type) {
      return this.availableRouteTypes.includes(type);
    },
    async loadStatus() {
      try {
        this.verification = await common_vendor.api.verificationStatus();
        if (!this.canManageRouteType(this.activeType)) {
          this.activeType = this.availableRouteTypes[0] || "SMALL_TRUCK";
        }
        await this.load();
      } catch (err) {
      }
    },
    async load() {
      try {
        const res = await common_vendor.api.routes({ routeType: this.activeType });
        this.routes = res.items || [];
      } catch (err) {
        console.error(err);
      }
    },
    switchType(type) {
      if (!this.canManageRouteType(type))
        return;
      this.activeType = type;
      this.load();
    },
    goStatus() {
      common_vendor.index.navigateTo({ url: "/pages/verification/status" });
    },
    goAdd() {
      const caps = this.verification.serviceCapabilities || [];
      if (!caps.includes(this.activeType)) {
        const nameMap = { LARGE_TRUCK: "大板线路", SMALL_TRUCK: "小板线路" };
        common_vendor.index.showModal({
          title: "线路类型不可用",
          content: `当前公司类型不支持添加【${nameMap[this.activeType]}】。轿运公司支持大板和小板线路，道路救援公司仅支持小板线路。`,
          confirmText: "去认证页",
          confirmColor: "#1677ff",
          success: (res) => {
            if (res.confirm) {
              common_vendor.index.navigateTo({ url: "/pages/verification/status" });
            }
          }
        });
        return;
      }
      common_vendor.index.navigateTo({ url: `/pages/route/form?type=${this.activeType}` });
    },
    goEdit(route) {
      common_vendor.index.navigateTo({ url: `/pages/route/form?routeId=${route.id}&type=${route.routeType}` });
    },
    closeRoute(route) {
      common_vendor.index.showModal({
        title: "关闭展示确认",
        content: "确定关闭该承运线路吗？关闭后，车商客户搜索该线路时将无法看到您的报价，您可以重新在编辑页中开启展示。",
        confirmColor: "#dc2626",
        success: async (res) => {
          if (res.confirm) {
            try {
              await common_vendor.api.closeRoute(route.id);
              common_vendor.index.showToast({ title: "线路已关闭展示", icon: "success" });
              this.load();
            } catch (err) {
            }
          }
        }
      });
    }
  },
  computed: {
    availableRouteTypes() {
      const caps = this.verification.serviceCapabilities || [];
      if (caps.includes("LARGE_TRUCK"))
        return ["LARGE_TRUCK", "SMALL_TRUCK"];
      if (caps.includes("SMALL_TRUCK"))
        return ["SMALL_TRUCK"];
      return ["LARGE_TRUCK", "SMALL_TRUCK"];
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.verification.reviewStatus !== "APPROVED"
  }, $data.verification.reviewStatus !== "APPROVED" ? {
    b: common_vendor.o((...args) => $options.goStatus && $options.goStatus(...args), "28")
  } : {}, {
    c: $options.availableRouteTypes.length > 1
  }, $options.availableRouteTypes.length > 1 ? common_vendor.e({
    d: $options.canManageRouteType("LARGE_TRUCK")
  }, $options.canManageRouteType("LARGE_TRUCK") ? {
    e: $data.activeType === "LARGE_TRUCK" ? 1 : "",
    f: common_vendor.o(($event) => $options.switchType("LARGE_TRUCK"), "6c")
  } : {}, {
    g: $options.canManageRouteType("SMALL_TRUCK")
  }, $options.canManageRouteType("SMALL_TRUCK") ? {
    h: $data.activeType === "SMALL_TRUCK" ? 1 : "",
    i: common_vendor.o(($event) => $options.switchType("SMALL_TRUCK"), "df")
  } : {}) : {}, {
    j: $data.routes.length === 0
  }, $data.routes.length === 0 ? {
    k: common_vendor.o((...args) => $options.goAdd && $options.goAdd(...args), "4f")
  } : {
    l: common_vendor.f($data.routes, (route, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t(route.routeType === "LARGE_TRUCK" ? "大板" : "小板"),
        b: common_vendor.t(route.source === "ADMIN_ASSIGNED" ? "平台分配" : "自主录入"),
        c: common_vendor.n(route.source === "ADMIN_ASSIGNED" ? "admin" : "self"),
        d: common_vendor.t(route.status === "ACTIVE" ? "展示中" : "已关闭"),
        e: common_vendor.n(route.status === "ACTIVE" ? "status-success" : "status-danger"),
        f: common_vendor.t(route.originCityName),
        g: common_vendor.t(route.destinationCityName),
        h: common_vendor.t(route.durationText || "电话沟通")
      }, $data.activeType === "LARGE_TRUCK" ? {
        i: common_vendor.t(route.fixedPriceCent ? $options.yuanText(route.fixedPriceCent) : "电话联系")
      } : {
        j: common_vendor.t(route.startPriceCent ? $options.yuanText(route.startPriceCent) : "电话联系")
      }, {
        k: route.status === "ACTIVE"
      }, route.status === "ACTIVE" ? {
        l: common_vendor.o(($event) => $options.closeRoute(route), route.id)
      } : {}, {
        m: common_vendor.o(($event) => $options.goEdit(route), route.id),
        n: route.id,
        o: route.status === "CLOSED" ? 1 : ""
      });
    }),
    m: $data.activeType === "LARGE_TRUCK"
  }, {
    n: common_vendor.o((...args) => $options.goAdd && $options.goAdd(...args), "a8")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
