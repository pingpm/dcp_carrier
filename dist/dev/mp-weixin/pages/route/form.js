"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const RegionSelectField = () => "../../components/region-select-field/region-select-field.js";
const _sfc_main = {
  components: {
    RegionSelectField
  },
  data() {
    return {
      routeId: "",
      routeType: "LARGE_TRUCK",
      fixedPriceYuan: "",
      startPriceYuan: "",
      form: {
        routeType: "LARGE_TRUCK",
        originProvinceId: "",
        originProvinceName: "",
        originCityId: "",
        originCityName: "",
        destinationProvinceId: "",
        destinationProvinceName: "",
        destinationCityId: "",
        destinationCityName: "",
        fixedPriceCent: null,
        startPriceCent: null,
        startKm: null,
        tierTemplateId: "",
        durationText: "",
        status: "ACTIVE"
      },
      // Templates array
      templates: [],
      selectedTemplateName: "",
      verification: { serviceCapabilities: [] },
      submitting: false
    };
  },
  onLoad(options) {
    if (!common_vendor.requireLogin())
      return;
    this.routeType = options.type || "LARGE_TRUCK";
    this.form.routeType = this.routeType;
    if (options.routeId) {
      this.routeId = options.routeId;
      this.loadDetail();
    }
  },
  onShow() {
    this.loadVerificationStatus();
    if (this.routeType === "SMALL_TRUCK") {
      this.loadTemplates();
    }
  },
  methods: {
    async loadVerificationStatus() {
      try {
        this.verification = await common_vendor.api.verificationStatus();
        const caps = this.verification.serviceCapabilities || [];
        if (caps.length && !caps.includes(this.routeType)) {
          common_vendor.index.showModal({
            title: "线路类型不可用",
            content: "当前公司类型不支持该线路类型。轿运公司支持大板和小板线路，道路救援公司仅支持小板线路。",
            showCancel: false,
            confirmText: "返回",
            success: () => {
              common_vendor.index.navigateBack();
            }
          });
        }
      } catch (err) {
      }
    },
    async loadDetail() {
      try {
        const listRes = await common_vendor.api.routes();
        const route = (listRes.items || []).find((r) => String(r.id) === String(this.routeId));
        if (route) {
          this.form = {
            routeType: route.routeType,
            originProvinceId: route.originProvinceId,
            originProvinceName: route.originProvinceName,
            originCityId: route.originCityId,
            originCityName: route.originCityName,
            destinationProvinceId: route.destinationProvinceId,
            destinationProvinceName: route.destinationProvinceName,
            destinationCityId: route.destinationCityId,
            destinationCityName: route.destinationCityName,
            fixedPriceCent: route.fixedPriceCent,
            startPriceCent: route.startPriceCent,
            startKm: route.startKm,
            tierTemplateId: route.tierTemplateId || "",
            durationText: route.durationText || "",
            status: route.routeStatus || "ACTIVE"
          };
          if (route.fixedPriceCent) {
            this.fixedPriceYuan = (route.fixedPriceCent / 100).toFixed(2);
          }
          if (route.startPriceCent) {
            this.startPriceYuan = (route.startPriceCent / 100).toFixed(2);
          }
          this.matchTemplateName();
        }
      } catch (err) {
        console.error(err);
      }
    },
    async loadTemplates() {
      try {
        const res = await common_vendor.api.tierTemplates();
        this.templates = res.items || [];
        this.matchTemplateName();
      } catch (err) {
      }
    },
    matchTemplateName() {
      if (this.form.tierTemplateId && this.templates.length) {
        const t = this.templates.find((x) => String(x.id) === String(this.form.tierTemplateId));
        if (t) {
          this.selectedTemplateName = t.templateName;
        }
      }
    },
    onOriginRegionSelect(region) {
      this.form.originProvinceId = region.provinceId;
      this.form.originProvinceName = region.provinceName;
      this.form.originCityId = region.cityId;
      this.form.originCityName = region.cityName;
    },
    onDestinationRegionSelect(region) {
      this.form.destinationProvinceId = region.provinceId;
      this.form.destinationProvinceName = region.provinceName;
      this.form.destinationCityId = region.cityId;
      this.form.destinationCityName = region.cityName;
    },
    onTemplateChange(e) {
      const idx = e.detail.value;
      const t = this.templates[idx];
      this.form.tierTemplateId = t.id;
      this.selectedTemplateName = t.templateName;
    },
    setStatus(status) {
      this.form.status = status;
    },
    goTemplatePage() {
      common_vendor.index.navigateTo({ url: "/pages/route/tier-template" });
    },
    validate() {
      const caps = this.verification.serviceCapabilities || [];
      if (caps.length && !caps.includes(this.routeType)) {
        common_vendor.index.showToast({ title: "当前公司类型不支持该线路类型", icon: "none" });
        return false;
      }
      if (!this.form.originCityId) {
        common_vendor.index.showToast({ title: "请选择出发城市", icon: "none" });
        return false;
      }
      if (!this.form.destinationCityId) {
        common_vendor.index.showToast({ title: "请选择目的城市", icon: "none" });
        return false;
      }
      if (this.routeType === "LARGE_TRUCK") {
        this.form.fixedPriceCent = this.fixedPriceYuan ? common_vendor.yuanToCent(this.fixedPriceYuan) : null;
      } else {
        this.form.startPriceCent = this.startPriceYuan ? common_vendor.yuanToCent(this.startPriceYuan) : null;
        this.form.startKm = this.form.startKm ? Number(this.form.startKm) : null;
      }
      return true;
    },
    async submit() {
      if (!this.validate())
        return;
      this.submitting = true;
      try {
        const payload = {
          ...this.form,
          routeStatus: this.form.status,
          tierTemplateId: this.form.tierTemplateId || null
        };
        delete payload.status;
        if (this.routeType === "SMALL_TRUCK" && this.form.tierTemplateId) {
          const t = this.templates.find((x) => String(x.id) === String(this.form.tierTemplateId));
          if (t) {
            payload.tierSnapshot = t.items || [];
          }
        }
        if (this.routeId) {
          await common_vendor.api.updateRoute(this.routeId, payload);
          common_vendor.index.showToast({ title: "修改线路成功", icon: "success" });
        } else {
          await common_vendor.api.createRoute(payload);
          common_vendor.index.showToast({ title: "添加线路成功", icon: "success" });
        }
        setTimeout(() => {
          common_vendor.index.navigateBack();
        }, 800);
      } catch (err) {
        console.error(err);
      } finally {
        this.submitting = false;
      }
    }
  }
};
if (!Array) {
  const _easycom_region_select_field2 = common_vendor.resolveComponent("region-select-field");
  _easycom_region_select_field2();
}
const _easycom_region_select_field = () => "../../components/region-select-field/region-select-field.js";
if (!Math) {
  _easycom_region_select_field();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.t($data.routeId ? "修改线路报价" : "添加承运线路"),
    b: common_vendor.t($data.routeType === "LARGE_TRUCK" ? "大板线路" : "小板线路"),
    c: common_vendor.o($options.onOriginRegionSelect, "19"),
    d: common_vendor.p({
      label: "出发城市",
      required: true,
      title: "选择出发省市",
      placeholder: "选择出发省份与城市",
      ["province-name"]: $data.form.originProvinceName,
      ["city-name"]: $data.form.originCityName
    }),
    e: common_vendor.o($options.onDestinationRegionSelect, "b2"),
    f: common_vendor.p({
      label: "目的城市",
      required: true,
      title: "选择目的省市",
      placeholder: "选择目的省份与城市",
      ["province-name"]: $data.form.destinationProvinceName,
      ["city-name"]: $data.form.destinationCityName
    }),
    g: $data.form.durationText,
    h: common_vendor.o(($event) => $data.form.durationText = $event.detail.value, "a8"),
    i: $data.routeId
  }, $data.routeId ? {
    j: common_vendor.t($data.form.status === "ACTIVE" ? "●" : ""),
    k: $data.form.status === "ACTIVE" ? 1 : "",
    l: common_vendor.o(($event) => $options.setStatus("ACTIVE"), "64"),
    m: common_vendor.t($data.form.status === "CLOSED" ? "●" : ""),
    n: $data.form.status === "CLOSED" ? 1 : "",
    o: common_vendor.o(($event) => $options.setStatus("CLOSED"), "4b")
  } : {}, {
    p: $data.routeType === "LARGE_TRUCK"
  }, $data.routeType === "LARGE_TRUCK" ? {
    q: $data.fixedPriceYuan,
    r: common_vendor.o(($event) => $data.fixedPriceYuan = $event.detail.value, "3b")
  } : {}, {
    s: $data.routeType === "SMALL_TRUCK"
  }, $data.routeType === "SMALL_TRUCK" ? {
    t: $data.startPriceYuan,
    v: common_vendor.o(($event) => $data.startPriceYuan = $event.detail.value, "83"),
    w: $data.form.startKm,
    x: common_vendor.o(($event) => $data.form.startKm = $event.detail.value, "e3"),
    y: common_vendor.t($data.selectedTemplateName || "点击选择公里阶梯价模板"),
    z: $data.templates,
    A: common_vendor.o((...args) => $options.onTemplateChange && $options.onTemplateChange(...args), "ed"),
    B: common_assets._imports_4$1,
    C: common_assets._imports_1,
    D: common_vendor.o((...args) => $options.goTemplatePage && $options.goTemplatePage(...args), "84")
  } : {}, {
    E: $data.submitting,
    F: common_vendor.o((...args) => $options.submit && $options.submit(...args), "17")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
