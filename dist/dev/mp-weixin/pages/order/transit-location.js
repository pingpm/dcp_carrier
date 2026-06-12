"use strict";
const common_vendor = require("../../common/vendor.js");
const RegionPicker = () => "../../components/region-picker/region-picker.js";
const _sfc_main = {
  components: {
    RegionPicker
  },
  data() {
    return {
      orderId: "",
      provinceId: "",
      provinceName: "",
      cityId: "",
      cityName: "",
      addressDetail: "",
      latitude: "31.2304",
      // Default to Shanghai coordinates
      longitude: "121.4737",
      remark: "",
      submitting: false
    };
  },
  onLoad(options) {
    if (!common_vendor.requireLogin())
      return;
    this.orderId = options.orderId;
    this.getLocation();
  },
  methods: {
    openRegionPicker() {
      this.$refs.regionPicker.open();
    },
    onRegionSelect(region) {
      this.provinceId = region.provinceId;
      this.provinceName = region.provinceName;
      this.cityId = region.cityId;
      this.cityName = region.cityName;
      if (!this.addressDetail) {
        this.addressDetail = `${region.provinceName}${region.cityName}`;
      }
    },
    getLocation() {
      common_vendor.index.getLocation({
        type: "wgs84",
        success: (res) => {
          this.latitude = String(res.latitude.toFixed(6));
          this.longitude = String(res.longitude.toFixed(6));
        },
        fail: () => {
          const offsetLat = (Math.random() - 0.5) * 0.1;
          const offsetLng = (Math.random() - 0.5) * 0.1;
          this.latitude = String((31.2304 + offsetLat).toFixed(6));
          this.longitude = String((121.4737 + offsetLng).toFixed(6));
        }
      });
    },
    useDevTransitLocation() {
      this.provinceId = "310000";
      this.provinceName = "上海市";
      this.cityId = "310100";
      this.cityName = "上海市";
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
        common_vendor.index.showToast({ title: "请输入详细在途位置", icon: "none" });
        return false;
      }
      if (!this.latitude || !this.longitude) {
        common_vendor.index.showToast({ title: "请输入正确的经纬度坐标", icon: "none" });
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
  const _easycom_region_picker2 = common_vendor.resolveComponent("region-picker");
  _easycom_region_picker2();
}
const _easycom_region_picker = () => "../../components/region-picker/region-picker.js";
if (!Math) {
  _easycom_region_picker();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.provinceName
  }, $data.provinceName ? {
    b: common_vendor.t($data.provinceName),
    c: common_vendor.t($data.cityName)
  } : {}, {
    d: common_vendor.o((...args) => $options.openRegionPicker && $options.openRegionPicker(...args), "b4"),
    e: $data.addressDetail,
    f: common_vendor.o(($event) => $data.addressDetail = $event.detail.value, "4f"),
    g: $data.latitude,
    h: common_vendor.o(($event) => $data.latitude = $event.detail.value, "3f"),
    i: $data.longitude,
    j: common_vendor.o(($event) => $data.longitude = $event.detail.value, "a3"),
    k: common_vendor.o((...args) => $options.getLocation && $options.getLocation(...args), "4e"),
    l: $data.remark,
    m: common_vendor.o(($event) => $data.remark = $event.detail.value, "0b"),
    n: common_vendor.sr("regionPicker", "279348e8-0"),
    o: common_vendor.o($options.onRegionSelect, "93"),
    p: common_vendor.p({
      title: "选择当前省市"
    }),
    q: $data.submitting,
    r: common_vendor.o((...args) => $options.submit && $options.submit(...args), "6d")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
