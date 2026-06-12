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
      handoverTime: "",
      provinceId: "",
      provinceName: "",
      cityId: "",
      cityName: "",
      addressDetail: "",
      remark: "",
      photoFiles: [],
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
    this.handoverTime = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    this.loadOrderDestination();
  },
  methods: {
    async loadOrderDestination() {
      try {
        const res = await common_vendor.api.orderDetail(this.orderId);
        const order = res.order || {};
        if (order.destination) {
          const dest = order.destination;
          this.provinceId = dest.provinceId || "";
          this.provinceName = dest.provinceName || "";
          this.cityId = dest.cityId || "";
          this.cityName = dest.cityName || "";
          this.addressDetail = dest.detail || dest.addressDetail || "";
          return;
        }
        this.provinceId = order.destinationProvinceId || "";
        this.provinceName = order.destinationProvinceName || "";
        this.cityId = order.destinationCityId || "";
        this.cityName = order.destinationCityName || "";
        this.addressDetail = order.destinationAddressDetail || "";
      } catch (err) {
      }
    },
    onDateChange(e) {
      this.handoverTime = e.detail.value;
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
        count: 9 - this.photoFiles.length,
        success: async (res) => {
          this.uploading = true;
          try {
            for (const path of res.tempFilePaths) {
              const file = await common_vendor.uploadFile(path, "IMAGE", "HANDOVER_VERIFICATION");
              this.photoFiles.push({ fileId: file.fileId, fileUrl: file.fileUrl });
            }
          } finally {
            this.uploading = false;
          }
        }
      });
    },
    deleteFile(index) {
      this.photoFiles.splice(index, 1);
    },
    async useDevHandoverPhotos() {
      if (this.uploading)
        return;
      this.uploading = true;
      try {
        const files = await Promise.all([
          common_vendor.api.importDevTestFile("test/carrier/delivery_photo1.png", "IMAGE"),
          common_vendor.api.importDevTestFile("test/carrier/delivery_photo2.png", "IMAGE")
        ]);
        this.photoFiles.push(
          ...files.map((file) => ({ fileId: file.fileId, fileUrl: file.fileUrl }))
        );
      } finally {
        this.uploading = false;
      }
    },
    validate() {
      if (!this.handoverTime) {
        common_vendor.index.showToast({ title: "请选择交车时间", icon: "none" });
        return false;
      }
      if (!this.provinceName || !this.cityName) {
        common_vendor.index.showToast({ title: "请选择送达省市", icon: "none" });
        return false;
      }
      if (!this.addressDetail.trim()) {
        common_vendor.index.showToast({ title: "请输入交车详细地址", icon: "none" });
        return false;
      }
      if (!this.photoFiles.length) {
        common_vendor.index.showToast({ title: "请至少上传一张交收签收照片凭证", icon: "none" });
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
          handoverTime: new Date(this.handoverTime).toISOString(),
          address: {
            provinceId: this.provinceId,
            provinceName: this.provinceName,
            cityId: this.cityId,
            cityName: this.cityName,
            detail: this.addressDetail
          },
          photoFileIds: this.photoFiles.map((f) => f.fileId),
          remark: this.remark
        };
        await common_vendor.api.handover(this.orderId, payload);
        common_vendor.index.showToast({ title: "交车送达提交成功", icon: "success" });
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
    a: common_vendor.t($data.handoverTime || "选择交车日期"),
    b: common_vendor.o((...args) => $options.onDateChange && $options.onDateChange(...args), "ea"),
    c: $data.provinceName
  }, $data.provinceName ? {
    d: common_vendor.t($data.provinceName),
    e: common_vendor.t($data.cityName)
  } : {}, {
    f: common_vendor.o((...args) => $options.openRegionPicker && $options.openRegionPicker(...args), "0a"),
    g: $data.addressDetail,
    h: common_vendor.o(($event) => $data.addressDetail = $event.detail.value, "64"),
    i: $data.remark,
    j: common_vendor.o(($event) => $data.remark = $event.detail.value, "3e"),
    k: common_vendor.t($data.photoFiles.length),
    l: common_vendor.n($data.photoFiles.length ? "status-success" : "status-warning"),
    m: common_vendor.f($data.photoFiles, (file, index, i0) => {
      return {
        a: file.fileUrl,
        b: common_vendor.o(($event) => $options.previewImg(file.fileUrl), file.fileId),
        c: common_vendor.o(($event) => $options.deleteFile(index), file.fileId),
        d: file.fileId
      };
    }),
    n: $data.photoFiles.length < 9
  }, $data.photoFiles.length < 9 ? {
    o: common_vendor.t($data.uploading ? "⏳" : "+"),
    p: common_vendor.t($data.uploading ? "上传中..." : "添加图片"),
    q: common_vendor.o((...args) => $options.chooseMedia && $options.chooseMedia(...args), "e1")
  } : {}, {
    r: common_vendor.sr("regionPicker", "2a4b933c-0"),
    s: common_vendor.o($options.onRegionSelect, "f0"),
    t: common_vendor.p({
      title: "选择交车省市"
    }),
    v: $data.submitting,
    w: common_vendor.o((...args) => $options.submit && $options.submit(...args), "78")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
