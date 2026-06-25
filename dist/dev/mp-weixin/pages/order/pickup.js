"use strict";
const common_vendor = require("../../common/vendor.js");
const CarrierImageUploader = () => "../../components/carrier-image-uploader/carrier-image-uploader.js";
const _sfc_main = {
  components: {
    CarrierImageUploader
  },
  data() {
    return {
      orderId: "",
      checkingDriver: false,
      remark: "",
      mediaFiles: [],
      pickupExampleImage: "",
      mediaMinCount: 1,
      mediaMaxCount: 9,
      uploading: false,
      submitting: false
    };
  },
  onLoad(options) {
    if (!common_vendor.requireLogin())
      return;
    this.orderId = options.orderId;
    this.loadExampleImages();
    this.loadMediaLimits();
    this.ensurePickupDriver();
  },
  computed: {
    mediaLimitTip() {
      return `请上传${this.mediaMinCount}-${this.mediaMaxCount}张现场验车照片（需包含车辆四周外表）`;
    }
  },
  methods: {
    async loadExampleImages() {
      try {
        const data = await common_vendor.api.exampleImageConfigs();
        const item = (data.items || []).find(
          (config) => config.urlKey === "carrier_pickup_photo_example_url"
        );
        this.pickupExampleImage = (item == null ? void 0 : item.enabled) && (item == null ? void 0 : item.url) ? item.url : "";
      } catch (error) {
        this.pickupExampleImage = "";
      }
    },
    async loadMediaLimits() {
      try {
        const data = await common_vendor.api.carrierOrderMediaLimits();
        const pickup = data.pickup || {};
        this.mediaMinCount = Number(pickup.minCount) || 1;
        this.mediaMaxCount = Number(pickup.maxCount) || 9;
      } catch (error) {
        this.mediaMinCount = 1;
        this.mediaMaxCount = 9;
      }
    },
    async ensurePickupDriver() {
      var _a;
      if (!this.orderId || this.checkingDriver)
        return;
      this.checkingDriver = true;
      try {
        const data = await common_vendor.api.orderDetail(this.orderId);
        const pickupDriver = (_a = data.order) == null ? void 0 : _a.driverInfo;
        if (!(pickupDriver == null ? void 0 : pickupDriver.driverName) || !(pickupDriver == null ? void 0 : pickupDriver.driverPhone)) {
          common_vendor.index.showModal({
            title: "请先设置提车司机",
            content: "确认提车前必须先设置提车司机。您可以立即设置，也可以稍后再操作。",
            confirmText: "去设置",
            cancelText: "稍后",
            confirmColor: "#1677ff",
            success: (res) => {
              if (res.confirm) {
                common_vendor.index.redirectTo({
                  url: `/pages/order/driver-form?orderId=${this.orderId}&driverType=PICKUP`
                });
              } else {
                if (getCurrentPages().length > 1) {
                  common_vendor.index.navigateBack();
                } else {
                  common_vendor.index.redirectTo({ url: `/pages/order/detail?orderId=${this.orderId}` });
                }
              }
            }
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        this.checkingDriver = false;
      }
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
      if (this.mediaFiles.length < this.mediaMinCount) {
        common_vendor.index.showToast({ title: `请至少上传${this.mediaMinCount}张验车图片`, icon: "none" });
        return false;
      }
      if (this.mediaFiles.length > this.mediaMaxCount) {
        common_vendor.index.showToast({ title: `最多上传${this.mediaMaxCount}张验车图片`, icon: "none" });
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
  const _easycom_carrier_image_uploader2 = common_vendor.resolveComponent("carrier-image-uploader");
  _easycom_carrier_image_uploader2();
}
const _easycom_carrier_image_uploader = () => "../../components/carrier-image-uploader/carrier-image-uploader.js";
if (!Math) {
  _easycom_carrier_image_uploader();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.o(($event) => $data.uploading = $event, "7a"),
    b: common_vendor.o(($event) => $data.mediaFiles = $event, "ba"),
    c: common_vendor.p({
      title: "验车影像资料",
      tip: $options.mediaLimitTip,
      ["usage-scene"]: "PICKUP_INSPECTION",
      ["max-count"]: $data.mediaMaxCount,
      ["add-text"]: "添加图片",
      required: true,
      compact: true,
      ["example-src"]: $data.pickupExampleImage,
      modelValue: $data.mediaFiles
    }),
    d: $data.remark,
    e: common_vendor.o(($event) => $data.remark = $event.detail.value, "da"),
    f: $data.submitting,
    g: common_vendor.o((...args) => $options.submit && $options.submit(...args), "bd")
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
