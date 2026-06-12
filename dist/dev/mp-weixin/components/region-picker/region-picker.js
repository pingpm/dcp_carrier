"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  name: "RegionPicker",
  props: {
    title: {
      type: String,
      default: "选择地区"
    }
  },
  data() {
    return {
      visible: false,
      animating: false,
      loading: false,
      activeTab: "province",
      // 'province' | 'city'
      provinces: [],
      cities: [],
      selectedProvince: null,
      selectedCity: null
    };
  },
  computed: {
    currentList() {
      return this.activeTab === "province" ? this.provinces : this.cities;
    }
  },
  methods: {
    open() {
      this.activeTab = "province";
      this.selectedProvince = null;
      this.selectedCity = null;
      this.cities = [];
      this.visible = true;
      this.$nextTick(() => {
        setTimeout(() => {
          this.animating = true;
        }, 50);
      });
      if (this.provinces.length === 0) {
        this.loadProvinces();
      }
    },
    close() {
      this.animating = false;
      setTimeout(() => {
        this.visible = false;
      }, 300);
    },
    switchTab(tab) {
      if (tab === "city" && !this.selectedProvince)
        return;
      this.activeTab = tab;
    },
    async loadProvinces() {
      this.loading = true;
      try {
        const res = await common_vendor.api.regions(null, "PROVINCE");
        this.provinces = res.items || [];
      } catch (err) {
        common_vendor.index.showToast({ title: "加载地区失败", icon: "none" });
      } finally {
        this.loading = false;
      }
    },
    async loadCities(provinceId) {
      this.loading = true;
      try {
        const res = await common_vendor.api.regions(provinceId, "CITY");
        this.cities = res.items || [];
      } catch (err) {
        common_vendor.index.showToast({ title: "加载城市失败", icon: "none" });
      } finally {
        this.loading = false;
      }
    },
    isSelected(item) {
      if (this.activeTab === "province") {
        return this.selectedProvince && this.selectedProvince.id === item.id;
      } else {
        return this.selectedCity && this.selectedCity.id === item.id;
      }
    },
    async selectItem(item) {
      if (this.activeTab === "province") {
        this.selectedProvince = item;
        this.selectedCity = null;
        this.cities = [];
        this.activeTab = "city";
        await this.loadCities(item.id);
      } else {
        this.selectedCity = item;
        this.$emit("select", {
          provinceId: this.selectedProvince.id,
          provinceName: this.selectedProvince.regionName,
          cityId: item.id,
          cityName: item.regionName
        });
        this.close();
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.visible
  }, $data.visible ? common_vendor.e({
    b: $data.animating ? 1 : "",
    c: common_vendor.o((...args) => $options.close && $options.close(...args), "2a"),
    d: common_vendor.t($props.title),
    e: common_vendor.o((...args) => $options.close && $options.close(...args), "6c"),
    f: common_vendor.t($data.selectedProvince ? $data.selectedProvince.regionName : "选择省份"),
    g: $data.activeTab === "province" ? 1 : "",
    h: common_vendor.o(($event) => $options.switchTab("province"), "2c"),
    i: $data.selectedProvince
  }, $data.selectedProvince ? {
    j: common_vendor.t($data.selectedCity ? $data.selectedCity.regionName : "选择城市"),
    k: $data.activeTab === "city" ? 1 : "",
    l: common_vendor.o(($event) => $options.switchTab("city"), "cf")
  } : {}, {
    m: $data.loading
  }, $data.loading ? {} : common_vendor.e({
    n: common_vendor.f($options.currentList, (item, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t(item.regionName),
        b: $options.isSelected(item)
      }, $options.isSelected(item) ? {} : {}, {
        c: item.id,
        d: $options.isSelected(item) ? 1 : "",
        e: common_vendor.o(($event) => $options.selectItem(item), item.id)
      });
    }),
    o: $options.currentList.length === 0
  }, $options.currentList.length === 0 ? {} : {}), {
    p: $data.animating ? 1 : ""
  }) : {});
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
