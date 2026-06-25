"use strict";
const common_vendor = require("../../common/vendor.js");
const AddressMapPicker = () => "../../components/address-map-picker/address-map-picker.js";
const RegionSelectField = () => "../../components/region-select-field/region-select-field.js";
const _sfc_main = {
  components: {
    AddressMapPicker,
    RegionSelectField
  },
  data() {
    return {
      orderId: "",
      provinceId: "",
      provinceName: "",
      cityId: "",
      cityName: "",
      addressName: "",
      addressDetail: "",
      latitude: "",
      longitude: "",
      remark: "",
      submitting: false
    };
  },
  onLoad(options) {
    if (!common_vendor.requireLogin())
      return;
    this.orderId = options.orderId;
  },
  methods: {
    onRegionSelect(region) {
      const cityChanged = String(this.cityId) !== String(region.cityId);
      this.provinceId = region.provinceId;
      this.provinceName = region.provinceName;
      this.cityId = region.cityId;
      this.cityName = region.cityName;
      if (cityChanged) {
        this.addressName = "";
        this.addressDetail = "";
        this.latitude = "";
        this.longitude = "";
      }
    },
    openAddressPicker() {
      if (!this.cityId) {
        common_vendor.index.showToast({ title: "请先选择当前运输省市", icon: "none" });
        return;
      }
      this.$refs.addressMapPicker.open({
        name: this.addressName || "",
        address: this.addressDetail || "",
        provinceName: this.provinceName || "",
        cityName: this.cityName || "",
        lng: this.longitude || "",
        lat: this.latitude || ""
      });
    },
    onAddressSelect(address) {
      this.addressName = address.name || "";
      this.addressDetail = address.address || address.name || "";
      this.longitude = address.lng || "";
      this.latitude = address.lat || "";
    },
    useDevTransitLocation() {
      this.provinceId = "310000";
      this.provinceName = "上海市";
      this.cityId = "310100";
      this.cityName = "上海市";
      this.addressName = "G2高速上海方向服务区";
      this.addressDetail = "G2高速上海方向服务区，距离目的地约35公里";
      this.latitude = "31.246707";
      this.longitude = "121.433300";
      this.remark = "页面测试在途上报，预计今日到达";
    },
    validate() {
      if (!this.provinceName || !this.cityName) {
        common_vendor.index.showToast({ title: "请选择当前运输省市", icon: "none" });
        return false;
      }
      if (!this.addressDetail.trim()) {
        common_vendor.index.showToast({ title: "请选择详细在途位置", icon: "none" });
        return false;
      }
      if (!this.latitude || !this.longitude) {
        common_vendor.index.showToast({ title: "请在地图上确认在途位置", icon: "none" });
        return false;
      }
      return true;
    },
    async submit() {
      if (!this.validate())
        return;
      this.submitting = true;
      try {
        const payload = {
          provinceId: this.provinceId,
          provinceName: this.provinceName,
          cityId: this.cityId,
          cityName: this.cityName,
          addressDetail: this.addressDetail,
          latitude: Number(this.latitude),
          longitude: Number(this.longitude),
          remark: this.remark
        };
        await common_vendor.api.reportTransitLocation(this.orderId, payload);
        common_vendor.index.showToast({ title: "位置上报成功", icon: "success" });
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
if (!Array) {
  const _easycom_region_select_field2 = common_vendor.resolveComponent("region-select-field");
  const _easycom_address_map_picker2 = common_vendor.resolveComponent("address-map-picker");
  (_easycom_region_select_field2 + _easycom_address_map_picker2)();
}
const _easycom_region_select_field = () => "../../components/region-select-field/region-select-field.js";
const _easycom_address_map_picker = () => "../../components/address-map-picker/address-map-picker.js";
if (!Math) {
  (_easycom_region_select_field + _easycom_address_map_picker)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.o($options.onRegionSelect, "81"),
    b: common_vendor.p({
      label: "当前省市",
      required: true,
      title: "选择当前省市",
      placeholder: "选择当前运输省份与城市",
      ["province-name"]: $data.provinceName,
      ["city-name"]: $data.cityName
    }),
    c: $data.addressDetail
  }, $data.addressDetail ? common_vendor.e({
    d: common_vendor.t($data.addressName || $data.addressDetail),
    e: $data.addressDetail
  }, $data.addressDetail ? {
    f: common_vendor.t($data.addressDetail)
  } : {}) : {}, {
    g: !$data.cityId ? 1 : "",
    h: common_vendor.o((...args) => $options.openAddressPicker && $options.openAddressPicker(...args), "ea"),
    i: $data.remark,
    j: common_vendor.o(($event) => $data.remark = $event.detail.value, "63"),
    k: common_vendor.sr("addressMapPicker", "279348e8-1"),
    l: common_vendor.o($options.onAddressSelect, "e0"),
    m: common_vendor.p({
      title: "选择详细在途位置",
      placeholder: "搜索高速路段、服务区、分拨点"
    }),
    n: $data.submitting,
    o: common_vendor.o((...args) => $options.submit && $options.submit(...args), "12")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
