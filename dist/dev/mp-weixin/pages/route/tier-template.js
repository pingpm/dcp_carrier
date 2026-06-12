"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      templates: [],
      newTemplateName: "",
      newItems: [
        { startKm: "0", endKm: "50", priceYuan: "5.00" },
        { startKm: "51", endKm: "100", priceYuan: "4.50" }
      ],
      submitting: false
    };
  },
  onLoad() {
    if (common_vendor.requireLogin())
      this.loadTemplates();
  },
  methods: {
    async loadTemplates() {
      try {
        const res = await common_vendor.api.tierTemplates();
        this.templates = res.items || [];
      } catch (err) {
      }
    },
    addTierItem() {
      let start = "0";
      if (this.newItems.length > 0) {
        const last = this.newItems[this.newItems.length - 1];
        if (last.endKm) {
          start = String(Number(last.endKm) + 1);
        }
      }
      this.newItems.push({ startKm: start, endKm: "", priceYuan: "" });
    },
    removeTierItem(index) {
      this.newItems.splice(index, 1);
    },
    validate() {
      if (!this.newTemplateName.trim()) {
        common_vendor.index.showToast({ title: "请输入模板名称", icon: "none" });
        return false;
      }
      if (this.newItems.length === 0) {
        common_vendor.index.showToast({ title: "请至少添加一个阶梯区间", icon: "none" });
        return false;
      }
      for (let i = 0; i < this.newItems.length; i++) {
        const item = this.newItems[i];
        if (item.startKm === "" || !item.priceYuan) {
          common_vendor.index.showToast({ title: `第 ${i + 1} 个区间的起始公里与单价必填`, icon: "none" });
          return false;
        }
      }
      return true;
    },
    async createTemplate() {
      if (!this.validate())
        return;
      this.submitting = true;
      try {
        const payload = {
          templateName: this.newTemplateName,
          items: this.newItems.map((item) => ({
            startKm: Number(item.startKm),
            endKm: item.endKm ? Number(item.endKm) : null,
            pricePerKmCent: common_vendor.yuanToCent(item.priceYuan)
          }))
        };
        await common_vendor.api.createTierTemplate(payload);
        common_vendor.index.showToast({ title: "价格模板新建成功", icon: "success" });
        this.newTemplateName = "";
        this.newItems = [
          { startKm: "0", endKm: "50", priceYuan: "5.00" },
          { startKm: "51", endKm: "100", priceYuan: "4.50" }
        ];
        this.loadTemplates();
      } catch (err) {
        console.error(err);
      } finally {
        this.submitting = false;
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.newTemplateName,
    b: common_vendor.o(($event) => $data.newTemplateName = $event.detail.value, "f9"),
    c: common_vendor.o((...args) => $options.addTierItem && $options.addTierItem(...args), "d1"),
    d: common_vendor.f($data.newItems, (item, index, i0) => {
      return {
        a: item.startKm,
        b: common_vendor.o(($event) => item.startKm = $event.detail.value, index),
        c: item.endKm,
        d: common_vendor.o(($event) => item.endKm = $event.detail.value, index),
        e: item.priceYuan,
        f: common_vendor.o(($event) => item.priceYuan = $event.detail.value, index),
        g: common_vendor.o(($event) => $options.removeTierItem(index), index),
        h: index
      };
    }),
    e: $data.submitting,
    f: common_vendor.o((...args) => $options.createTemplate && $options.createTemplate(...args), "81"),
    g: common_vendor.t($data.templates.length),
    h: $data.templates.length === 0
  }, $data.templates.length === 0 ? {} : {
    i: common_vendor.f($data.templates, (t, k0, i0) => {
      return {
        a: common_vendor.t(t.templateName),
        b: common_vendor.f(t.items, (rule, idx, i1) => {
          return {
            a: common_vendor.t(rule.startKm),
            b: common_vendor.t(rule.endKm || "∞"),
            c: common_vendor.t((rule.pricePerKmCent / 100).toFixed(2)),
            d: idx
          };
        }),
        c: t.id
      };
    })
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
