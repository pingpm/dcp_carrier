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
      pickupTime: "",
      provinceId: "",
      provinceName: "",
      cityId: "",
      cityName: "",
      addressDetail: "",
      remark: "",
      mediaFiles: [],
      // Array of { fileId, fileUrl }
      uploading: false,
      submitting: false
    };
  },
  onLoad(options) {
    if (!common_vendor.requireLogin())
      return;
    this.orderId = options.orderId;
    const d = /* @__PURE__ */ new Date();
    this.pickupTime = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  },
  methods: {
    onDateChange(e) {
      this.pickupTime = e.detail.value;
    },
    openRegionPicker() {
      this.$refs.regionPicker.open();
    },
    onRegionSelect(region) {
      this.provinceId = region.provinceId;
      this.provinceName = region.provinceName;
      this.cityId = region.cityId;
      this.cityName = region.cityName;
    },
    previewImg(url) {
      common_vendor.index.previewImage({ urls: [url] });
    },
    chooseMedia() {
      if (this.uploading)
        return;
      common_vendor.index.chooseImage({
        count: 9 - this.mediaFiles.length,
        success: async (res) => {
          this.uploading = true;
          try {
            for (const path of res.tempFilePaths) {
              const file = await common_vendor.uploadFile(path, "IMAGE", "PICKUP_VERIFICATION");
              this.mediaFiles.push({ fileId: file.fileId, fileUrl: file.fileUrl });
            }
          } finally {
            this.uploading = false;
          }
        }
      });
    },
    deleteFile(index) {
      this.mediaFiles.splice(index, 1);
    },
    async useDevPickupPhotos() {
      if (this.uploading)
        return;
      this.uploading = true;
      try {
        const files = await Promise.all([
          common_vendor.api.importDevTestFile("test/carrier/pick_up_photo1.png", "IMAGE"),
          common_vendor.api.importDevTestFile("test/carrier/pick_up_photo2.png", "IMAGE")
        ]);
        this.mediaFiles.push(
          ...files.map((file) => ({ fileId: file.fileId, fileUrl: file.fileUrl }))
        );
      } finally {
        this.uploading = false;
      }
    },
    validate() {
      if (!this.pickupTime) {
        common_vendor.index.showToast({ title: "请选择提车时间", icon: "none" });
        return false;
      }
      if (!this.provinceName || !this.cityName) {
        common_vendor.index.showToast({ title: "请选择提车省市", icon: "none" });
        return false;
      }
      if (!this.addressDetail.trim()) {
        common_vendor.index.showToast({ title: "请输入提车详细地址", icon: "none" });
        return false;
      }
      if (!this.mediaFiles.length) {
        common_vendor.index.showToast({ title: "请上传至少一张验车图片", icon: "none" });
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
          pickupTime: new Date(this.pickupTime).toISOString(),
          address: {
            provinceId: this.provinceId,
            provinceName: this.provinceName,
            cityId: this.cityId,
            cityName: this.cityName,
            detail: this.addressDetail
          },
          mediaFileIds: this.mediaFiles.map((f) => f.fileId),
          remark: this.remark
        };
        await common_vendor.api.pickup(this.orderId, payload);
        common_vendor.index.showToast({ title: "提车确认成功", icon: "success" });
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
    a: common_vendor.t($data.pickupTime || "选择提车日期"),
    b: common_vendor.o((...args) => $options.onDateChange && $options.onDateChange(...args), "69"),
    c: $data.provinceName
  }, $data.provinceName ? {
    d: common_vendor.t($data.provinceName),
    e: common_vendor.t($data.cityName)
  } : {}, {
    f: common_vendor.o((...args) => $options.openRegionPicker && $options.openRegionPicker(...args), "6f"),
    g: $data.addressDetail,
    h: common_vendor.o(($event) => $data.addressDetail = $event.detail.value, "c0"),
    i: $data.remark,
    j: common_vendor.o(($event) => $data.remark = $event.detail.value, "bb"),
    k: common_vendor.t($data.mediaFiles.length),
    l: common_vendor.n($data.mediaFiles.length ? "status-success" : "status-warning"),
    m: common_vendor.f($data.mediaFiles, (file, index, i0) => {
      return {
        a: file.fileUrl,
        b: common_vendor.o(($event) => $options.previewImg(file.fileUrl), file.fileId),
        c: common_vendor.o(($event) => $options.deleteFile(index), file.fileId),
        d: file.fileId
      };
    }),
    n: $data.mediaFiles.length < 9
  }, $data.mediaFiles.length < 9 ? {
    o: common_vendor.t($data.uploading ? "⏳" : "+"),
    p: common_vendor.t($data.uploading ? "上传中..." : "添加图片"),
    q: common_vendor.o((...args) => $options.chooseMedia && $options.chooseMedia(...args), "cb")
  } : {}, {
    r: common_vendor.sr("regionPicker", "205a0fb5-0"),
    s: common_vendor.o($options.onRegionSelect, "4b"),
    t: common_vendor.p({
      title: "选择提车省市"
    }),
    v: $data.submitting,
    w: common_vendor.o((...args) => $options.submit && $options.submit(...args), "25")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
