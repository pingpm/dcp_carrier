"use strict";
const common_vendor = require("../../common/vendor.js");
const RegionPicker = () => "../../components/region-picker/region-picker.js";
const _sfc_main = {
  components: {
    RegionPicker
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
      // Region picker state
      pickerType: "origin",
      // origin | destination
      pickerTitle: "选择出发省市",
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
        const res = await common_vendor.api.routes({ id: this.routeId });
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
            status: route.status || "ACTIVE"
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
    openRegionPicker(type) {
      this.pickerType = type;
      this.pickerTitle = type === "origin" ? "选择出发省市" : "选择目的省市";
      this.$refs.regionPicker.open();
    },
    onRegionSelect(region) {
      if (this.pickerType === "origin") {
        this.form.originProvinceId = region.provinceId;
        this.form.originProvinceName = region.provinceName;
        this.form.originCityId = region.cityId;
        this.form.originCityName = region.cityName;
      } else {
        this.form.destinationProvinceId = region.provinceId;
        this.form.destinationProvinceName = region.provinceName;
        this.form.destinationCityId = region.cityId;
        this.form.destinationCityName = region.cityName;
      }
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
      if (!this.form.durationText.trim()) {
        common_vendor.index.showToast({ title: "请输入预计运输时效", icon: "none" });
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
        const payload = { ...this.form };
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
  const _easycom_region_picker2 = common_vendor.resolveComponent("region-picker");
  _easycom_region_picker2();
}
const _easycom_region_picker = () => "../../components/region-picker/region-picker.js";
if (!Math) {
  _easycom_region_picker();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.t($data.routeId ? "修改线路报价" : "添加承运线路"),
    b: common_vendor.t($data.routeType === "LARGE_TRUCK" ? "大板轿运线路" : "小板单车线路"),
    c: $data.form.originProvinceName
  }, $data.form.originProvinceName ? {
    d: common_vendor.t($data.form.originProvinceName),
    e: common_vendor.t($data.form.originCityName)
  } : {}, {
    f: common_vendor.o(($event) => $options.openRegionPicker("origin"), "68"),
    g: $data.form.destinationProvinceName
  }, $data.form.destinationProvinceName ? {
    h: common_vendor.t($data.form.destinationProvinceName),
    i: common_vendor.t($data.form.destinationCityName)
  } : {}, {
    j: common_vendor.o(($event) => $options.openRegionPicker("destination"), "2e"),
    k: $data.form.durationText,
    l: common_vendor.o(($event) => $data.form.durationText = $event.detail.value, "6b"),
    m: $data.routeId
  }, $data.routeId ? {
    n: common_vendor.t($data.form.status === "ACTIVE" ? "●" : ""),
    o: $data.form.status === "ACTIVE" ? 1 : "",
    p: common_vendor.o(($event) => $options.setStatus("ACTIVE"), "78"),
    q: common_vendor.t($data.form.status === "CLOSED" ? "●" : ""),
    r: $data.form.status === "CLOSED" ? 1 : "",
    s: common_vendor.o(($event) => $options.setStatus("CLOSED"), "f6")
  } : {}, {
    t: $data.routeType === "LARGE_TRUCK"
  }, $data.routeType === "LARGE_TRUCK" ? {
    v: $data.fixedPriceYuan,
    w: common_vendor.o(($event) => $data.fixedPriceYuan = $event.detail.value, "f2")
  } : {}, {
    x: $data.routeType === "SMALL_TRUCK"
  }, $data.routeType === "SMALL_TRUCK" ? {
    y: $data.startPriceYuan,
    z: common_vendor.o(($event) => $data.startPriceYuan = $event.detail.value, "0d"),
    A: $data.form.startKm,
    B: common_vendor.o(($event) => $data.form.startKm = $event.detail.value, "e5"),
    C: common_vendor.t($data.selectedTemplateName || "点击选择公里阶梯价模板"),
    D: $data.templates,
    E: common_vendor.o((...args) => $options.onTemplateChange && $options.onTemplateChange(...args), "aa"),
    F: common_vendor.o((...args) => $options.goTemplatePage && $options.goTemplatePage(...args), "3c")
  } : {}, {
    G: common_vendor.sr("regionPicker", "3f7861a2-0"),
    H: common_vendor.o($options.onRegionSelect, "85"),
    I: common_vendor.p({
      title: $data.pickerTitle
    }),
    J: $data.submitting,
    K: common_vendor.o((...args) => $options.submit && $options.submit(...args), "4b")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
