"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const RegionPicker = () => "../../components/region-picker/region-picker.js";
function createDefaultFilters() {
  return {
    originNationwide: true,
    originProvinceId: "",
    originProvinceName: "",
    originCityId: "",
    originCityName: "",
    destinationNationwide: true,
    destinationProvinceId: "",
    destinationProvinceName: "",
    destinationCityId: "",
    destinationCityName: "",
    routeStatus: "ALL",
    source: "ALL"
  };
}
const _sfc_main = {
  components: {
    RegionPicker
  },
  data() {
    return {
      activeType: "LARGE_TRUCK",
      routes: [],
      verification: { reviewStatus: "UNVERIFIED" },
      filters: createDefaultFilters(),
      draftFilters: createDefaultFilters(),
      filterPanelVisible: false,
      statusOptions: [
        { label: "全部", value: "ALL" },
        { label: "展示中", value: "ACTIVE" },
        { label: "已关闭", value: "CLOSED" }
      ],
      sourceOptions: [
        { label: "全部", value: "ALL" },
        { label: "自主录入", value: "CARRIER_CREATED" },
        { label: "平台分配", value: "ADMIN_ASSIGNED" }
      ]
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
        this.verification = await common_vendor.api.verificationStatus({ silent: true, authRedirect: false });
        if (!this.canManageRouteType(this.activeType)) {
          this.activeType = this.availableRouteTypes[0] || "SMALL_TRUCK";
        }
        await this.load();
      } catch (err) {
        this.verification = { reviewStatus: "UNVERIFIED" };
        this.routes = [];
      }
    },
    async load() {
      try {
        const res = await common_vendor.api.routes(
          { routeType: this.activeType },
          { silent: true, authRedirect: false }
        );
        this.routes = res.items || [];
      } catch (err) {
        this.routes = [];
      }
    },
    switchType(type) {
      if (!this.canManageRouteType(type))
        return;
      this.activeType = type;
      this.resetFilters();
      this.load();
    },
    openFilterPanel() {
      this.draftFilters = { ...this.filters };
      this.filterPanelVisible = true;
    },
    closeFilterPanel() {
      this.filterPanelVisible = false;
    },
    openOriginPicker() {
      this.$refs.originPicker.open();
    },
    openDestinationPicker() {
      this.$refs.destinationPicker.open();
    },
    selectOrigin(region) {
      this.draftFilters = {
        ...this.draftFilters,
        originNationwide: false,
        originProvinceId: region.provinceId,
        originProvinceName: region.provinceName,
        originCityId: region.cityId,
        originCityName: region.cityName
      };
    },
    selectDestination(region) {
      this.draftFilters = {
        ...this.draftFilters,
        destinationNationwide: false,
        destinationProvinceId: region.provinceId,
        destinationProvinceName: region.provinceName,
        destinationCityId: region.cityId,
        destinationCityName: region.cityName
      };
    },
    setDraftNationwide(type) {
      if (type === "origin") {
        this.draftFilters = {
          ...this.draftFilters,
          originNationwide: true,
          originProvinceId: "",
          originProvinceName: "",
          originCityId: "",
          originCityName: ""
        };
        return;
      }
      this.draftFilters = {
        ...this.draftFilters,
        destinationNationwide: true,
        destinationProvinceId: "",
        destinationProvinceName: "",
        destinationCityId: "",
        destinationCityName: ""
      };
    },
    resetDraftFilters() {
      this.draftFilters = createDefaultFilters();
    },
    applyFilters() {
      this.filters = { ...this.draftFilters };
      this.filterPanelVisible = false;
    },
    resetFilters() {
      this.filters = createDefaultFilters();
      this.draftFilters = createDefaultFilters();
    },
    goStatus() {
      const url = this.verification.reviewStatus === "PENDING" ? "/pages/verification/status" : "/pages/verification/form";
      common_vendor.index.navigateTo({ url });
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
              this.goStatus();
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
    originFilterText() {
      if (this.filters.originNationwide)
        return "全国";
      return this.filters.originCityName ? `${this.filters.originProvinceName} · ${this.filters.originCityName}` : "选择起始地";
    },
    destinationFilterText() {
      if (this.filters.destinationNationwide)
        return "全国";
      return this.filters.destinationCityName ? `${this.filters.destinationProvinceName} · ${this.filters.destinationCityName}` : "选择目的地";
    },
    draftOriginText() {
      if (this.draftFilters.originNationwide)
        return "选择省市";
      return this.draftFilters.originCityName ? `${this.draftFilters.originProvinceName} · ${this.draftFilters.originCityName}` : "选择省市";
    },
    draftDestinationText() {
      if (this.draftFilters.destinationNationwide)
        return "选择省市";
      return this.draftFilters.destinationCityName ? `${this.draftFilters.destinationProvinceName} · ${this.draftFilters.destinationCityName}` : "选择省市";
    },
    hasFilter() {
      return !this.filters.originNationwide || !this.filters.destinationNationwide || this.filters.routeStatus !== "ALL" || this.filters.source !== "ALL";
    },
    filteredRoutes() {
      return this.routes.filter((route) => {
        const originMatched = this.filters.originNationwide || String(route.originCityId || "") === String(this.filters.originCityId);
        const destinationMatched = this.filters.destinationNationwide || String(route.destinationCityId || "") === String(this.filters.destinationCityId);
        const statusMatched = this.filters.routeStatus === "ALL" || route.routeStatus === this.filters.routeStatus;
        const sourceMatched = this.filters.source === "ALL" || route.source === this.filters.source;
        return originMatched && destinationMatched && statusMatched && sourceMatched;
      });
    },
    routeCoverageStats() {
      const originProvinces = /* @__PURE__ */ new Set();
      const destinationProvinces = /* @__PURE__ */ new Set();
      let activeCount = 0;
      this.routes.forEach((route) => {
        if (route.originProvinceName)
          originProvinces.add(route.originProvinceName);
        if (route.destinationProvinceName)
          destinationProvinces.add(route.destinationProvinceName);
        if (route.routeStatus === "ACTIVE")
          activeCount += 1;
      });
      return {
        totalCount: this.routes.length,
        originProvinceCount: originProvinces.size,
        destinationProvinceCount: destinationProvinces.size,
        activeCount
      };
    },
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
if (!Array) {
  const _easycom_region_picker2 = common_vendor.resolveComponent("region-picker");
  _easycom_region_picker2();
}
const _easycom_region_picker = () => "../../components/region-picker/region-picker.js";
if (!Math) {
  _easycom_region_picker();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.verification.reviewStatus !== "APPROVED"
  }, $data.verification.reviewStatus !== "APPROVED" ? {
    b: common_assets._imports_3,
    c: common_assets._imports_1,
    d: common_vendor.o((...args) => $options.goStatus && $options.goStatus(...args), "db")
  } : {}, {
    e: $options.availableRouteTypes.length > 1
  }, $options.availableRouteTypes.length > 1 ? common_vendor.e({
    f: $options.canManageRouteType("LARGE_TRUCK")
  }, $options.canManageRouteType("LARGE_TRUCK") ? {
    g: $data.activeType === "LARGE_TRUCK" ? 1 : "",
    h: common_vendor.o(($event) => $options.switchType("LARGE_TRUCK"), "1c")
  } : {}, {
    i: $options.canManageRouteType("SMALL_TRUCK")
  }, $options.canManageRouteType("SMALL_TRUCK") ? {
    j: $data.activeType === "SMALL_TRUCK" ? 1 : "",
    k: common_vendor.o(($event) => $options.switchType("SMALL_TRUCK"), "7d")
  } : {}) : {}, {
    l: $data.routes.length
  }, $data.routes.length ? common_vendor.e({
    m: common_assets._imports_2$1,
    n: common_vendor.t($options.originFilterText),
    o: common_vendor.t($options.destinationFilterText),
    p: $options.hasFilter
  }, $options.hasFilter ? {
    q: common_vendor.t($options.filteredRoutes.length)
  } : {}, {
    r: common_vendor.o((...args) => $options.openFilterPanel && $options.openFilterPanel(...args), "cd"),
    s: common_assets._imports_4,
    t: common_vendor.t($options.routeCoverageStats.originProvinceCount),
    v: common_vendor.t($options.routeCoverageStats.destinationProvinceCount),
    w: common_vendor.t($options.routeCoverageStats.totalCount)
  }) : {}, {
    x: $data.routes.length === 0
  }, $data.routes.length === 0 ? {
    y: common_assets._imports_4,
    z: common_vendor.o((...args) => $options.goAdd && $options.goAdd(...args), "60")
  } : $options.filteredRoutes.length === 0 ? {
    B: common_assets._imports_4,
    C: common_vendor.o((...args) => $options.resetFilters && $options.resetFilters(...args), "bb")
  } : {
    D: common_vendor.f($options.filteredRoutes, (route, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t(route.routeType === "LARGE_TRUCK" ? "大板" : "小板"),
        b: common_vendor.t(route.source === "ADMIN_ASSIGNED" ? "平台分配" : "自主录入"),
        c: common_vendor.n(route.source === "ADMIN_ASSIGNED" ? "admin" : "self"),
        d: common_vendor.t(route.routeStatus === "ACTIVE" ? "展示中" : "已关闭"),
        e: common_vendor.n(route.routeStatus === "ACTIVE" ? "status-success" : "status-danger"),
        f: common_vendor.t(route.originCityName),
        g: common_vendor.t(route.destinationCityName),
        h: common_vendor.t(route.durationText || "电话沟通")
      }, $data.activeType === "LARGE_TRUCK" ? {
        i: common_vendor.t(route.fixedPriceCent ? $options.yuanText(route.fixedPriceCent) : "电话联系")
      } : {
        j: common_vendor.t(route.startPriceCent ? $options.yuanText(route.startPriceCent) : "电话联系")
      }, {
        k: common_vendor.o(($event) => $options.goEdit(route), route.id),
        l: route.routeStatus === "ACTIVE"
      }, route.routeStatus === "ACTIVE" ? {
        m: common_vendor.o(($event) => $options.closeRoute(route), route.id)
      } : {}, {
        n: route.id,
        o: route.routeStatus === "CLOSED" ? 1 : ""
      });
    }),
    E: $data.activeType === "LARGE_TRUCK"
  }, {
    A: $options.filteredRoutes.length === 0,
    F: common_vendor.o((...args) => $options.goAdd && $options.goAdd(...args), "a1"),
    G: $data.filterPanelVisible
  }, $data.filterPanelVisible ? {
    H: common_vendor.o((...args) => $options.closeFilterPanel && $options.closeFilterPanel(...args), "03")
  } : {}, {
    I: $data.filterPanelVisible
  }, $data.filterPanelVisible ? {
    J: common_vendor.o((...args) => $options.closeFilterPanel && $options.closeFilterPanel(...args), "a8"),
    K: $data.draftFilters.originNationwide ? 1 : "",
    L: common_vendor.o(($event) => $options.setDraftNationwide("origin"), "af"),
    M: common_vendor.t($options.draftOriginText),
    N: $data.draftFilters.originNationwide ? 1 : "",
    O: common_vendor.o((...args) => $options.openOriginPicker && $options.openOriginPicker(...args), "90"),
    P: $data.draftFilters.destinationNationwide ? 1 : "",
    Q: common_vendor.o(($event) => $options.setDraftNationwide("destination"), "15"),
    R: common_vendor.t($options.draftDestinationText),
    S: $data.draftFilters.destinationNationwide ? 1 : "",
    T: common_vendor.o((...args) => $options.openDestinationPicker && $options.openDestinationPicker(...args), "da"),
    U: common_vendor.f($data.statusOptions, (item, k0, i0) => {
      return {
        a: common_vendor.t(item.label),
        b: item.value,
        c: $data.draftFilters.routeStatus === item.value ? 1 : "",
        d: common_vendor.o(($event) => $data.draftFilters.routeStatus = item.value, item.value)
      };
    }),
    V: common_vendor.f($data.sourceOptions, (item, k0, i0) => {
      return {
        a: common_vendor.t(item.label),
        b: item.value,
        c: $data.draftFilters.source === item.value ? 1 : "",
        d: common_vendor.o(($event) => $data.draftFilters.source = item.value, item.value)
      };
    }),
    W: common_vendor.o((...args) => $options.resetDraftFilters && $options.resetDraftFilters(...args), "01"),
    X: common_vendor.o((...args) => $options.applyFilters && $options.applyFilters(...args), "b1")
  } : {}, {
    Y: common_vendor.sr("originPicker", "7371887c-0"),
    Z: common_vendor.o($options.selectOrigin, "2f"),
    aa: common_vendor.p({
      title: "选择起始地"
    }),
    ab: common_vendor.sr("destinationPicker", "7371887c-1"),
    ac: common_vendor.o($options.selectDestination, "25"),
    ad: common_vendor.p({
      title: "选择目的地"
    })
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
