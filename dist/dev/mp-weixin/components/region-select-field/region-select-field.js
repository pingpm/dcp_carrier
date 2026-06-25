"use strict";
const common_vendor = require("../../common/vendor.js");
const RegionPicker = () => "../region-picker/region-picker.js";
const _sfc_main = {
  name: "RegionSelectField",
  components: {
    RegionPicker
  },
  props: {
    label: {
      type: String,
      default: ""
    },
    required: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: "选择省市"
    },
    placeholder: {
      type: String,
      default: "选择省份与城市"
    },
    provinceName: {
      type: String,
      default: ""
    },
    cityName: {
      type: String,
      default: ""
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    displayText() {
      if (!this.provinceName || !this.cityName)
        return "";
      return `${this.provinceName} · ${this.cityName}`;
    }
  },
  methods: {
    open() {
      if (this.disabled) {
        this.$emit("disabled-click");
        return;
      }
      this.$refs.regionPicker.open();
    },
    onSelect(region) {
      this.$emit("select", region);
    }
  }
};
if (!Array) {
  const _easycom_region_picker2 = common_vendor.resolveComponent("region-picker");
  _easycom_region_picker2();
}
const _easycom_region_picker = () => "../region-picker/region-picker.js";
if (!Math) {
  _easycom_region_picker();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $props.label
  }, $props.label ? common_vendor.e({
    b: common_vendor.t($props.label),
    c: $props.required
  }, $props.required ? {} : {}) : {}, {
    d: $options.displayText
  }, $options.displayText ? {
    e: common_vendor.t($options.displayText)
  } : {
    f: common_vendor.t($props.placeholder)
  }, {
    g: $props.disabled ? 1 : "",
    h: common_vendor.o((...args) => $options.open && $options.open(...args), "af"),
    i: common_vendor.sr("regionPicker", "372263a9-0"),
    j: common_vendor.o($options.onSelect, "02"),
    k: common_vendor.p({
      title: $props.title
    })
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
